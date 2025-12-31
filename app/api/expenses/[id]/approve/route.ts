import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import DailyExpenseModel from "@/app/api/models/DailyExpense";
import MemberModel from "@/app/api/models/Member";
import HeshabModel from "@/app/api/models/Heshab";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const expenseId = id;

    // Find the expense
    const expense = await DailyExpenseModel.findById(expenseId);
    if (!expense) {
      return NextResponse.json(
        { success: false, error: "Expense not found" },
        { status: 404 }
      );
    }

    // Check if already approved
    if (expense.approved) {
      return NextResponse.json(
        { success: false, error: "Expense is already approved" },
        { status: 400 }
      );
    }

    // Mark expense as approved
    expense.approved = true;
    await expense.save();

    // Calculate total expense amount (totalTK + extra)
    const totalExpenseAmount = expense.totalTK + expense.extra;

    // Get all members
    const members = await MemberModel.find().lean();
    const memberCount = members.length;
    
    if (memberCount > 0) {
      // Use full expense amount (not divided per member)
      const expenseAmount = totalExpenseAmount;

      // Update all members: add to totalExpense only (don't deduct from deposit if deposit exists)
      const updatePromises = members.map(async (member: any) => {
        // Keep deposit unchanged, only add to total expense
        const newTotalDeposit = member.totalDeposit; // Deposit remains unchanged
        const newTotalExpense = member.totalExpense + expenseAmount;
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

      await Promise.all(updatePromises);

      // Update Heshab records for the expense month/year
      const expenseDate = new Date(expense.date);
      const expenseMonth = expenseDate.getMonth() + 1; // getMonth() returns 0-11
      const expenseYear = expenseDate.getFullYear();

      // Update all Heshab records for this month/year
      const heshabRecords = await HeshabModel.find({
        month: expenseMonth,
        year: expenseYear,
      }).lean();

      const heshabUpdatePromises = heshabRecords.map(async (heshab: any) => {
        // Keep deposit unchanged, only add to total expense
        const newDeposit = heshab.deposit; // Deposit remains unchanged
        const newTotalExpense = heshab.totalExpense + expenseAmount;
        
        // Recalculate balance: (deposit + perExtra) - totalExpense
        const calculatedBalance = newDeposit + heshab.perExtra - newTotalExpense;
        
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
          totalExpense: newTotalExpense,
          currentBalance,
          due,
        });
      });

      await Promise.all(heshabUpdatePromises);
    }

    return NextResponse.json({
      success: true,
      message: "Expense approved: added to total expense (deposit unchanged)",
      data: { id: expense._id.toString() },
    });
  } catch (error: any) {
    console.error("Approve expense error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to approve expense" },
      { status: 500 }
    );
  }
}

