import { NextRequest, NextResponse } from "next/server";
import { HeshabWithUser } from "@/types";
import connectDB from "@/lib/db";
import HeshabModel from "@/app/api/models/Heshab";
import MemberModel from "@/app/api/models/Member";
import DailyExtraModel from "@/app/api/models/DailyExtra";
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

    // perExtra is manual - use provided value or default to 0
    const perExtra = data.perExtra !== undefined ? data.perExtra : 0;

    // Get existing heshab record if it exists
    const existingHeshab = await HeshabModel.findOne({
      userId: data.userId,
      month: data.month,
      year: data.year,
    }).lean();

    let finalDeposit = data.deposit;
    const newDepositAmount = data.deposit; // Amount being added
    let paidToReceivable = 0; // Track how much was paid to manager receivable

    if (existingHeshab) {
      // Use existing heshab's stored values
      const existingDue = existingHeshab.due || 0;
      const existingBorder = existingHeshab.currentBalance > 0 ? existingHeshab.currentBalance : 0;

      // Step 1: If there's manager receivable (due), deduct it from new deposit first
      // Example: Manager Receivable = 500, Deposit = 400 → Cut 400, Manager Receivable = 100, Deposit = 0 (no change to existing deposit)
      // Example: Manager Receivable = 100, Deposit = 200 → Cut 100, Manager Receivable = 0, Deposit = 100 (add 100 to existing deposit)
      let remainingDeposit = newDepositAmount;
      
      if (existingDue > 0) {
        if (remainingDeposit >= existingDue) {
          // New deposit covers the due completely
          paidToReceivable = existingDue;
          remainingDeposit = remainingDeposit - existingDue;
        } else {
          // New deposit is less than due, just reduce the due (don't add to deposit)
          paidToReceivable = remainingDeposit;
          remainingDeposit = 0; // No deposit added, all went to pay receivable
        }
      }

      // Step 2: Add remaining deposit to existing deposit
      // The existing deposit already contains all previous deposits, so we just add the new remaining amount
      // Note: Border is the positive balance and should NOT be added to deposit - it's calculated separately
      finalDeposit = existingHeshab.deposit + remainingDeposit;
    }

    // Calculate balance: (deposit + perExtra) - totalExpense
    const calculatedBalance = finalDeposit + perExtra - data.totalExpense;
    
    // Calculate remaining receivable after payment from deposit
    // This is the receivable that remains after the deposit payment
    // IMPORTANT: This should always be shown if it exists, regardless of balance
    let remainingReceivable = 0;
    if (existingHeshab && existingHeshab.due) {
      remainingReceivable = Math.max(0, existingHeshab.due - paidToReceivable);
    }
    
    // Calculate border and managerReceivable based on the formula
    // The remaining receivable after deposit payment should always be preserved and shown
    // The balance calculation is separate and only affects additional receivable or border
    let border = 0;
    let due = remainingReceivable; // Always preserve remaining receivable after payment
    let currentBalance = calculatedBalance;
    
    // The balance calculation is separate from the remaining receivable
    // If balance is positive, it goes to border (but remaining receivable stays)
    // If balance is negative, it adds to the remaining receivable
    // Only if balance is positive AND greater than remaining receivable, it clears the receivable
    if (calculatedBalance > 0) {
      // Positive balance: goes to border
      // Check if it can cover remaining receivable
      if (calculatedBalance > remainingReceivable) {
        // Positive balance is more than remaining receivable
        // Remaining receivable is cleared, excess goes to border
        border = calculatedBalance - remainingReceivable;
        due = 0; // All receivable cleared by positive balance
        currentBalance = calculatedBalance;
      } else {
        // Positive balance but less than or equal to remaining receivable
        // Show the remaining receivable (positive balance doesn't fully cover it)
        due = remainingReceivable;
        border = 0; // No border, receivable still exists
        currentBalance = calculatedBalance - remainingReceivable; // Effective balance is negative
      }
    } else if (calculatedBalance < 0) {
      // Negative balance: adds to remaining receivable
      due = remainingReceivable + Math.abs(calculatedBalance);
      currentBalance = calculatedBalance;
      border = 0; // Clear border when balance is negative
    } else {
      // Balance is exactly 0
      // Show the remaining receivable as is (if any)
      due = remainingReceivable;
      border = 0;
      currentBalance = 0;
    }
    
    // If manually provided, override the calculated values
    if (data.border !== undefined && data.border >= 0) {
      border = data.border;
      // Adjust currentBalance if border is manually set
      if (border > 0) {
        currentBalance = border;
        // Don't clear due if manually setting border - preserve remaining receivable
        // due = 0; // Removed - preserve remaining receivable
      }
    }
    
    if (data.managerReceivable !== undefined && data.managerReceivable >= 0) {
      due = data.managerReceivable;
      // Adjust currentBalance if managerReceivable is manually set
      if (due > 0) {
        currentBalance = -due;
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
        totalExpense: data.totalExpense,
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
          const existingDue = existingHeshab.due || 0;
          const existingBorder = existingHeshab.currentBalance > 0 ? existingHeshab.currentBalance : 0;
          
          let parts: string[] = [];
          
          // Check if deposit was used to pay manager receivable
          if (existingDue > 0 && newDepositAmount > 0) {
            const paidToReceivable = Math.min(newDepositAmount, existingDue);
            if (paidToReceivable === newDepositAmount) {
              // All deposit went to pay receivable
              parts.push(`Payment towards manager receivable (TK ${paidToReceivable.toFixed(2)})`);
            } else {
              // Part of deposit went to pay receivable
              parts.push(`Deposit (TK ${paidToReceivable.toFixed(2)} paid to receivable, TK ${(newDepositAmount - paidToReceivable).toFixed(2)} added)`);
            }
          } else {
            parts.push(`Deposit`);
          }
          
          // Check if border was added to deposit
          if (existingBorder > 0) {
            parts.push(`Border amount (TK ${existingBorder.toFixed(2)}) added to deposit`);
          }
          
          description = `${parts.join(", ")} - ${data.month}/${data.year}`;
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
          totalExpense: data.totalExpense,
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
      // Don't update totalExpense when making a deposit - keep existing totalExpense
      // member.totalExpense = data.totalExpense;
      member.perExtra = perExtra;
      // Recalculate balanceDue based on updated deposit and existing totalExpense
      member.balanceDue = finalDeposit - member.totalExpense;
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

// PUT endpoint to update heshab record fields
export async function PUT(request: NextRequest) {
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

    // Use provided values or keep existing values
    const updatedDeposit = deposit !== undefined ? deposit : existingHeshab.deposit;
    
    // perExtra is manual - use provided value or keep existing
    const updatedPerExtra = perExtra !== undefined ? perExtra : existingHeshab.perExtra;

    const updatedTotalExpense = totalExpense !== undefined ? totalExpense : existingHeshab.totalExpense;

    // Calculate balance: (deposit + perExtra) - totalExpense
    const calculatedBalance = updatedDeposit + updatedPerExtra - updatedTotalExpense;
    
    // Use provided border/managerReceivable or calculate from balance
    let updatedBorder = border;
    let updatedDue = managerReceivable;
    let currentBalance = calculatedBalance;
    
    if (updatedBorder !== undefined && updatedBorder >= 0) {
      // Border is manually set
      currentBalance = updatedBorder;
      updatedDue = 0;
    } else if (updatedDue !== undefined && updatedDue >= 0) {
      // Manager receivable is manually set
      currentBalance = -updatedDue;
      updatedBorder = 0;
    } else {
      // Calculate from balance
      if (calculatedBalance > 0) {
        updatedBorder = calculatedBalance;
        updatedDue = 0;
        currentBalance = calculatedBalance;
      } else if (calculatedBalance < 0) {
        updatedDue = Math.abs(calculatedBalance);
        updatedBorder = 0;
        currentBalance = calculatedBalance;
      } else {
        updatedBorder = 0;
        updatedDue = 0;
        currentBalance = 0;
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
      member.border = updatedBorder;
      member.managerReceivable = updatedDue;
      member.totalExpense = updatedTotalExpense;
      member.perExtra = updatedPerExtra;
      member.balanceDue = updatedDue;
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

