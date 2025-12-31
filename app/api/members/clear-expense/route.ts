import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import MemberModel from "@/app/api/models/Member";
import HeshabModel from "@/app/api/models/Heshab";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Get all members
    const members = await MemberModel.find().lean();

    // Clear total expense for all members and recalculate balance
    const updatePromises = members.map(async (member: any) => {
      const newTotalExpense = 0;
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

    await Promise.all(updatePromises);

    // Clear total expense in all Heshab records
    const heshabRecords = await HeshabModel.find().lean();
    const heshabUpdatePromises = heshabRecords.map(async (heshab: any) => {
      const newTotalExpense = 0;
      
      // Recalculate balance: (deposit + perExtra) - totalExpense
      const calculatedBalance = heshab.deposit + heshab.perExtra - newTotalExpense;
      
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
        totalExpense: newTotalExpense,
        currentBalance,
        due,
      });
    });

    await Promise.all(heshabUpdatePromises);

    return NextResponse.json({
      success: true,
      message: "Total expense cleared for all members and heshab records",
      data: {
        membersUpdated: members.length,
        heshabsUpdated: heshabRecords.length,
      },
    });
  } catch (error: any) {
    console.error("Clear expense error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to clear total expense" },
      { status: 500 }
    );
  }
}
