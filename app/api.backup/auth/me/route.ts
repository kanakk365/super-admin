import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get session cookie
    const sessionCookie = request.cookies.get('session');

    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    try {
      // Decode the session token
      const sessionData = JSON.parse(
        Buffer.from(sessionCookie.value, 'base64').toString('utf-8')
      );

      // Basic validation of session data
      if (!sessionData.email || !sessionData.name) {
        return NextResponse.json(
          { error: 'Invalid session' },
          { status: 401 }
        );
      }

      // Return user information
      return NextResponse.json(
        {
          success: true,
          user: {
            name: sessionData.name,
            email: sessionData.email,
            role: sessionData.role || 'admin',
            loginTime: sessionData.loginTime,
          },
        },
        { status: 200 }
      );
    } catch (decodeError) {
      // Invalid session token
      return NextResponse.json(
        { error: 'Invalid session token' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
