import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { InvoiceData, MemberWithUser, DailyExpenseWithUser, BazarListWithUser } from "@/types";
import { format } from "date-fns";

export class PDFGenerator {
  static generateInvoice(invoiceData: InvoiceData): jsPDF {
    const doc = new jsPDF();
    const { member, month, year, transactions, totalDeposit, totalExpense, balance, border, managerReceivable } = invoiceData;

    // Modern color scheme
    const primaryColor: [number, number, number] = [59, 130, 246]; // Blue
    const secondaryColor: [number, number, number] = [139, 92, 246]; // Purple
    const successColor: [number, number, number] = [34, 197, 94]; // Green
    const dangerColor: [number, number, number] = [239, 68, 68]; // Red
    const grayColor: [number, number, number] = [107, 114, 128]; // Gray
    const lightGray: [number, number, number] = [243, 244, 246]; // Light gray

    // Modern Header with colored background
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 50, "F");
    
    // White text on colored background
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("KhataX", 20, 25);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Mess Management System", 20, 35);
    
    // Invoice title on right side
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("MONTHLY INVOICE", 150, 25);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Invoice #${year}${month.toString().padStart(2, "0")}-${member.userId.slice(-6)}`, 150, 35);

    // Reset text color
    doc.setTextColor(0, 0, 0);

