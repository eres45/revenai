import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Add a configuration to ensure this route is dynamic
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    
    if (!email) {
      console.log('[Set Cookie API] No email provided, clearing cookie');
      // Clear the cookie if no email is provided
      const cookieStore = cookies();
      await cookieStore.set({
        name: 'userEmail',
        value: '',
        httpOnly: false,
        path: '/',
        maxAge: 0, // Expire immediately
        sameSite: 'lax'
      });
      return NextResponse.json({ success: true, message: "Cookie cleared" });
    }
    
    console.log('[Set Cookie API] Setting cookie for email:', email);
    
    // Encode the email to prevent ByteString errors
    const encodedEmail = encodeURIComponent(email);
    
    // Set the cookie
    try {
      const cookieStore = cookies();
      await cookieStore.set({
        name: 'userEmail',
        value: encodedEmail,
        httpOnly: false,
        path: '/',
        maxAge: 60 * 60 * 24 * 365, // 1 year
        sameSite: 'lax'
      });
      console.log('[Set Cookie API] Cookie set successfully');
    } catch (cookieError) {
      console.error('[Set Cookie API] Error setting cookie:', cookieError);
      return NextResponse.json(
        { error: "Failed to set cookie", details: cookieError },
        { status: 500 }
      );
    }
    
    // Return success with Set-Cookie header as well for redundancy
    const response = NextResponse.json({ success: true, message: "Cookie set" });
    response.headers.set('Set-Cookie', `userEmail=${encodedEmail}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`);
    
    return response;
  } catch (error: any) {
    console.error('[Set Cookie API] Error:', error);
    return NextResponse.json(
      { error: error.message || "Failed to set cookie" },
      { status: 500 }
    );
  }
} 