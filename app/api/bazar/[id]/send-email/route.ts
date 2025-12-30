import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import BazarListModel from "@/app/api/models/BazarList";
import { EmailService } from "@/lib/email";
import { format } from "date-fns";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const bazarId = id;

    const bazar = await BazarListModel.findById(bazarId)
      .populate("assignedTo")
      .lean();

    if (!bazar) {
      return NextResponse.json(
        { success: false, error: "Bazar not found" },
        { status: 404 }
      );
    }

    const memberEmail = (bazar as any).assignedTo.email;
    const memberName = (bazar as any).assignedTo.name;

    await EmailService.sendBazarReminder(
      memberEmail,
      memberName,
      bazar.date,
      bazar.bazarNo
    );

    return NextResponse.json({
      success: true,
      message: "Bazar reminder email sent successfully",
    });
  } catch (error: any) {
    console.error("Send bazar email error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to send email" },
      { status: 500 }
    );
  }
}

