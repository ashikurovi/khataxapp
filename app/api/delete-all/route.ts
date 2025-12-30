import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
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

// Map table names to their models
const modelMap: Record<string, any> = {
  users: UserModel,
  members: MemberModel,
  dailyExpenses: DailyExpenseModel,
  bazarLists: BazarListModel,
  transactions: TransactionModel,
  semesterBreaks: SemesterBreakModel,
  heshabs: HeshabModel,
  dailyExtras: DailyExtraModel,
  depositLogs: DepositLogModel,
};

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { table } = await request.json();

    if (!table) {
      return NextResponse.json(
        { success: false, error: "Table name is required" },
        { status: 400 }
      );
    }

    // If table is "all", delete from all tables
    if (table === "all") {
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
        message: "All data deleted successfully",
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
    }

    // Validate table name
    if (!modelMap[table]) {
      return NextResponse.json(
        { success: false, error: `Invalid table name: ${table}` },
        { status: 400 }
      );
    }

    const Model = modelMap[table];

    // Delete all documents from the specified table
    const deleteResult = await Model.deleteMany({});

    return NextResponse.json({
      success: true,
      message: `Successfully deleted all records from ${table}`,
      data: {
        deletedCount: deleteResult.deletedCount || 0,
        table,
      },
    });
  } catch (error: any) {
    console.error("Delete all error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete records" },
      { status: 500 }
    );
  }
}

