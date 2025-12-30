import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import HeshabModel from "@/app/api/models/Heshab";
import MemberModel from "@/app/api/models/Member";
import DailyExtraModel from "@/app/api/models/DailyExtra";
import { EmailService } from "@/lib/email";
import { PDFGenerator } from "@/lib/pdf-generator";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { month, year } = await request.json();

    if (!month || !year) {
      return NextResponse.json(
        { success: false, error: "Month and year are required" },
        { status: 400 }
      );
    }

    // Get all members with their user data (including email)
    const allMembers = await MemberModel.find().populate("userId").lean();

    if (allMembers.length === 0) {
      return NextResponse.json(
        { success: false, error: "No members found" },
        { status: 404 }
      );
    }

    // Calculate perExtra from daily extras for the month
    const dailyExtras = await DailyExtraModel.find({
      date: {
        $gte: new Date(year, month - 1, 1),
        $lt: new Date(year, month, 1),
      },
    }).lean();

    const totalExtra = dailyExtras.reduce((sum, extra) => sum + extra.amount, 0);
    const memberCount = allMembers.length;
    const perExtra = memberCount > 0 ? totalExtra / memberCount : 0;

    // Get all heshab records for this month/year
    const heshabRecordsMap = new Map();
    const heshabRecords = await HeshabModel.find({ month, year })
      .populate("userId")
      .lean();
    
    heshabRecords.forEach((heshab: any) => {
      heshabRecordsMap.set(heshab.userId._id.toString(), heshab);
    });

    // Send invoice to all members
    const emailPromises = allMembers.map(async (member: any) => {
      const user = member.userId;
      if (!user || !user.email) return null;

      // Get heshab record for this member, or use default values
      const heshab = heshabRecordsMap.get(user._id.toString());
      
      // Use heshab data if exists, otherwise use member data with defaults
      const deposit = heshab?.deposit || member.totalDeposit || 0;
      const previousBalance = heshab?.previousBalance || member.previousDue || 0;
      const heshabPerExtra = heshab?.perExtra || perExtra;
      const totalExpense = heshab?.totalExpense || member.totalExpense || 0;
      const currentBalance = heshab?.currentBalance || (deposit + heshabPerExtra - totalExpense);
      const border = currentBalance > 0 ? currentBalance : 0;
      const managerReceivable = currentBalance < 0 ? Math.abs(currentBalance) : 0;

      // Generate invoice PDF
      const invoiceData = {
        member: {
          id: member._id.toString(),
          userId: user._id.toString(),
          totalDeposit: deposit,
          previousDue: previousBalance,
          perExtra: heshabPerExtra,
          totalExpense: totalExpense,
          balanceDue: currentBalance,
          border: border,
          managerReceivable: managerReceivable,
          createdAt: member.createdAt,
          updatedAt: member.updatedAt,
          user: {
            id: user._id.toString(),
            name: user.name,
            dept: user.dept,
            institute: user.institute,
            phone: user.phone,
            email: user.email,
            picture: user.picture,
            googleId: user.googleId,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
        },
        month,
        year,
        transactions: [],
        totalDeposit: deposit,
        totalExpense: totalExpense,
        balance: currentBalance,
        border: border,
        managerReceivable: managerReceivable,
      };

      const pdf = PDFGenerator.generateInvoice(invoiceData);
      const pdfBuffer = pdf.output("arraybuffer");

      // Calculate deposit information for display
      // For bulk send, we show total deposit as today's deposit and previous as 0
      const todayDeposit = deposit;
      const previousDeposit = previousBalance;
      const depositDateTime = new Date().toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });

      // Send email with invoice attachment (monthly invoice for bulk send)
      await EmailService.sendInvoiceEmail({
        to: user.email,
        memberName: user.name,
        month,
        year,
        deposit: deposit,
        previousBalance: previousBalance,
        perExtra: heshabPerExtra,
        totalExpense: totalExpense,
        currentBalance: currentBalance,
        pdfBuffer: Buffer.from(pdfBuffer),
        todayDeposit: todayDeposit > 0 ? todayDeposit : undefined,
        previousDeposit: previousDeposit > 0 ? previousDeposit : undefined,
        depositDateTime: depositDateTime,
        isMonthlyInvoice: true,
      });

      return { email: user.email, success: true };
    });

    const results = await Promise.allSettled(emailPromises);
    const successful = results.filter((r) => r.status === "fulfilled" && r.value !== null).length;
    const failed = results.length - successful;

    return NextResponse.json({
      success: true,
      message: `Invoices sent: ${successful} successful, ${failed} failed`,
      sent: successful,
      failed,
    });
  } catch (error: any) {
    console.error("Send invoices error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to send invoices" },
      { status: 500 }
    );
  }
}

