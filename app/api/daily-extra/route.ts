import { NextRequest, NextResponse } from "next/server";
import { DailyExtraWithUser, UserRole } from "@/types";
import connectDB from "@/lib/db";
import DailyExtraModel from "@/app/api/models/DailyExtra";
import MemberModel from "@/app/api/models/Member";
import HeshabModel from "@/app/api/models/Heshab";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const dailyExtras = await DailyExtraModel.find()
      .populate("addedBy")
      .sort({ date: -1 })
      .lean();

    const dailyExtrasWithUser: DailyExtraWithUser[] = dailyExtras.map((extra: any) => {
      // Handle case where addedBy might be null (user deleted or populate failed)
      const addedByUser = extra.addedBy ? {
        id: extra.addedBy._id.toString(),
        name: extra.addedBy.name || "",
        dept: extra.addedBy.dept || "",
        institute: extra.addedBy.institute || "",
        phone: extra.addedBy.phone || "",
        email: extra.addedBy.email || "",
        picture: extra.addedBy.picture || "",
        googleId: extra.addedBy.googleId || "",
        role: extra.addedBy.role || UserRole.MEMBER,
        createdAt: extra.addedBy.createdAt || new Date(),
        updatedAt: extra.addedBy.updatedAt || new Date(),
      } : {
        id: "",
        name: "Unknown User",
        dept: "",
        institute: "",
        phone: "",
        email: "",
        picture: "",
        googleId: "",
        role: UserRole.MEMBER,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return {
        id: extra._id.toString(),
        reason: extra.reason,
        amount: extra.amount,
        date: extra.date,
        addedBy: extra.addedBy ? extra.addedBy._id.toString() : "",
        createdAt: extra.createdAt,
        updatedAt: extra.updatedAt,
        addedByUser,
      };
    });

    return NextResponse.json({
      success: true,
      data: dailyExtrasWithUser,
    });
  } catch (error: any) {
    console.error("Fetch daily extra error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch daily extras" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const data = await request.json();

    // TODO: Get userId from session/auth token
    // For now, using a query parameter (should be from auth token in production)
    const addedBy = data.addedBy || "507f1f77bcf86cd799439011"; // Placeholder

    const dailyExtra = await DailyExtraModel.create({
      reason: data.reason,
      amount: data.amount,
      date: new Date(data.date),
      addedBy,
    });

    // Get all members
    const members = await MemberModel.find().lean();
    const memberCount = members.length;

    // Update perExtra automatically in all heshab records (do NOT subtract from deposit)
    // Get ALL daily extras (not filtered by month) for perExtra calculation
    const allDailyExtras = await DailyExtraModel.find().lean();
    const totalExtra = allDailyExtras.reduce((sum, extra) => sum + extra.amount, 0);
    const updatedPerExtra = memberCount > 0 ? totalExtra / memberCount : 0;

    // Update all members: only update perExtra, keep deposit unchanged
    const memberUpdatePromises = members.map(async (member: any) => {
      // Keep deposit and totalExpense unchanged, only update perExtra
      const newTotalDeposit = member.totalDeposit; // Keep existing deposit
      const newTotalExpense = member.totalExpense; // Keep existing totalExpense (manual)
      const newBalanceDue = newTotalDeposit - (updatedPerExtra + newTotalExpense);
      
      // Calculate border and managerReceivable based on balance
      let border = 0;
      let managerReceivable = 0;
      
      if (newBalanceDue > 0) {
        border = newBalanceDue;
      } else if (newBalanceDue < 0) {
        managerReceivable = Math.abs(newBalanceDue);
      }

      await MemberModel.findByIdAndUpdate(member._id, {
        totalDeposit: newTotalDeposit, // Keep unchanged
        totalExpense: newTotalExpense,
        balanceDue: newBalanceDue,
        border,
        managerReceivable,
        perExtra: updatedPerExtra, // Update perExtra only
      });
    });

    // Update all heshab records: only update perExtra, keep deposit unchanged
    const allHeshabRecords = await HeshabModel.find().lean();
    const heshabUpdatePromises = allHeshabRecords.map(async (heshab: any) => {
      // Keep deposit unchanged, only update perExtra
      const newDeposit = heshab.deposit; // Keep existing deposit
      const newTotalExpense = heshab.totalExpense; // Keep existing totalExpense (manual)
      
      // Update perExtra automatically (calculated from all daily extras)
      const updatedPerExtra = memberCount > 0 ? totalExtra / memberCount : 0;
      
      // Recalculate balance: deposit - (perExtra + totalExpense)
      const calculatedBalance = newDeposit - (updatedPerExtra + newTotalExpense);
      
      // Calculate border and managerReceivable
      let border = 0;
      let due = 0;
      let currentBalance = calculatedBalance;
      
      if (calculatedBalance > 0) {
        border = calculatedBalance;
      } else if (calculatedBalance < 0) {
        due = Math.abs(calculatedBalance);
      }
      
      await HeshabModel.findByIdAndUpdate(heshab._id, {
        deposit: newDeposit, // Keep unchanged
        perExtra: updatedPerExtra, // Automatically calculated and updated
        totalExpense: newTotalExpense,
        currentBalance,
        due,
      });
    });
    
    // Execute all updates in parallel
    await Promise.all([...memberUpdatePromises, ...heshabUpdatePromises]);

    return NextResponse.json({
      success: true,
      data: dailyExtra,
      message: "Daily extra created successfully",
    });
  } catch (error: any) {
    console.error("Create daily extra error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create daily extra" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Daily extra ID is required" },
        { status: 400 }
      );
    }

    // Find the daily extra to get its date and amount
    const dailyExtra = await DailyExtraModel.findById(id);
    if (!dailyExtra) {
      return NextResponse.json(
        { success: false, error: "Daily extra not found" },
        { status: 404 }
      );
    }

    const date = new Date(dailyExtra.date);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const extraAmount = dailyExtra.amount;

    // Delete the daily extra
    await DailyExtraModel.findByIdAndDelete(id);

    // Recalculate perExtra: (TOTAL of ALL daily extras) / total members
    const allDailyExtras = await DailyExtraModel.find().lean();
    const totalExtra = allDailyExtras.reduce((sum, extra) => sum + extra.amount, 0);
    const memberCount = await MemberModel.countDocuments();
    const perExtra = memberCount > 0 ? totalExtra / memberCount : 0;

    // Update all members: only update perExtra, keep deposit unchanged (do NOT add back to deposit)
    const members = await MemberModel.find().lean();
    const memberUpdatePromises = members.map(async (member: any) => {
      // Keep deposit unchanged, only update perExtra
      const newTotalDeposit = member.totalDeposit; // Keep existing deposit
      const newTotalExpense = member.totalExpense; // Keep existing totalExpense (manual)
      const newBalanceDue = newTotalDeposit - (perExtra + newTotalExpense);
      
      // Calculate border and managerReceivable based on balance
      let border = 0;
      let managerReceivable = 0;
      
      if (newBalanceDue > 0) {
        border = newBalanceDue;
      } else if (newBalanceDue < 0) {
        managerReceivable = Math.abs(newBalanceDue);
      }

      await MemberModel.findByIdAndUpdate(member._id, {
        totalDeposit: newTotalDeposit, // Keep unchanged
        totalExpense: newTotalExpense,
        balanceDue: newBalanceDue,
        border,
        managerReceivable,
        perExtra, // Update perExtra only
      });
    });

    // Update ALL heshab records: only update perExtra, keep deposit unchanged (do NOT add back to deposit)
    const allHeshabRecords = await HeshabModel.find().lean();
    const heshabUpdatePromises = allHeshabRecords.map(async (heshab: any) => {
      // Keep deposit unchanged, only update perExtra
      const newDeposit = heshab.deposit; // Keep existing deposit
      const newTotalExpense = heshab.totalExpense; // Keep existing totalExpense (manual)
      
      // Update perExtra automatically (calculated from all daily extras)
      const updatedPerExtra = perExtra;
      
      // Recalculate balance: deposit - (perExtra + totalExpense)
      const calculatedBalance = newDeposit - (updatedPerExtra + newTotalExpense);
      
      // Calculate border and managerReceivable
      let border = 0;
      let due = 0;
      let currentBalance = calculatedBalance;
      
      if (calculatedBalance > 0) {
        border = calculatedBalance;
      } else if (calculatedBalance < 0) {
        due = Math.abs(calculatedBalance);
      }
      
      await HeshabModel.findByIdAndUpdate(heshab._id, {
        deposit: newDeposit, // Keep unchanged
        perExtra: updatedPerExtra, // Automatically calculated and updated
        totalExpense: newTotalExpense,
        currentBalance,
        due,
      });
    });
    
    // Execute all updates in parallel
    await Promise.all([...memberUpdatePromises, ...heshabUpdatePromises]);

    return NextResponse.json({
      success: true,
      message: "Daily extra deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete daily extra error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete daily extra" },
      { status: 500 }
    );
  }
}

