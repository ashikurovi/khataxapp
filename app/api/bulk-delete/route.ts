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
import { recalculatePerExtraForAllHeshab } from "@/lib/per-extra-calculator";

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

    const { table, ids } = await request.json();

    if (!table || !ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: "Table name and array of IDs are required" },
        { status: 400 }
      );
    }

    // Validate table name
    if (!modelMap[table]) {
      return NextResponse.json(
        { success: false, error: `Invalid table name: ${table}` },
        { status: 400 }
      );
    }

    const Model = modelMap[table];

    // Delete all documents with the provided IDs
    const deleteResult = await Model.deleteMany({
      _id: { $in: ids },
    });

    // If members were deleted, recalculate perExtra for all heshab records
    if (table === "members" && deleteResult.deletedCount > 0) {
      try {
        await recalculatePerExtraForAllHeshab();
      } catch (recalcError: any) {
        console.error("Error recalculating perExtra after member deletion:", recalcError);
        // Don't fail the request if recalculation fails
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${deleteResult.deletedCount} record(s) from ${table}`,
      data: {
        deletedCount: deleteResult.deletedCount,
        requestedCount: ids.length,
        table,
      },
    });
  } catch (error: any) {
    console.error("Bulk delete error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete records" },
      { status: 500 }
    );
  }
}

