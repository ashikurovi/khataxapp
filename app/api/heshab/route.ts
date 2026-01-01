import { NextRequest, NextResponse } from "next/server";
import { HeshabWithUser } from "@/types";
import connectDB from "@/lib/db";
import HeshabModel from "@/app/api/models/Heshab";
import MemberModel from "@/app/api/models/Member";
import DailyExtraModel from "@/app/api/models/DailyExtra";
import DailyExpenseModel from "@/app/api/models/DailyExpense";
import DepositLogModel from "@/app/api/models/DepositLog";
import { EmailService } from "@/lib/email";
import { PDFGenerator } from "@/lib/pdf-generator";

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

    // Calculate perExtra for each unique month/year combination
    const uniqueMonths = new Set(
      heshabRecords.map((h: any) => `${h.year}-${h.month}`)
    );

    // Calculate perExtra: (TOTAL of ALL daily extras) / total members
    // This is the same for all months - total daily extras divided by total members
    const memberCount = await MemberModel.countDocuments();
    
    // Get ALL daily extras (not filtered by month)
    const allDailyExtras = await DailyExtraModel.find().lean();
    const totalExtra = allDailyExtras.reduce((sum, extra) => sum + extra.amount, 0);
    const perExtra = memberCount > 0 ? totalExtra / memberCount : 0;
    
    // Use the same perExtra for all months
    const perExtraMap = new Map<string, number>();
    for (const monthKey of uniqueMonths) {
      perExtraMap.set(monthKey, perExtra);
    }

    // Update all heshab records with calculated perExtra and recalculate balance
    const updatePromises = heshabRecords.map(async (heshab: any) => {
      const monthKey = `${heshab.year}-${heshab.month}`;
      const calculatedPerExtra = perExtraMap.get(monthKey) || 0;
      
      // Recalculate balance: deposit - (perExtra + totalExpense)
      const calculatedBalance = heshab.deposit - (calculatedPerExtra + heshab.totalExpense);
      
      // Calculate border and due
      let border = 0;
      let due = 0;
      
      if (calculatedBalance > 0) {
        border = calculatedBalance;
      } else if (calculatedBalance < 0) {
        due = Math.abs(calculatedBalance);
      }

      // Update the record in database
      await HeshabModel.findByIdAndUpdate(heshab._id, {
        perExtra: calculatedPerExtra,
        currentBalance: calculatedBalance,
        due,
      });
    });

    await Promise.all(updatePromises);

    // Fetch updated records
    const updatedHeshabRecords = await HeshabModel.find(query).populate("userId").lean();

    const heshabWithUser: HeshabWithUser[] = updatedHeshabRecords.map((heshab: any) => ({
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

    return NextResponse.json({
      success: true,
      data: heshabWithUser,
    });
  } catch (error: any) {
    console.error("Fetch heshab error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch heshab records" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const data = await request.json();

    // Calculate perExtra: (TOTAL of ALL daily extras) / total members
    // Get ALL daily extras (not filtered by month)
    const allDailyExtras = await DailyExtraModel.find().lean();
    const totalExtra = allDailyExtras.reduce((sum, extra) => sum + extra.amount, 0);
    
    // Get all members count
    const memberCount = await MemberModel.countDocuments();
    const perExtra = memberCount > 0 ? totalExtra / memberCount : 0;

    // Get existing heshab record if it exists
    const existingHeshab = await HeshabModel.findOne({
      userId: data.userId,
      month: data.month,
      year: data.year,
    }).lean();

    // Use manual totalExpense if provided, otherwise keep existing or default to 0 (fully manual input)
    let totalExpense = data.totalExpense;
    if (totalExpense === undefined || totalExpense === null) {
      if (existingHeshab) {
        // Keep existing totalExpense value
        totalExpense = existingHeshab.totalExpense || 0;
      } else {
        // Default to 0 for new records (fully manual input required)
        totalExpense = 0;
      }
    }

    const newDepositAmount = data.deposit; // Amount being added
    let paidToReceivable = 0; // Track how much was paid to manager receivable

    // Always sum new deposit with previous deposit if existing heshab exists
    let finalDeposit = newDepositAmount;
    if (existingHeshab) {
      // Always add the new deposit to the existing deposit (sum previous deposits)
      finalDeposit = existingHeshab.deposit + newDepositAmount;
      
      // If there's manager receivable (due), it will be recalculated from the new balance
      // The deposit is always added, and receivables are calculated separately from the new total
      const existingDue = existingHeshab.due || 0;
      if (existingDue > 0 && newDepositAmount > 0) {
        // Track how much of the new deposit would go towards paying receivable
        // But still add the full deposit amount
        paidToReceivable = Math.min(newDepositAmount, existingDue);
      }
    }

    // Calculate balance: deposit - (perExtra + totalExpense)
    const calculatedBalance = finalDeposit - (perExtra + totalExpense);
    
    // Use manual border/managerReceivable if provided, otherwise auto-calculate from balance
    let border = data.border;
    let due = data.managerReceivable;
    let currentBalance = calculatedBalance;
    
    if (border === undefined && due === undefined) {
      // Auto-calculate from balance if not provided
      if (calculatedBalance > 0) {
        border = calculatedBalance;
        due = 0;
      } else if (calculatedBalance < 0) {
        border = 0;
        due = Math.abs(calculatedBalance);
      } else {
        border = 0;
        due = 0;
      }
    } else {
      // Use manual values if provided
      if (border === undefined) border = 0;
      if (due === undefined) due = 0;
      
      // If manual values provided, adjust currentBalance accordingly
      if (data.border !== undefined && data.border >= 0) {
        currentBalance = data.border;
        due = 0;
      } else if (data.managerReceivable !== undefined && data.managerReceivable >= 0) {
        currentBalance = -data.managerReceivable;
        border = 0;
      }
    }

    // Create or update heshab record
    const heshab = await HeshabModel.findOneAndUpdate(
      { userId: data.userId, month: data.month, year: data.year },
      {
        userId: data.userId,
        deposit: finalDeposit,
        previousBalance: 0, // Set to 0 since we're removing it
        perExtra,
        totalExpense: totalExpense,
        currentBalance,
        due,
        month: data.month,
        year: data.year,
      },
      { upsert: true, new: true }
    ).populate("userId");

    // Create deposit log entry if deposit amount is greater than 0
    if (newDepositAmount > 0) {
      const depositDate = data.depositDate ? new Date(data.depositDate) : new Date();
      
      // Determine description based on how deposit was used
      let description = data.description;
      if (!description) {
        if (existingHeshab) {
          // Deposit is always added to previous deposit
          description = `Deposit (TK ${newDepositAmount.toFixed(2)}) added to previous deposit (TK ${existingHeshab.deposit.toFixed(2)}) - ${data.month}/${data.year}`;
        } else {
          description = `Deposit for ${data.month}/${data.year}`;
        }
      }
      
      await DepositLogModel.create({
        userId: data.userId,
        heshabId: heshab._id,
        amount: newDepositAmount,
        date: depositDate,
        month: data.month,
        year: data.year,
        description,
      });
    }

    // Send invoice email to member
    try {
      const heshabWithUser: any = heshab;
      const user = heshabWithUser.userId;
      
      if (user && user.email) {
        // Calculate today's deposit and previous deposit
        const todayDeposit = newDepositAmount;
        const previousDeposit = existingHeshab ? existingHeshab.deposit : 0;
        const depositDateTime = new Date().toLocaleString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        });

        // Generate invoice PDF
        const invoiceData = {
          member: {
            id: heshab._id.toString(),
            userId: user._id.toString(),
            totalDeposit: finalDeposit,
            previousDue: existingHeshab ? existingHeshab.due || 0 : 0,
            perExtra,
            totalExpense: data.totalExpense,
            balanceDue: currentBalance,
            border: currentBalance > 0 ? currentBalance : 0,
            managerReceivable: currentBalance < 0 ? Math.abs(currentBalance) : 0,
            createdAt: heshab.createdAt,
            updatedAt: heshab.updatedAt,
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
          month: data.month,
          year: data.year,
          transactions: [],
          totalDeposit: finalDeposit,
          totalExpense: data.totalExpense,
          balance: currentBalance,
          border: currentBalance > 0 ? currentBalance : 0,
          managerReceivable: currentBalance < 0 ? Math.abs(currentBalance) : 0,
        };

        const pdf = PDFGenerator.generateInvoice(invoiceData);
        const pdfBuffer = pdf.output("arraybuffer");

        // Send email with invoice attachment
        await EmailService.sendInvoiceEmail({
          to: user.email,
          memberName: user.name,
          month: data.month,
          year: data.year,
          deposit: finalDeposit,
          previousBalance: existingHeshab ? existingHeshab.due || 0 : 0,
          perExtra,
          totalExpense: totalExpense,
          currentBalance,
          pdfBuffer: Buffer.from(pdfBuffer),
          todayDeposit: todayDeposit,
          previousDeposit: previousDeposit,
          depositDateTime: depositDateTime,
        });
      }
    } catch (emailError: any) {
      // Log email error but don't fail the request
      console.error("Failed to send invoice email:", emailError);
    }

    // Update Member model with latest border and managerReceivable
    const member = await MemberModel.findOne({ userId: data.userId });
    if (member) {
      member.border = border;
      member.managerReceivable = due;
      member.totalDeposit = finalDeposit;
      member.totalExpense = totalExpense; // Update with calculated totalExpense
      member.perExtra = perExtra;
      // Recalculate balanceDue: deposit - (perExtra + totalExpense)
      member.balanceDue = currentBalance;
      await member.save();
    }

    return NextResponse.json({
      success: true,
      data: heshab,
      message: "Heshab record created/updated successfully",
    });
  } catch (error: any) {
    console.error("Create heshab error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create heshab record" },
      { status: 500 }
    );
  }
}

