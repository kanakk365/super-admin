import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // For now, we'll use hardcoded credentials for the super admin
    // In a real application, you would validate against a database
    const SUPER_ADMIN_EMAIL = 'superadmin@gmail.com';
    const SUPER_ADMIN_PASSWORD = 'stringabcd';

    if (email === SUPER_ADMIN_EMAIL && password === SUPER_ADMIN_PASSWORD) {
      // Create a simple session token (in production, use proper JWT with secret)
      const sessionToken = Buffer.from(
        JSON.stringify({
          email,
          name: 'superadmin',
          role: 'super_admin',
          loginTime: new Date().toISOString(),
        })
      ).toString('base64');

      // Create response with session cookie
      const response = NextResponse.json(
        {
          success: true,
          message: 'Login successful',
          user: {
            name: 'superadmin',
            email: SUPER_ADMIN_EMAIL,
            role: 'super_admin',
          },
        },
        { status: 200 }
      );

      // Set HTTP-only cookie for session
      response.cookies.set('session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60, // 24 hours
        path: '/',
      });

      return response;
    } else {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
