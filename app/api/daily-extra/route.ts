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
    
    // Get all members count
    const memberCount = await MemberModel.countDocuments();
    const perExtra = memberCount > 0 ? totalExtra / memberCount : 0;

    // Calculate the new daily extra amount per member (just this new entry)
    const newExtraPerMember = memberCount > 0 ? data.amount / memberCount : 0;

    // Update all members' totalExpense and recalculate balanceDue
    // This adds the daily extra to total expense, which subtracts from total deposit
    const members = await MemberModel.find().lean();
    const memberUpdatePromises = members.map(async (member: any) => {
      const newTotalExpense = member.totalExpense + newExtraPerMember;
      const newBalanceDue = member.totalDeposit - newTotalExpense;
      
      // Calculate border and managerReceivable based on balance
      let border = 0;
      let managerReceivable = 0;
      
      if (newBalanceDue > 0) {
        border = newBalanceDue;
      } else if (newBalanceDue < 0) {
        managerReceivable = Math.abs(newBalanceDue);
      }

      await MemberModel.findByIdAndUpdate(member._id, {
        totalExpense: newTotalExpense,
        balanceDue: newBalanceDue,
        border,
        managerReceivable,
      });
    });

    // Update all heshab records for this month - recalculate currentBalance and due
    const heshabRecords = await HeshabModel.find({ month, year }).lean();
    const heshabUpdatePromises = heshabRecords.map(async (heshab: any) => {
      const currentBalance = heshab.deposit + perExtra - heshab.totalExpense;
      const due = currentBalance < 0 ? Math.abs(currentBalance) : 0;
      
      await HeshabModel.findByIdAndUpdate(heshab._id, {
        perExtra,
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