// PATCH endpoint to update heshab record fields
export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    const data = await request.json();
    const { 
      heshabId, 
      deposit, 
      perExtra, 
      totalExpense, 
      border, 
      managerReceivable 
    } = data;

    if (!heshabId) {
      return NextResponse.json(
        { success: false, error: "Heshab ID is required" },
        { status: 400 }
      );
    }

    // Get existing heshab record
    const existingHeshab = await HeshabModel.findById(heshabId).populate("userId");
    if (!existingHeshab) {
      return NextResponse.json(
        { success: false, error: "Heshab record not found" },
        { status: 404 }
      );
    }

    // Use provided deposit value directly (REPLACE, not add)
    // If deposit is provided, use it as the new deposit amount (not added to existing)
    const updatedDeposit = deposit !== undefined ? deposit : existingHeshab.deposit;
    
    // Always calculate perExtra: (TOTAL of ALL daily extras) / total members
    // Get ALL daily extras (not filtered by month)
    const allDailyExtras = await DailyExtraModel.find().lean();
    const totalExtra = allDailyExtras.reduce((sum, extra) => sum + extra.amount, 0);
    const memberCount = await MemberModel.countDocuments();
    const updatedPerExtra = memberCount > 0 ? totalExtra / memberCount : 0;

    // Use manual totalExpense if provided, otherwise keep existing value (fully manual input)
    let updatedTotalExpense = totalExpense;
    if (updatedTotalExpense === undefined || updatedTotalExpense === null) {
      // If not provided, keep existing value (fully manual input required)
      updatedTotalExpense = existingHeshab.totalExpense || 0;
    }

    // Calculate balance: deposit - (perExtra + totalExpense)
    const calculatedBalance = updatedDeposit - (updatedPerExtra + updatedTotalExpense);
    
    // Use manual border/managerReceivable if provided, otherwise auto-calculate from balance
    let updatedBorder = border;
    let updatedDue = managerReceivable;
    let currentBalance = calculatedBalance;
    
    if (updatedBorder === undefined && updatedDue === undefined) {
      // Auto-calculate from balance if not provided
      if (calculatedBalance > 0) {
        updatedBorder = calculatedBalance;
        updatedDue = 0;
      } else if (calculatedBalance < 0) {
        updatedBorder = 0;
        updatedDue = Math.abs(calculatedBalance);
      } else {
        updatedBorder = 0;
        updatedDue = 0;
      }
    } else {
      // Use manual values if provided
      if (updatedBorder === undefined) updatedBorder = 0;
      if (updatedDue === undefined) updatedDue = 0;
      
      // If manual values provided, adjust currentBalance accordingly
      if (border !== undefined && border >= 0) {
        currentBalance = border;
        updatedDue = 0;
      } else if (managerReceivable !== undefined && managerReceivable >= 0) {
        currentBalance = -managerReceivable;
        updatedBorder = 0;
      }
    }

    // Update heshab record
    const updatedHeshab = await HeshabModel.findByIdAndUpdate(
      heshabId,
      {
        deposit: updatedDeposit,
        perExtra: updatedPerExtra,
        totalExpense: updatedTotalExpense,
        currentBalance,
        due: updatedDue,
      },
      { new: true }
    ).populate("userId");

    // Update Member model
    const member = await MemberModel.findOne({ userId: existingHeshab.userId });
    if (member) {
      // Update totalDeposit to match the heshab deposit (replace, not add)
      member.totalDeposit = updatedDeposit;
      member.border = updatedBorder;
      member.managerReceivable = updatedDue;
      member.totalExpense = updatedTotalExpense;
      member.perExtra = updatedPerExtra;
      member.balanceDue = currentBalance; // Use calculated balance
      await member.save();
    }

    return NextResponse.json({
      success: true,
      data: updatedHeshab,
      message: "Heshab record updated successfully",
    });
  } catch (error: any) {
    console.error("Update heshab error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update heshab record" },
      { status: 500 }
    );
  }
}

