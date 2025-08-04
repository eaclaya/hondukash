import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true });
    
    // Clear the admin session cookie
    response.cookies.set('admin-session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // This expires the cookie immediately
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Admin logout error:', error);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}