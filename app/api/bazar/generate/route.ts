import { NextRequest, NextResponse } from "next/server";
import { BazarScheduler } from "@/lib/bazar-scheduler";
import connectDB from "@/lib/db";
import UserModel from "@/app/api/models/User";
import BazarListModel, { IBazarList } from "@/app/api/models/BazarList";
import SemesterBreakModel from "@/app/api/models/SemesterBreak";
import { UserRole } from "@/types";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { startDate, endDate } = await request.json();

    // Fetch members (only Member role)
    const users = await UserModel.find({ role: UserRole.MEMBER }).lean();
    const members = users.map((user: any) => ({
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
    }));

    // Fetch semester breaks
    const breaks = await SemesterBreakModel.find().lean();
    const semesterBreaks = breaks.map((breakItem: any) => ({
      id: breakItem._id.toString(),
      startDate: breakItem.startDate,
      endDate: breakItem.endDate,
      description: breakItem.description,
      createdAt: breakItem.createdAt,
      updatedAt: breakItem.updatedAt,
    }));

    const schedule = BazarScheduler.generateSchedule(
      new Date(startDate),
      new Date(endDate),
      members,
      semesterBreaks
    );

    // Save schedule to database
    // Use ordered: false to continue inserting even if some duplicates exist
    let savedSchedule;
    try {
      savedSchedule = await BazarListModel.insertMany(
        schedule.map((item) => ({
          bazarNo: item.bazarNo,
          date: item.date,
          assignedTo: item.assignedTo,
          status: item.status,
        })),
        { ordered: false }
      );
    } catch (error: any) {
      // If there are duplicate key errors, get successfully inserted documents
      if (error.name === 'BulkWriteError' && error.insertedDocs) {
        savedSchedule = error.insertedDocs;
      } else {
        throw error;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Bazar schedule generated successfully",
      data: savedSchedule.map((item: IBazarList) => ({
        id: item._id.toString(),
        bazarNo: item.bazarNo,
        date: item.date,
        assignedTo: item.assignedTo.toString(),
        status: item.status,
      })),
    });
  } catch (error: any) {
    console.error("Generate schedule error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate schedule" },
      { status: 500 }
    );
  }
}

