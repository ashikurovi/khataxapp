import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import UserModel from "@/app/api/models/User";
import { UserRole } from "@/types";

// This route initializes the manager account
// Call this once to create the manager user
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const managerEmail = "manager@gmail.com";
    const managerPassword = "manager123";

    // Check if manager already exists
    const existingManager = await UserModel.findOne({
      email: managerEmail,
      role: { $in: [UserRole.MANAGER, UserRole.ADMIN] },
    });

    if (existingManager) {
      // Update password if manager exists
      existingManager.password = managerPassword;
      await existingManager.save();
      return NextResponse.json({
        success: true,
        message: "Manager account password updated",
        data: {
          email: existingManager.email,
          role: existingManager.role,
        },
      });
    }

    // Create new manager account
    const manager = await UserModel.create({
      name: "Manager",
      dept: "Management",
      institute: "KhataX",
      phone: "0000000000",
      email: managerEmail,
      picture: "",
      password: managerPassword,
      role: UserRole.MANAGER,
    });

    return NextResponse.json({
      success: true,
      message: "Manager account created successfully",
      data: {
        email: manager.email,
        role: manager.role,
      },
    });
  } catch (error: any) {
    console.error("Init manager error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to initialize manager" },
      { status: 500 }
    );
  }
}

// GET endpoint to check if manager exists
export async function GET() {
  try {
    await connectDB();
    const manager = await UserModel.findOne({
      email: "manager@gmail.com",
      role: { $in: [UserRole.MANAGER, UserRole.ADMIN] },
    });

    return NextResponse.json({
      success: true,
      exists: !!manager,
      email: manager?.email || null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

