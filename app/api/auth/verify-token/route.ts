import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import connectDB from "@/lib/db";
import UserModel from "@/app/api/models/User";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Get token from query parameter
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token is required" },
        { status: 400 }
      );
    }

    // Verify the token
    const payload = await verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Get user from database to ensure user still exists
    const user = await UserModel.findById(payload.userId).lean();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Return user data
    return NextResponse.json({
      success: true,
      data: {
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        token, // Return the same token
      },
    });
  } catch (error: any) {
    console.error("Token verification error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Token verification failed" },
      { status: 500 }
    );
  }
}
