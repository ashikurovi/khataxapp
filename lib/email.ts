import nodemailer from "nodemailer";
import { InvoiceData } from "@/types";
import { PDFGenerator } from "./pdf-generator";

// Email configuration - should be in environment variables
const emailConfig = {
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
};

const transporter = nodemailer.createTransport(emailConfig);

export class EmailService {
  static async sendInvoice(invoiceData: InvoiceData, recipientEmails: string[]): Promise<void> {
    const pdf = PDFGenerator.generateInvoice(invoiceData);
    const pdfBuffer = Buffer.from(pdf.output("arraybuffer"));

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    const subject = `KhataX Invoice - ${monthNames[invoiceData.month - 1]} ${invoiceData.year}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">KhataX - Monthly Invoice</h2>
        <p>Dear ${invoiceData.member.user.name},</p>
        <p>Please find attached your monthly invoice for ${monthNames[invoiceData.month - 1]} ${invoiceData.year}.</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3>Summary:</h3>
          <p><strong>Total Deposit:</strong> TK ${invoiceData.totalDeposit.toFixed(2)}</p>
          <p><strong>Total Expense:</strong> TK ${invoiceData.totalExpense.toFixed(2)}</p>
          <p><strong>Balance:</strong> TK ${invoiceData.balance.toFixed(2)}</p>
          ${invoiceData.border > 0 
            ? `<p><strong>Border (Refundable):</strong> TK ${invoiceData.border.toFixed(2)}</p>`
            : `<p><strong>Manager Receivable:</strong> TK ${invoiceData.managerReceivable.toFixed(2)}</p>`
          }
        </div>
        <p>Thank you for using KhataX!</p>
      </div>
    `;

    // Send separate emails to each recipient
    const emailPromises = recipientEmails.map((email) =>
      transporter.sendMail({
        from: `"KhataX" <${emailConfig.auth.user}>`,
        to: email,
        subject,
        html,
        attachments: [
          {
            filename: `invoice-${invoiceData.member.user.name}-${invoiceData.month}-${invoiceData.year}.pdf`,
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ],
        priority: "high",
      })
    );

    await Promise.all(emailPromises);
  }

  static async sendBulkInvoices(
    invoices: InvoiceData[],
    recipientEmailsMap: Record<string, string[]>
  ): Promise<void> {
    const emailPromises = invoices.map((invoice) => {
      const emails = recipientEmailsMap[invoice.member.userId] || [invoice.member.user.email];
      return this.sendInvoice(invoice, emails);
    });

    await Promise.all(emailPromises);
  }

  static async sendBazarReminder(
    memberEmail: string,
    memberName: string,
    bazarDate: Date,
    bazarNo: number
  ): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">KhataX - Bazar Reminder</h2>
        <p>Dear ${memberName},</p>
        <p>This is a reminder that you are assigned to bazar #${bazarNo} on ${bazarDate.toLocaleDateString()}.</p>
        <p>Please ensure you complete your bazar shopping on time.</p>
        <p>Thank you!</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"KhataX" <${emailConfig.auth.user}>`,
      to: memberEmail,
      subject: `Bazar Reminder - Bazar #${bazarNo}`,
      html,
      priority: "high",
    });
  }

  static async sendInvoiceEmail({
    to,
    memberName,
    month,
    year,
    deposit,
    previousBalance,
    perExtra,
    totalExpense,
    currentBalance,
    pdfBuffer,
    todayDeposit,
    previousDeposit,
    depositDateTime,
    isMonthlyInvoice = false,
  }: {
    to: string;
    memberName: string;
    month: number;
    year: number;
    deposit: number;
    previousBalance: number;
    perExtra: number;
    totalExpense: number;
    currentBalance: number;
    pdfBuffer: Buffer;
    todayDeposit?: number;
    previousDeposit?: number;
    depositDateTime?: string;
    isMonthlyInvoice?: boolean;
  }): Promise<void> {
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    const subject = isMonthlyInvoice 
      ? `KhataX Monthly Invoice - ${monthNames[month - 1]} ${year}`
      : `KhataX Invoice`;
    
    const title = isMonthlyInvoice 
      ? `KhataX - Monthly Invoice`
      : `KhataX - Invoice`;
    
    const greeting = isMonthlyInvoice
      ? `Please find attached your monthly invoice for ${monthNames[month - 1]} ${year}.`
      : `Please find attached your invoice.`;

    const currentDateTime = depositDateTime || new Date().toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">${title}</h2>
        <p>Dear ${memberName},</p>
        <p>${greeting}</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3>Deposit Information:</h3>
          ${todayDeposit !== undefined ? `<p><strong>Today's Deposit:</strong> TK ${todayDeposit.toFixed(2)}</p>` : ""}
          ${previousDeposit !== undefined ? `<p><strong>Previous Deposit:</strong> TK ${previousDeposit.toFixed(2)}</p>` : ""}
          <p><strong>Total Deposit:</strong> TK ${deposit.toFixed(2)}</p>
          <p><strong>Date & Time:</strong> ${currentDateTime}</p>
        </div>
        <p>Thank you for using KhataX!</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"KhataX" <${emailConfig.auth.user}>`,
      to,
      subject,
      html,
      attachments: [
        {
          filename: `invoice-${memberName}-${month}-${year}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
      priority: "high",
    });
  }

  static async sendBazarListPDF(
    memberEmail: string,
    memberName: string,
    bazarList: any[],
    pdfBuffer: Buffer
  ): Promise<void> {
    const assignmentCount = bazarList.length;
    const dates = bazarList.map((b) => new Date(b.date).toLocaleDateString()).join(", ");

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">KhataX - Bazar Schedule</h2>
        <p>Dear ${memberName},</p>
        <p>Please find attached your bazar schedule. You have been assigned to ${assignmentCount} bazar${assignmentCount > 1 ? "s" : ""}.</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3>Your Bazar Assignments:</h3>
          <p><strong>Total Assignments:</strong> ${assignmentCount}</p>
          <p><strong>Dates:</strong> ${dates}</p>
        </div>
        <p>Please ensure you complete your bazar shopping on the assigned dates.</p>
        <p>Thank you for using KhataX!</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"KhataX" <${emailConfig.auth.user}>`,
      to: memberEmail,
      subject: `KhataX - Your Bazar Schedule`,
      html,
      attachments: [
        {
          filename: `bazar-schedule-${memberName}-${new Date().toISOString().split("T")[0]}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
      priority: "high",
    });
  }
}

