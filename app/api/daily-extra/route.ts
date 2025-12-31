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

    // Update perExtra in all heshab records for the same month
    const date = new Date(data.date);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    // Get all daily extras for this month
    const monthExtras = await DailyExtraModel.find({
      date: {
        $gte: new Date(year, month - 1, 1),
        $lt: new Date(year, month, 1),
      },
    }).lean();

    const totalExtra = monthExtras.reduce((sum, extra) => sum + extra.amount, 0);
    
    // Get all members
    const members = await MemberModel.find().lean();
    const memberCount = members.length;
    const perExtra = memberCount > 0 ? totalExtra / memberCount : 0;

    // Use full daily extra amount (not divided per member)
    const extraAmount = data.amount;

    // Update all members: subtract full amount from totalDeposit only (totalExpense is manual)
    const memberUpdatePromises = members.map(async (member: any) => {
      // Subtract full daily extra amount from deposit only, keep totalExpense unchanged (manual)
      const newTotalDeposit = Math.max(0, member.totalDeposit - extraAmount);
      const newTotalExpense = member.totalExpense; // Keep existing totalExpense (manual)
      const newBalanceDue = newTotalDeposit - newTotalExpense;
      
      // Calculate border and managerReceivable based on balance
      let border = 0;
      let managerReceivable = 0;
      
      if (newBalanceDue > 0) {
        border = newBalanceDue;
      } else if (newBalanceDue < 0) {
        managerReceivable = Math.abs(newBalanceDue);
      }

      await MemberModel.findByIdAndUpdate(member._id, {
        totalDeposit: newTotalDeposit,
        totalExpense: newTotalExpense,
        balanceDue: newBalanceDue,
        border,
        managerReceivable,
      });
    });

    // Update all heshab records for this month: subtract from deposit only (totalExpense is manual)
    const heshabRecords = await HeshabModel.find({ month, year }).lean();
    const heshabUpdatePromises = heshabRecords.map(async (heshab: any) => {
      // Subtract full daily extra amount from deposit only, keep totalExpense unchanged (manual)
      const newDeposit = Math.max(0, heshab.deposit - extraAmount);
      const newTotalExpense = heshab.totalExpense; // Keep existing totalExpense (manual)
      
      // Recalculate balance: (deposit + perExtra) - totalExpense
      const calculatedBalance = newDeposit + perExtra - newTotalExpense;
      
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
        deposit: newDeposit,
        perExtra,
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

