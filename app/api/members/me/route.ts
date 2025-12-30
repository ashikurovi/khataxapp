import { NextRequest, NextResponse } from "next/server";
import { MemberWithUser } from "@/types";
import connectDB from "@/lib/db";
import MemberModel from "@/app/api/models/Member";
import UserModel from "@/app/api/models/User";
import mongoose from "mongoose";
import { verifyAuthToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Verify authentication token
    const { payload, error } = await verifyAuthToken(request);
    if (error || !payload) {
      return error || NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }
    
    // Use userId from token payload
    const userId = payload.userId;

    // Validate that userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, error: "Invalid user ID format" },
        { status: 400 }
      );
    }

    const member = await MemberModel.findOne({ userId: new mongoose.Types.ObjectId(userId) }).populate("userId").lean();

    if (!member) {
      return NextResponse.json(
        { success: false, error: "Member not found" },
        { status: 404 }
      );
    }

    const memberWithUser: MemberWithUser = {
      id: (member as any)._id.toString(),
      userId: (member as any).userId._id.toString(),
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
        id: (member as any).userId._id.toString(),
        name: (member as any).userId.name,
        dept: (member as any).userId.dept,
        institute: (member as any).userId.institute,
        phone: (member as any).userId.phone,
        email: (member as any).userId.email,
        picture: (member as any).userId.picture,
        googleId: (member as any).userId.googleId,
        role: (member as any).userId.role,
        createdAt: (member as any).userId.createdAt,
        updatedAt: (member as any).userId.updatedAt,
      },
    };

    return NextResponse.json({
      success: true,
      data: memberWithUser,
    });
  } catch (error: any) {
    console.error("Fetch member error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch member data" },
      { status: 500 }
    );
  }
}

