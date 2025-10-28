/**
 * TEST ROUTE - Simple test to verify API routes work
 */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'API route working',
    message: 'If you see this, Next.js API routes are functioning',
    timestamp: new Date().toISOString()
  });
}

export async function POST() {
  return NextResponse.json({
    status: 'POST working',
    message: 'POST method is functioning',
    timestamp: new Date().toISOString()
  });
}

