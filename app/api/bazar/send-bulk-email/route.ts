import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import BazarListModel from "@/app/api/models/BazarList";
import { EmailService } from "@/lib/email";
import { PDFGenerator } from "@/lib/pdf-generator";
import { BazarListWithUser } from "@/types";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Fetch all bazar lists with user details
    const bazarList = await BazarListModel.find()
      .populate("assignedTo")
      .sort({ date: 1 })
      .lean();

    if (!bazarList || bazarList.length === 0) {
      return NextResponse.json(
        { success: false, error: "No bazar schedule found" },
        { status: 404 }
      );
    }

    // Transform to BazarListWithUser format
    const bazarListWithUser: BazarListWithUser[] = bazarList.map((bazar: any) => ({
      id: bazar._id.toString(),
      bazarNo: bazar.bazarNo,
      date: bazar.date,
      assignedTo: bazar.assignedTo._id.toString(),
      status: bazar.status,
      createdAt: bazar.createdAt,
      updatedAt: bazar.updatedAt,
      assignedToUser: {
        id: bazar.assignedTo._id.toString(),
        name: bazar.assignedTo.name,
        dept: bazar.assignedTo.dept,
        institute: bazar.assignedTo.institute,
        phone: bazar.assignedTo.phone,
        email: bazar.assignedTo.email,
        picture: bazar.assignedTo.picture,
        googleId: bazar.assignedTo.googleId,
        role: bazar.assignedTo.role,
        createdAt: bazar.assignedTo.createdAt,
        updatedAt: bazar.assignedTo.updatedAt,
      },
    }));

    // Group bazar list by user (assignedTo)
    const bazarByUser = new Map<string, BazarListWithUser[]>();
    bazarListWithUser.forEach((bazar) => {
      const userId = bazar.assignedTo;
      if (!bazarByUser.has(userId)) {
        bazarByUser.set(userId, []);
      }
      bazarByUser.get(userId)!.push(bazar);
    });

    // Send email to each user with their bazar assignments
    const emailPromises: Promise<void>[] = [];
    const results: { email: string; success: boolean; error?: string }[] = [];

    for (const [userId, userBazarList] of bazarByUser.entries()) {
      const user = userBazarList[0].assignedToUser;
      
      // Generate PDF for this user's bazar assignments
      const pdf = PDFGenerator.generateBazarList(userBazarList);
      const pdfBuffer = Buffer.from(pdf.output("arraybuffer"));

      // Send email with PDF attachment
      const emailPromise = EmailService.sendBazarListPDF(
        user.email,
        user.name,
        userBazarList,
        pdfBuffer
      )
        .then(() => {
          results.push({ email: user.email, success: true });
        })
        .catch((error: any) => {
          console.error(`Failed to send email to ${user.email}:`, error);
          results.push({
            email: user.email,
            success: false,
            error: error.message || "Failed to send email",
          });
        });

      emailPromises.push(emailPromise);
    }

    // Wait for all emails to be sent
    await Promise.allSettled(emailPromises);

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Bulk email sent. ${successCount} successful, ${failureCount} failed.`,
      data: {
        total: results.length,
        successful: successCount,
        failed: failureCount,
        results,
      },
    });
  } catch (error: any) {
    console.error("Send bulk bazar email error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to send bulk emails" },
      { status: 500 }
    );
  }
}

