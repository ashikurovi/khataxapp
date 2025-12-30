import { NextRequest, NextResponse } from "next/server";
import { EmailService } from "@/lib/email";
import { InvoiceData } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const { invoices, month, year } = await request.json();

    // Send invoices to each member
    const emailPromises = (invoices as InvoiceData[]).map(async (invoiceData) => {
      const recipientEmails = [invoiceData.member.user.email];
      await EmailService.sendInvoice(invoiceData, recipientEmails);
    });

    await Promise.all(emailPromises);

    return NextResponse.json({
      success: true,
      message: "Bulk invoices sent successfully",
    });
  } catch (error: any) {
    console.error("Send bulk invoices error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to send bulk invoices" },
      { status: 500 }
    );
  }
}

