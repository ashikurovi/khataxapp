import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import UserModel from "@/app/api/models/User";
import MemberModel from "@/app/api/models/Member";
import { UserRole } from "@/types";
import { recalculatePerExtraForAllHeshab } from "@/lib/per-extra-calculator";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const memberId = params.id;
    const data = await request.json();

    // Find the member
    const member = await MemberModel.findById(memberId);
    if (!member) {
      return NextResponse.json(
        { success: false, error: "Member not found" },
        { status: 404 }
      );
    }

    // Update the associated user
    const user = await UserModel.findById(member.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Associated user not found" },
        { status: 404 }
      );
    }

    // Update user fields
    if (data.name !== undefined) user.name = data.name;
    if (data.dept !== undefined) user.dept = data.dept;
    if (data.institute !== undefined) user.institute = data.institute;
    if (data.phone !== undefined) user.phone = data.phone;
    if (data.email !== undefined) user.email = data.email;
    if (data.role !== undefined) user.role = data.role;
    if (data.picture !== undefined) user.picture = data.picture;

    await user.save();

    // Populate and return updated member
    await member.populate("userId");
    const updatedMember = {
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
        id: (member.userId as any)._id.toString(),
        name: (member.userId as any).name,
        dept: (member.userId as any).dept,
        institute: (member.userId as any).institute,
        phone: (member.userId as any).phone,
        email: (member.userId as any).email,
        picture: (member.userId as any).picture,
        googleId: (member.userId as any).googleId,
        role: (member.userId as any).role,
        createdAt: (member.userId as any).createdAt,
        updatedAt: (member.userId as any).updatedAt,
      },
    };

    return NextResponse.json({
      success: true,
      data: updatedMember,
      message: "Member updated successfully",
    });
  } catch (error: any) {
    console.error("Update member error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update member" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const memberId = params.id;

    // Find the member
    const member = await MemberModel.findById(memberId);
    if (!member) {
      return NextResponse.json(
        { success: false, error: "Member not found" },
        { status: 404 }
      );
    }

    const userId = member.userId;

    // Delete the member
    await MemberModel.findByIdAndDelete(memberId);

    // Delete the associated user
    await UserModel.findByIdAndDelete(userId);

    // Recalculate perExtra for all heshab records since member count changed
    try {
      await recalculatePerExtraForAllHeshab();
    } catch (recalcError: any) {
      console.error("Error recalculating perExtra after member deletion:", recalcError);
      // Don't fail the request if recalculation fails
    }

    return NextResponse.json({
      success: true,
      message: "Member deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete member error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete member" },
      { status: 500 }
    );
  }
}
