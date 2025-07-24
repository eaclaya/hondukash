import { NextRequest, NextResponse } from 'next/server';
import { setAdminSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Simple authentication check (in production, use proper password hashing)
    if (email === 'ealexander.zm@gmail.com' && password === 'erick123') {
      const sessionCookie = setAdminSession();

      const response = NextResponse.json({ success: true });
      response.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.options);

      return response;
    }

    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
