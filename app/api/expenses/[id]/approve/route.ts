import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import DailyExpenseModel from "@/app/api/models/DailyExpense";
import MemberModel from "@/app/api/models/Member";
import HeshabModel from "@/app/api/models/Heshab";
import DailyExtraModel from "@/app/api/models/DailyExtra";

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

    // Get expense date and month/year
    const expenseDate = new Date(expense.date);
    const expenseMonth = expenseDate.getMonth() + 1; // getMonth() returns 0-11
    const expenseYear = expenseDate.getFullYear();

    // Calculate perExtra: (TOTAL of ALL daily extras) / total members
    // Get ALL daily extras (not filtered by month)
    const allDailyExtras = await DailyExtraModel.find().lean();
    const totalExtra = allDailyExtras.reduce((sum, extra) => sum + extra.amount, 0);
    const memberCount = await MemberModel.countDocuments();
    const perExtra = memberCount > 0 ? totalExtra / memberCount : 0;

    // Get all approved expenses for this month (including the one just approved)
    const approvedExpenses = await DailyExpenseModel.find({
      approved: true,
      date: {
        $gte: new Date(expenseYear, expenseMonth - 1, 1),
        $lt: new Date(expenseYear, expenseMonth, 1),
      },
    }).lean();

    // Calculate total expense: sum of all approved expenses (NOT including perExtra)
    const totalApprovedExpenseAmount = approvedExpenses.reduce(
      (sum, exp: any) => sum + exp.totalTK + exp.extra,
      0
    );
    const totalExpense = totalApprovedExpenseAmount; // Only approved expenses, perExtra is separate

    // Calculate expense amount for deposit deduction (totalTK + extra)
    const expenseAmount = expense.totalTK + expense.extra;

    // Get all members
    const members = await MemberModel.find().lean();
    
    if (members.length > 0) {
      // Update all members: subtract from deposit and add to totalExpense
      const memberUpdatePromises = members.map(async (member: any) => {
        // Subtract expense amount from deposit
        const newTotalDeposit = Math.max(0, member.totalDeposit - expenseAmount);
        // Add expense amount to totalExpense (manual totalExpense + new expense)
        const newTotalExpense = member.totalExpense + expenseAmount;
        // Calculate balance: deposit - (perExtra + totalExpense)
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
          totalDeposit: newTotalDeposit,
          totalExpense: newTotalExpense,
          balanceDue: newBalanceDue,
          border,
          managerReceivable,
          perExtra,
        });
      });

      await Promise.all(memberUpdatePromises);

      // Update Heshab records for the expense month/year
      const heshabRecords = await HeshabModel.find({
        month: expenseMonth,
        year: expenseYear,
      }).lean();

      const heshabUpdatePromises = heshabRecords.map(async (heshab: any) => {
        // Subtract expense amount from deposit
        const newDeposit = Math.max(0, heshab.deposit - expenseAmount);
        // Add expense amount to totalExpense (manual totalExpense + new expense)
        const newTotalExpense = heshab.totalExpense + expenseAmount;
        
        // Recalculate balance: deposit - (perExtra + totalExpense)
        const calculatedBalance = newDeposit - (perExtra + newTotalExpense);
        
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
          perExtra, // Update perExtra automatically
          totalExpense: newTotalExpense, // Update totalExpense automatically
          currentBalance,
          due,
        });
      });

      await Promise.all(heshabUpdatePromises);
    }

    return NextResponse.json({
      success: true,
      message: "Expense approved: totalExpense automatically calculated as perExtra + approved expenses",
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