    // Invoice period badge
    const periodText = format(new Date(year, month - 1), "MMMM yyyy").toUpperCase();
    doc.setFillColor(...secondaryColor);
    doc.roundedRect(20, 60, 60, 12, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(periodText, 50, 68, { align: "center" });
    doc.setTextColor(0, 0, 0);

    // Member Information Section (Modern Card Style)
    const memberStartY = 80;
    doc.setFillColor(...lightGray);
    doc.roundedRect(20, memberStartY, 170, 50, 3, 3, "F");
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...grayColor);
    doc.text("BILL TO:", 25, memberStartY + 8);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(member.user.name, 25, memberStartY + 18);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...grayColor);
    doc.text(`${member.user.dept}`, 25, memberStartY + 26);
    doc.text(`${member.user.institute}`, 25, memberStartY + 34);
    doc.text(`${member.user.email}`, 25, memberStartY + 42);

    // Summary Table with Modern Styling
    const summaryStartY = memberStartY + 60;
    autoTable(doc, {
      startY: summaryStartY,
      head: [[{ content: "FINANCIAL SUMMARY", colSpan: 2, styles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: "bold", halign: "center" } }]],
      body: [
        [
          { content: "Total Deposit", styles: { fontStyle: "bold" } },
          { content: `TK ${totalDeposit.toFixed(2)}`, styles: { halign: "right", textColor: successColor, fontStyle: "bold" } }
        ],
        [
          "Previous Due",
          { content: `TK ${member.previousDue.toFixed(2)}`, styles: { halign: "right" } }
        ],
        [
          "Per Extra Charge",
          { content: `TK ${member.perExtra.toFixed(2)}`, styles: { halign: "right" } }
        ],
        [
          "Total Expense",
          { content: `TK ${totalExpense.toFixed(2)}`, styles: { halign: "right", textColor: dangerColor, fontStyle: "bold" } }
        ],
        [
          { content: "Net Balance", styles: { fontStyle: "bold" } },
          { 
            content: `TK ${balance.toFixed(2)}`, 
            styles: { 
              halign: "right", 
              fontStyle: "bold",
              textColor: balance >= 0 ? successColor : dangerColor
            } 
          }
        ],
        [
          { 
            content: border > 0 ? "Border (Refundable)" : "Manager Receivable", 
            styles: { fontStyle: "bold" } 
          },
          { 
            content: `TK ${border > 0 ? border.toFixed(2) : managerReceivable.toFixed(2)}`, 
            styles: { 
              halign: "right", 
              fontStyle: "bold",
              textColor: border > 0 ? successColor : dangerColor
            } 
          }
        ],
      ],
      theme: "plain",
      styles: {
        fontSize: 10,
        cellPadding: 8,
        lineColor: [229, 231, 235],
        lineWidth: 0.5,
      },
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      columnStyles: {
        0: { cellWidth: 120 },
        1: { cellWidth: 70, halign: "right" },
      },
    });

    // Transactions Table (if available)
    if (transactions.length > 0) {
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [[
          { content: "TRANSACTION HISTORY", colSpan: 4, styles: { fillColor: secondaryColor, textColor: [255, 255, 255], fontStyle: "bold", halign: "center" } }
        ], [
          "Date",
          "Type",
          "Description",
          "Amount (TK)"
        ]],
        body: transactions.map((t) => [
          format(new Date(t.date), "dd/MM/yyyy"),
          t.type,
          t.description || "-",
          { content: `TK ${t.amount.toFixed(2)}`, styles: { halign: "right" } }
        ]),
        theme: "striped",
        styles: {
          fontSize: 9,
          cellPadding: 6,
        },
        headStyles: {
          fillColor: secondaryColor,
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 40 },
          2: { cellWidth: 80 },
          3: { cellWidth: 40, halign: "right" },
        },
      });
    }

    // Modern Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const pageHeight = doc.internal.pageSize.height;
      
      // Footer line
      doc.setDrawColor(...grayColor);
      doc.setLineWidth(0.5);
      doc.line(20, pageHeight - 25, 190, pageHeight - 25);
      
      // Footer text
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...grayColor);
      doc.text(
        `Generated on ${format(new Date(), "dd MMM yyyy, hh:mm a")}`,
        105,
        pageHeight - 15,
        { align: "center" }
      );
      
      // Page number
      doc.text(
        `Page ${i} of ${pageCount}`,
        105,
        pageHeight - 10,
        { align: "center" }
      );
      
      // Footer branding
      doc.setFontSize(8);
      doc.text("© KhataX Mess Management System", 105, pageHeight - 5, { align: "center" });
    }

    return doc;
  }

  static generateDailyExpenseReport(expenses: DailyExpenseWithUser[]): jsPDF {
    const doc = new jsPDF();
    
    // Modern color scheme
    const primaryColor: [number, number, number] = [59, 130, 246]; // Blue
    const successColor: [number, number, number] = [34, 197, 94]; // Green
    const grayColor: [number, number, number] = [107, 114, 128]; // Gray
    const lightGray: [number, number, number] = [243, 244, 246]; // Light gray

    // Modern Header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 40, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("DAILY EXPENSE REPORT", 105, 25, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on ${format(new Date(), "dd MMM yyyy")}`, 105, 35, { align: "center" });

    doc.setTextColor(0, 0, 0);

    // Expense Table with Modern Styling
    autoTable(doc, {
      startY: 50,
      head: [[
        "Date",
        "Bazar/Shop",
        "Total (TK)",
        "Extra (TK)",
        "Notes"
      ]],
      body: expenses.map((e) => [
        format(new Date(e.date), "dd/MM/yyyy"),
        e.bazarShop,
        { content: `TK ${e.totalTK.toFixed(2)}`, styles: { halign: "right" } },
        { content: `TK ${e.extra.toFixed(2)}`, styles: { halign: "right" } },
        e.notes || "-",
      ]),
      theme: "striped",
      styles: {
        fontSize: 9,
        cellPadding: 6,
        lineColor: [229, 231, 235],
      },
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: lightGray,
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 35 },
        2: { cellWidth: 40 },
        3: { cellWidth: 30, halign: "right" },
        4: { cellWidth: 30, halign: "right" },
        5: { cellWidth: 50 },
      },
    });

    // Total Summary
    const total = expenses.reduce((sum, e) => sum + e.totalTK + e.extra, 0);
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 15,
      body: [[
        { 
          content: "TOTAL AMOUNT", 
          styles: { fontStyle: "bold", fontSize: 12, fillColor: primaryColor, textColor: [255, 255, 255] } 
        },
        { 
          content: `TK ${total.toFixed(2)}`, 
          styles: { fontStyle: "bold", fontSize: 12, halign: "right", fillColor: primaryColor, textColor: [255, 255, 255] } 
        }
      ]],
      theme: "plain",
      styles: {
        cellPadding: 8,
      },
      columnStyles: {
        0: { cellWidth: 150 },
        1: { cellWidth: 60, halign: "right" },
      },
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const pageHeight = doc.internal.pageSize.height;
      
      doc.setDrawColor(...grayColor);
      doc.setLineWidth(0.5);
      doc.line(20, pageHeight - 20, 190, pageHeight - 20);
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...grayColor);
      doc.text("© KhataX Mess Management System", 105, pageHeight - 10, { align: "center" });
    }

    return doc;
  }

  static generateBazarList(bazarList: BazarListWithUser[]): jsPDF {
    const doc = new jsPDF();
    
    // Professional color scheme
    const primaryColor: [number, number, number] = [30, 58, 138]; // Deep Blue
    const accentColor: [number, number, number] = [59, 130, 246]; // Blue
    const grayColor: [number, number, number] = [107, 114, 128]; // Gray
    const lightGray: [number, number, number] = [249, 250, 251]; // Light gray
    const borderColor: [number, number, number] = [229, 231, 235]; // Border gray

    // Professional Header with gradient effect
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 50, "F");
    
    // White text on colored background
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26);
    doc.setFont("helvetica", "bold");
    doc.text("BAZAR SCHEDULE", 105, 28, { align: "center" });
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`KhataX Mess Management System`, 105, 38, { align: "center" });
    
    doc.setFontSize(9);
    doc.text(`Generated on ${format(new Date(), "dd MMM yyyy, hh:mm a")}`, 105, 45, { align: "center" });

    doc.setTextColor(0, 0, 0);

    // Group bazar by date (since 2 people per date)
    const bazarByDate = new Map<string, BazarListWithUser[]>();
    bazarList.forEach((b) => {
      const dateKey = format(new Date(b.date), "yyyy-MM-dd");
      if (!bazarByDate.has(dateKey)) {
        bazarByDate.set(dateKey, []);
      }
      bazarByDate.get(dateKey)!.push(b);
    });

    // Professional Bazar List Table (without status)
    autoTable(doc, {
      startY: 60,
      head: [[
        { content: "Date", styles: { fontStyle: "bold", halign: "center" } },
        { content: "Bazar #", styles: { fontStyle: "bold", halign: "center" } },
        { content: "Assigned Members", styles: { fontStyle: "bold", halign: "center" } }
      ]],
      body: Array.from(bazarByDate.entries())
        .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
        .map(([dateKey, bazars]) => {
          const date = new Date(dateKey);
          const bazarNumbers = bazars.map(b => `#${b.bazarNo}`).join(", ");
          const memberNames = bazars.map(b => b.assignedToUser.name).join(", ");
          
          return [
            { 
              content: format(date, "dd MMM yyyy"), 
              styles: { fontStyle: "bold", fontSize: 11 } 
            },
            { 
              content: bazarNumbers, 
              styles: { halign: "center", fontSize: 10 } 
            },
            { 
              content: memberNames, 
              styles: { fontSize: 10 } 
            },
          ];
        }),
      theme: "striped",
      styles: {
        fontSize: 10,
        cellPadding: 10,
        lineColor: borderColor,
        lineWidth: 0.5,
      },
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 11,
      },
      alternateRowStyles: {
        fillColor: lightGray,
      },
      columnStyles: {
        0: { cellWidth: 60, halign: "left" },
        1: { cellWidth: 50, halign: "center" },
        2: { cellWidth: 100, halign: "left" },
      },
    });

    // Professional Summary Section
    if (bazarList.length > 0) {
      const uniqueDates = new Set(bazarList.map(b => format(new Date(b.date), "yyyy-MM-dd"))).size;
      const uniqueMembers = new Set(bazarList.map(b => b.assignedToUser.name)).size;
      
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [[
          { content: "SCHEDULE SUMMARY", colSpan: 2, styles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: "bold", halign: "center", fontSize: 11 } }
        ]],
        body: [
          [
            { content: "Total Bazar Dates", styles: { fontStyle: "bold" } },
            { content: uniqueDates.toString(), styles: { halign: "center", fontStyle: "bold" } }
          ],
          [
            { content: "Total Assignments", styles: { fontStyle: "bold" } },
            { content: bazarList.length.toString(), styles: { halign: "center", fontStyle: "bold" } }
          ],
          [
            { content: "Assigned Members", styles: { fontStyle: "bold" } },
            { content: uniqueMembers.toString(), styles: { halign: "center", fontStyle: "bold" } }
          ],
        ],
        theme: "plain",
        styles: {
          fontSize: 10,
          cellPadding: 8,
          lineColor: borderColor,
        },
        columnStyles: {
          0: { cellWidth: 120, fontStyle: "bold" },
          1: { cellWidth: 70, halign: "center" },
        },
      });
    }

    // Professional Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const pageHeight = doc.internal.pageSize.height;
      
      // Footer line
      doc.setDrawColor(...borderColor);
      doc.setLineWidth(0.5);
      doc.line(20, pageHeight - 25, 190, pageHeight - 25);
      
      // Footer text
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...grayColor);
      doc.text(
        `Generated on ${format(new Date(), "dd MMM yyyy, hh:mm a")}`,
        105,
        pageHeight - 15,
        { align: "center" }
      );
      
      // Page number
      doc.text(
        `Page ${i} of ${pageCount}`,
        105,
        pageHeight - 10,
        { align: "center" }
      );
      
      // Footer branding
      doc.setFontSize(8);
      doc.text("© KhataX Mess Management System", 105, pageHeight - 5, { align: "center" });
    }

    return doc;
  }
}

