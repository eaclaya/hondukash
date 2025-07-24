import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // In a more sophisticated setup, you might want to:
    // 1. Invalidate the token on the server side
    // 2. Add the token to a blacklist
    // 3. Log the logout event

    // For now, we'll just return a success response
    // The client will handle clearing local storage
    
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error: any) {
    console.error('Logout API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}