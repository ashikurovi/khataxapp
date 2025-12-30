import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import UserModel from "@/app/api/models/User";
import { generateToken } from "@/lib/jwt";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { email, googleId } = await request.json();

    const user = await UserModel.findOne({
      $or: [{ email }, { googleId }],
    });

    if (!user) {
      return NextResponse.json({
        success: true,
        exists: false,
        role: null,
        userId: null,
        token: null,
      });
    }

    // Generate JWT token for existing user
    const token = await generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    });

    return NextResponse.json({
      success: true,
      exists: true,
      role: user.role,
      userId: user._id.toString(),
      token,
    });
  } catch (error: any) {
    console.error("Check user error:", error);
    
    // Provide user-friendly error messages
    let errorMessage = "Unable to verify user. Please try again.";
    
    if (error.name === "MongooseServerSelectionError") {
      errorMessage = "Database connection error. Please check your connection.";
    } else if (error.message?.includes("SSL") || error.message?.includes("TLS")) {
      errorMessage = "Connection error. Please check your network.";
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

