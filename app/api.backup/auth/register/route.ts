import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 },
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 },
      );
    }

    // Simulate successful registration
    const newUser = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      email: email.toLowerCase(),
      role:
        email.toLowerCase() === "superadmin@gmail.com"
          ? "super_admin"
          : "admin",
      createdAt: new Date().toISOString(),
    };

    // Create a simple session token (in production, use proper JWT with secret)
    const sessionToken = Buffer.from(
      JSON.stringify({
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        loginTime: new Date().toISOString(),
      }),
    ).toString("base64");

    // Create response with session cookie
    const response = NextResponse.json(
      {
        success: true,
        message: "Registration successful",
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      },
      { status: 201 },
    );

    // Set HTTP-only cookie for session
    response.cookies.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
