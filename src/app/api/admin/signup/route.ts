import { NextRequest, NextResponse } from 'next/server';
import { setAdminSession } from '@/lib/auth';
import { db } from '@/lib/turso';
import { users } from '@/lib/db/schema/landlord';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email)
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create admin user
    const newUser = await db.insert(users).values({
      email,
      password: hashedPassword,
      name,
      role: 'admin',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).returning();

    if (!newUser || newUser.length === 0) {
      return NextResponse.json({ error: 'Failed to create admin user' }, { status: 500 });
    }

    // Set session cookie with JWT token
    const sessionCookie = setAdminSession({
      id: newUser[0].id,
      email: newUser[0].email,
      name: newUser[0].name,
      role: newUser[0].role
    });

    const response = NextResponse.json({ 
      success: true, 
      user: { 
        id: newUser[0].id, 
        email: newUser[0].email, 
        name: newUser[0].name,
        role: newUser[0].role
      } 
    });
    
    response.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.options);

    return response;
  } catch (error) {
    console.error('Admin signup error:', error);
    return NextResponse.json({ error: 'Signup failed' }, { status: 500 });
  }
}