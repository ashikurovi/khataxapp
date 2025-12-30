import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import UserModel from "@/app/api/models/User";
import { UserRole } from "@/types";
import { generateToken } from "@/lib/jwt";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await UserModel.findOne({ email: email.toLowerCase() });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check if user is manager/admin
    if (user.role !== UserRole.MANAGER && user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: "Access denied. Manager account required." },
        { status: 403 }
      );
    }

    // Simple password check (for demo: manager123)
    // In production, use bcrypt or similar
    if (user.password !== password) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Generate JWT token for manager
    const token = await generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    });

    // Return user data with token
    return NextResponse.json({
      success: true,
      data: {
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        token,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Login failed" },
      { status: 500 }
    );
  }
}

