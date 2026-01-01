import { NextRequest, NextResponse } from "next/server";
import { MemberWithUser, UserRole } from "@/types";
import connectDB from "@/lib/db";
import UserModel from "@/app/api/models/User";
import MemberModel from "@/app/api/models/Member";
import { recalculatePerExtraForAllHeshab } from "@/lib/per-extra-calculator";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const members = await MemberModel.find().populate("userId").lean();

    const membersWithUser: MemberWithUser[] = members.map((member: any) => ({
      id: member._id.toString(),
      userId: member.userId._id.toString(),
      totalDeposit: member.totalDeposit,
      previousDue: member.previousDue,
      perExtra: member.perExtra,
      totalExpense: member.totalExpense,
      balanceDue: member.balanceDue,
      border: member.border,
      managerReceivable: member.managerReceivable,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
      user: {
        id: member.userId._id.toString(),
        name: member.userId.name,
        dept: member.userId.dept,
        institute: member.userId.institute,
        phone: member.userId.phone,
        email: member.userId.email,
        picture: member.userId.picture,
        googleId: member.userId.googleId,
        role: member.userId.role,
        createdAt: member.userId.createdAt,
        updatedAt: member.userId.updatedAt,
      },
    }));

    return NextResponse.json({
      success: true,
      data: membersWithUser,
    });
  } catch (error: any) {
    console.error("Fetch members error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch members" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const data = await request.json();

    // Create user first
    const user = await UserModel.create({
      name: data.name,
      dept: data.dept,
      institute: data.institute,
      phone: data.phone,
      email: data.email,
      picture: data.picture || "",
      role: data.role || UserRole.MEMBER,
    });

    // Create member record
    await MemberModel.create({
      userId: user._id,
      totalDeposit: 0,
      previousDue: 0,
      perExtra: 0,
      totalExpense: 0,
      balanceDue: 0,
      border: 0,
      managerReceivable: 0,
    });

    // Recalculate perExtra for all heshab records since member count changed
    try {
      await recalculatePerExtraForAllHeshab();
    } catch (recalcError: any) {
      console.error("Error recalculating perExtra after member creation:", recalcError);
      // Don't fail the request if recalculation fails
    }

    return NextResponse.json({
      success: true,
      message: "Member created successfully",
    });
  } catch (error: any) {
    console.error("Create member error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create member" },
      { status: 500 }
    );
  }
}

