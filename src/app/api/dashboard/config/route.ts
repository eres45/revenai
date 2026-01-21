import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Add a configuration to ensure this route is dynamic
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Get all cookies for debugging
    const cookieStore = cookies();
    const allCookies = cookieStore.getAll();
    
    return NextResponse.json({
      dynamic: 'force-dynamic is set',
      cookies: allCookies.map(c => ({ name: c.name, value: c.value })),
      headers: Object.fromEntries(req.headers),
      url: req.url,
      nextUrl: req.nextUrl.toString(),
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("API Config error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get API config" },
      { status: 500 }
    );
  }
} 