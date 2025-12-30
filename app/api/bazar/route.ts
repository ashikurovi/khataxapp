import { NextRequest, NextResponse } from "next/server";
import { BazarListWithUser } from "@/types";
import connectDB from "@/lib/db";
import BazarListModel from "@/app/api/models/BazarList";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const bazarList = await BazarListModel.find()
      .populate("assignedTo")
      .sort({ date: 1 })
      .lean();

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

    return NextResponse.json({
      success: true,
      data: bazarListWithUser,
    });
  } catch (error: any) {
    console.error("Fetch bazar list error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch bazar list" },
      { status: 500 }
    );
  }
}

