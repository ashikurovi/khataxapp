import { NextRequest, NextResponse } from "next/server";
import { DailyExpenseWithUser } from "@/types";
import connectDB from "@/lib/db";
import DailyExpenseModel from "@/app/api/models/DailyExpense";
import MemberModel from "@/app/api/models/Member";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const expenses = await DailyExpenseModel.find()
      .sort({ date: -1 })
      .lean();

    const expensesWithUser: DailyExpenseWithUser[] = expenses.map((expense: any) => {
      return {
        id: expense._id.toString(),
        date: expense.date,
        bazarShop: expense.bazarShop,
        bazarListUpload: expense.bazarListUpload,
        totalTK: expense.totalTK,
        extra: expense.extra,
        notes: expense.notes,
        approved: expense.approved || false,
        createdAt: expense.createdAt,
        updatedAt: expense.updatedAt,
        addedBy: null,
        addedByUser: null,
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
    
    // Parse request body with error handling
    let data;
    try {
      data = await request.json();
    } catch (parseError: any) {
      return NextResponse.json(
        { success: false, error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!data.date) {
      return NextResponse.json(
        { success: false, error: "Date is required" },
        { status: 400 }
      );
    }

    if (!data.bazarShop || typeof data.bazarShop !== 'string' || data.bazarShop.trim() === '') {
      return NextResponse.json(
        { success: false, error: "Bazar shop is required" },
        { status: 400 }
      );
    }

    if (data.totalTK === undefined || data.totalTK === null) {
      return NextResponse.json(
        { success: false, error: "Total TK is required" },
        { status: 400 }
      );
    }

    if (typeof data.totalTK !== 'number' || data.totalTK < 0) {
      return NextResponse.json(
        { success: false, error: "Total TK must be a non-negative number" },
        { status: 400 }
      );
    }

    // Validate and parse date
    let expenseDate: Date;
    try {
      expenseDate = new Date(data.date);
      if (isNaN(expenseDate.getTime())) {
        throw new Error("Invalid date");
      }
    } catch (dateError) {
      return NextResponse.json(
        { success: false, error: "Invalid date format" },
        { status: 400 }
      );
    }

    // Validate extra field if provided
    if (data.extra !== undefined && data.extra !== null) {
      if (typeof data.extra !== 'number' || data.extra < 0) {
        return NextResponse.json(
          { success: false, error: "Extra must be a non-negative number" },
          { status: 400 }
        );
      }
    }

    // Build expense object
    // Expenses are created as pending (approved: false) and only added to total expense when approved
    const expenseData: any = {
      date: expenseDate,
      bazarShop: data.bazarShop.trim(),
      bazarListUpload: data.bazarListUpload || "",
      totalTK: data.totalTK,
      extra: data.extra || 0,
      notes: data.notes || "",
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
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors || {}).map((err: any) => err.message).join(', ');
      return NextResponse.json(
        { success: false, error: `Validation error: ${validationErrors}` },
        { status: 400 }
      );
    }

    // Handle Mongoose cast errors (e.g., invalid ObjectId)
    if (error.name === 'CastError') {
      return NextResponse.json(
        { success: false, error: `Invalid data format: ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || "Failed to create expense" },
      { status: 500 }
    );
  }
}

