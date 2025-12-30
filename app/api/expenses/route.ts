import { NextRequest, NextResponse } from "next/server";
import { DailyExpenseWithUser } from "@/types";
import connectDB from "@/lib/db";
import DailyExpenseModel from "@/app/api/models/DailyExpense";
import UserModel from "@/app/api/models/User";
import MemberModel from "@/app/api/models/Member";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const expenses = await DailyExpenseModel.find()
      .populate("addedBy")
      .sort({ date: -1 })
      .lean();

    const expensesWithUser: DailyExpenseWithUser[] = expenses.map((expense: any) => {
      const addedBy = expense.addedBy && typeof expense.addedBy === 'object' ? expense.addedBy : null;
      
      return {
        id: expense._id.toString(),
        date: expense.date,
        addedBy: addedBy ? addedBy._id.toString() : null,
        bazarShop: expense.bazarShop,
        bazarListUpload: expense.bazarListUpload,
        totalTK: expense.totalTK,
        extra: expense.extra,
        notes: expense.notes,
        approved: expense.approved || false,
        createdAt: expense.createdAt,
        updatedAt: expense.updatedAt,
        addedByUser: addedBy ? {
          id: addedBy._id.toString(),
          name: addedBy.name,
          dept: addedBy.dept,
          institute: addedBy.institute,
          phone: addedBy.phone,
          email: addedBy.email,
          picture: addedBy.picture,
          googleId: addedBy.googleId,
          role: addedBy.role,
          createdAt: addedBy.createdAt,
          updatedAt: addedBy.updatedAt,
        } : null,
      };
    });

    return NextResponse.json({
      success: true,
      data: expensesWithUser,
    });
  } catch (error: any) {
    console.error("Fetch expenses error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const data = await request.json();

    // Get userId from headers (preferred) or request body (fallback)
    // User ID is optional - if not provided, expense will be created without an assigned user
    const addedBy = request.headers.get("x-user-id") || data.addedBy || data.userId || null;

    // Build expense object - addedBy is optional
    // Expenses are created as pending (approved: false) and only added to total expense when approved
    const expenseData: any = {
      date: new Date(data.date),
      bazarShop: data.bazarShop,
      bazarListUpload: data.bazarListUpload || "",
      totalTK: data.totalTK,
      extra: data.extra || 0,
      notes: data.notes || "",
      addedBy: addedBy || null, // Explicitly set to null if not provided
      approved: false, // New expenses are pending approval
    };

    const expense = await DailyExpenseModel.create(expenseData);

    // Note: Expense is NOT added to total expense here
    // It will be added when manager approves it via PATCH /expenses/[id]/approve

    return NextResponse.json({
      success: true,
      message: "Expense created successfully",
      data: { id: expense._id.toString() },
    });
  } catch (error: any) {
    console.error("Create expense error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create expense" },
      { status: 500 }
    );
  }
}

