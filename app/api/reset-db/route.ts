import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { verifyAuthWithRole } from "@/lib/auth";
import { UserRole } from "@/types";
import {
  UserModel,
  MemberModel,
  DailyExpenseModel,
  BazarListModel,
  TransactionModel,
  SemesterBreakModel,
  HeshabModel,
  DailyExtraModel,
  DepositLogModel,
} from "@/app/api/models";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Verify authentication and check for Manager or Admin role
    const { payload, error } = await verifyAuthWithRole(request, [
      UserRole.MANAGER,
      UserRole.ADMIN,
    ]);

    if (error || !payload) {
      return (
        error ||
        NextResponse.json(
          { success: false, error: "Authentication required" },
          { status: 401 }
        )
      );
    }

    // Delete all documents from all collections
    const deleteResults = await Promise.all([
      UserModel.deleteMany({}),
      MemberModel.deleteMany({}),
      DailyExpenseModel.deleteMany({}),
      BazarListModel.deleteMany({}),
      TransactionModel.deleteMany({}),
      SemesterBreakModel.deleteMany({}),
      HeshabModel.deleteMany({}),
      DailyExtraModel.deleteMany({}),
      DepositLogModel.deleteMany({}),
    ]);

    const totalDeleted = deleteResults.reduce(
      (sum, result) => sum + (result.deletedCount || 0),
      0
    );

    return NextResponse.json({
      success: true,
      message: "Database reset successfully",
      data: {
        totalDeleted,
        collections: {
          users: deleteResults[0].deletedCount || 0,
          members: deleteResults[1].deletedCount || 0,
          dailyExpenses: deleteResults[2].deletedCount || 0,
          bazarLists: deleteResults[3].deletedCount || 0,
          transactions: deleteResults[4].deletedCount || 0,
          semesterBreaks: deleteResults[5].deletedCount || 0,
          heshabs: deleteResults[6].deletedCount || 0,
          dailyExtras: deleteResults[7].deletedCount || 0,
          depositLogs: deleteResults[8].deletedCount || 0,
        },
      },
    });
  } catch (error: any) {
    console.error("Reset DB error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to reset database" },
      { status: 500 }
    );
  }
}

