import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, password } = body;

    // Validate required fields
    if (!firstName || !email || !password) {
      return NextResponse.json(
        {
          statusCode: 400,
          success: false,
          message: "First name, email, and password are required",
        },
        { status: 400 },
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          statusCode: 400,
          success: false,
          message: "Invalid email format",
        },
        { status: 400 },
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        {
          statusCode: 400,
          success: false,
          message: "Password must be at least 6 characters long",
        },
        { status: 400 },
      );
    }

    // TODO: Check if user already exists in database

    // Generate a unique ID
    const generateId = () => {
      return "cmex" + Math.random().toString(36).substr(2, 15);
    };

    // Simulate successful registration
    const newUser = {
      id: generateId(),
      firstName,
      lastName: lastName || "",
      email: email.toLowerCase(),
      role: "SUPERADMIN",
      createdAt: new Date().toISOString(),
    };

    // Return success response without auto-login
    return NextResponse.json(
      {
        statusCode: 201,
        success: true,
        message: "Super admin registered successfully",
        data: newUser,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      {
        statusCode: 500,
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    );
  }
}
