import { NextRequest, NextResponse } from "next/server";
import { DepositLogWithUser } from "@/types";
import connectDB from "@/lib/db";
import DepositLogModel from "@/app/api/models/DepositLog";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const heshabId = searchParams.get("heshabId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const query: any = {};
    if (userId) query.userId = userId;
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);
    if (heshabId) query.heshabId = heshabId;
    
    // Date range filtering
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const depositLogs = await DepositLogModel.find(query)
      .populate("userId")
      .sort({ date: -1 })
      .lean();

    const depositLogsWithUser: DepositLogWithUser[] = depositLogs.map((log: any) => ({
      id: log._id.toString(),
      userId: log.userId._id.toString(),
      heshabId: log.heshabId ? log.heshabId.toString() : undefined,
      amount: log.amount,
      date: log.date,
      month: log.month,
      year: log.year,
      description: log.description,
      createdAt: log.createdAt,
      updatedAt: log.updatedAt,
      user: {
        id: log.userId._id.toString(),
        name: log.userId.name,
        dept: log.userId.dept,
        institute: log.userId.institute,
        phone: log.userId.phone,
        email: log.userId.email,
        picture: log.userId.picture,
        googleId: log.userId.googleId,
        role: log.userId.role,
        createdAt: log.userId.createdAt,
        updatedAt: log.userId.updatedAt,
      },
    }));

    return NextResponse.json({
      success: true,
      data: depositLogsWithUser,
    });
  } catch (error: any) {
    console.error("Fetch deposit logs error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch deposit logs" },
      { status: 500 }
    );
  }
}

