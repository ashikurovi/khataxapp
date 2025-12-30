import { NextRequest, NextResponse } from "next/server";
import { HeshabWithUser } from "@/types";
import connectDB from "@/lib/db";
import HeshabModel from "@/app/api/models/Heshab";
import * as XLSX from "xlsx";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    const query: any = {};
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);

    const heshabRecords = await HeshabModel.find(query).populate("userId").lean();

    const heshabWithUser: HeshabWithUser[] = heshabRecords.map((heshab: any) => ({
      id: heshab._id.toString(),
      userId: heshab.userId._id.toString(),
      deposit: heshab.deposit,
      previousBalance: heshab.previousBalance,
      perExtra: heshab.perExtra,
      totalExpense: heshab.totalExpense,
      currentBalance: heshab.currentBalance,
      due: heshab.due || (heshab.currentBalance < 0 ? Math.abs(heshab.currentBalance) : 0),
      month: heshab.month,
      year: heshab.year,
      createdAt: heshab.createdAt,
      updatedAt: heshab.updatedAt,
      user: {
        id: heshab.userId._id.toString(),
        name: heshab.userId.name,
        dept: heshab.userId.dept,
        institute: heshab.userId.institute,
        phone: heshab.userId.phone,
        email: heshab.userId.email,
        picture: heshab.userId.picture,
        googleId: heshab.userId.googleId,
        role: heshab.userId.role,
        createdAt: heshab.userId.createdAt,
        updatedAt: heshab.userId.updatedAt,
      },
    }));

    // Calculate totals
    const totalDeposit = heshabWithUser.reduce((sum, h) => sum + h.deposit, 0);
    const totalPerExtra = heshabWithUser.reduce((sum, h) => sum + h.perExtra, 0);
    const totalExpense = heshabWithUser.reduce((sum, h) => sum + h.totalExpense, 0);
    const totalBorder = heshabWithUser.reduce((sum, h) => sum + (h.currentBalance > 0 ? h.currentBalance : 0), 0);
    const totalManagerReceivable = heshabWithUser.reduce((sum, h) => sum + h.due, 0);

    // Prepare data for Excel
    const excelData: Array<{
      "Member Name": string;
      "Department": string;
      "Institute": string;
      "Phone": string;
      "Email": string;
      "Deposit": number;
      "Per Extra": number;
      "Total Expense": number;
      "Border": number;
      "Manager Receivable": number;
      "Month": number | string;
      "Year": number | string;
    }> = heshabWithUser.map((heshab) => ({
      "Member Name": heshab.user.name,
      "Department": heshab.user.dept,
      "Institute": heshab.user.institute,
      "Phone": heshab.user.phone,
      "Email": heshab.user.email,
      "Deposit": heshab.deposit,
      "Per Extra": heshab.perExtra,
      "Total Expense": heshab.totalExpense,
      "Border": heshab.currentBalance > 0 ? heshab.currentBalance : 0,
      "Manager Receivable": heshab.due,
      "Month": heshab.month,
      "Year": heshab.year,
    }));

    // Add totals row
    excelData.push({
      "Member Name": "TOTALS",
      "Department": "",
      "Institute": "",
      "Phone": "",
      "Email": "",
      "Deposit": totalDeposit,
      "Per Extra": totalPerExtra,
      "Total Expense": totalExpense,
      "Border": totalBorder,
      "Manager Receivable": totalManagerReceivable,
      "Month": "",
      "Year": "",
    });

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Heshab");

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Generate filename
    const monthName = month ? new Date(parseInt(year || "2024"), parseInt(month) - 1).toLocaleString("default", { month: "long" }) : "All";
    const filename = `heshab_${monthName}_${year || "all"}.xlsx`;

    // Return Excel file
    return new NextResponse(excelBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("Export heshab to Excel error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to export heshab to Excel" },
      { status: 500 }
    );
  }
}

