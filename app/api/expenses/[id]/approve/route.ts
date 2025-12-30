import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import DailyExpenseModel from "@/app/api/models/DailyExpense";
import MemberModel from "@/app/api/models/Member";

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

    // Get all members count
    const memberCount = await MemberModel.countDocuments();
    
    if (memberCount > 0) {
      // Calculate expense per member
      const expensePerMember = totalExpenseAmount / memberCount;

      // Update all members' totalExpense and recalculate balanceDue
      const members = await MemberModel.find().lean();
      const updatePromises = members.map(async (member: any) => {
        const newTotalExpense = member.totalExpense + expensePerMember;
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
    }

    return NextResponse.json({
      success: true,
      message: "Expense approved and added to total expense",
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

