import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { InvoiceData, MemberWithUser, DailyExpenseWithUser, BazarListWithUser } from "@/types";
import { format } from "date-fns";

export class PDFGenerator {
  static generateInvoice(invoiceData: InvoiceData): jsPDF {
    const doc = new jsPDF();
    const { member, month, year, transactions, totalDeposit, totalExpense, balance, border, managerReceivable } = invoiceData;

    // Header
    doc.setFontSize(20);
    doc.text("KhataX - Mess Management", 105, 20, { align: "center" });
    doc.setFontSize(16);
    doc.text("Monthly Invoice", 105, 30, { align: "center" });

    // Member Info
    doc.setFontSize(12);
    doc.text(`Member: ${member.user.name}`, 20, 50);
    doc.text(`Department: ${member.user.dept}`, 20, 57);
    doc.text(`Institute: ${member.user.institute}`, 20, 64);
    doc.text(`Email: ${member.user.email}`, 20, 71);
    doc.text(`Period: ${format(new Date(year, month - 1), "MMMM yyyy")}`, 20, 78);

    // Summary Table
    autoTable(doc, {
      startY: 85,
      head: [["Description", "Amount (TK)"]],
      body: [
        ["Total Deposit", totalDeposit.toFixed(2)],
        ["Previous Due", member.previousDue.toFixed(2)],
        ["Per Extra", member.perExtra.toFixed(2)],
        ["Total Expense", totalExpense.toFixed(2)],
        ["Net Balance", balance.toFixed(2)],
        border > 0 ? ["Border (Refundable)", border.toFixed(2)] : ["Manager Receivable", managerReceivable.toFixed(2)],
      ],
      theme: "striped",
    });

    // Transactions Table
    if (transactions.length > 0) {
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [["Date", "Type", "Description", "Amount (TK)"]],
        body: transactions.map((t) => [
          format(new Date(t.date), "dd/MM/yyyy"),
          t.type,
          t.description || "-",
          t.amount.toFixed(2),
        ]),
        theme: "striped",
      });
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text(
        `Generated on ${format(new Date(), "dd/MM/yyyy HH:mm")}`,
        105,
        doc.internal.pageSize.height - 10,
        { align: "center" }
      );
    }

    return doc;
  }

  static generateDailyExpenseReport(expenses: DailyExpenseWithUser[]): jsPDF {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text("Daily Expense Report", 105, 20, { align: "center" });

    autoTable(doc, {
      startY: 30,
      head: [["Date", "Added By", "Bazar/Shop", "Total (TK)", "Extra", "Notes"]],
      body: expenses.map((e) => [
        format(new Date(e.date), "dd/MM/yyyy"),
        e.addedByUser.name,
        e.bazarShop,
        e.totalTK.toFixed(2),
        e.extra.toFixed(2),
        e.notes || "-",
      ]),
      theme: "striped",
    });

    const total = expenses.reduce((sum, e) => sum + e.totalTK + e.extra, 0);
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      body: [["Total Amount", total.toFixed(2)]],
      theme: "grid",
    });

    return doc;
  }

  static generateBazarList(bazarList: BazarListWithUser[]): jsPDF {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text("Bazar Schedule", 105, 20, { align: "center" });

    autoTable(doc, {
      startY: 30,
      head: [["Bazar #", "Date", "Assigned Member", "Status"]],
      body: bazarList.map((b) => [
        b.bazarNo.toString(),
        format(new Date(b.date), "dd/MM/yyyy"),
        b.assignedToUser.name,
        b.status,
      ]),
      theme: "striped",
    });

    return doc;
  }
}

