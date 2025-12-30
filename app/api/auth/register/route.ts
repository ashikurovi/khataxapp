import { NextRequest, NextResponse } from "next/server";
import { MemberRegistrationForm, UserRole } from "@/types";
import connectDB from "@/lib/db";
import UserModel from "@/app/api/models/User";
import MemberModel from "@/app/api/models/Member";
import { generateToken } from "@/lib/jwt";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const data: MemberRegistrationForm & { googleId: string } = await request.json();

    // Validate required fields
    if (!data.email || !data.googleId || !data.name || !data.dept || !data.institute || !data.phone) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await UserModel.findOne({
      $or: [{ email: data.email }, { googleId: data.googleId }],
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "User already exists" },
        { status: 400 }
      );
    }

    // Create user
    const user = await UserModel.create({
      name: data.name,
      dept: data.dept,
      institute: data.institute,
      phone: data.phone,
      email: data.email,
      picture: data.picture || "",
      googleId: data.googleId,
      role: UserRole.MEMBER,
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

    // Generate JWT token
    const token = await generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    });

    return NextResponse.json({
      success: true,
      message: "User registered successfully",
      data: { 
        userId: user._id.toString(),
        token,
      },
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    
    // Provide user-friendly error messages
    let errorMessage = "Registration failed. Please try again.";
    
    if (error.name === "MongooseServerSelectionError") {
      errorMessage = "Unable to connect to the database. Please check your connection or contact support.";
    } else if (error.name === "MongoServerError") {
      if (error.code === 11000) {
        errorMessage = "This email or account is already registered.";
      } else {
        errorMessage = "Database error occurred. Please try again.";
      }
    } else if (error.message?.includes("SSL") || error.message?.includes("TLS")) {
      errorMessage = "Database connection error. Please check your network connection.";
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

