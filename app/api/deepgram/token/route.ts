/**
 * Deepgram API Key Validation Endpoint
 *
 * POST /api/deepgram/token
 *
 * Validates a Deepgram API key by testing it against Deepgram's API.
 * Does NOT store or log the API key.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { apiKey } = body;

    if (!apiKey) {
      return NextResponse.json(
        { valid: false, error: 'API key is required' },
        { status: 400 }
      );
    }

    // Validate format: Deepgram keys are typically 30+ characters
    if (apiKey.length < 30 || !/^[a-zA-Z0-9_-]+$/.test(apiKey)) {
      return NextResponse.json(
        { valid: false, error: 'Invalid API key format' },
        { status: 400 }
      );
    }

    // Test the API key by calling Deepgram's projects endpoint
    const response = await fetch('https://api.deepgram.com/v1/projects', {
      method: 'GET',
      headers: {
        Authorization: `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      return NextResponse.json({ valid: true }, { status: 200 });
    } else if (response.status === 401 || response.status === 403) {
      return NextResponse.json(
        { valid: false, error: 'Unauthorized. Check your API key.' },
        { status: 401 }
      );
    } else {
      return NextResponse.json(
        { valid: false, error: 'Network error. Please try again.' },
        { status: 500 }
      );
    }
  } catch (error) {
    // Error logged for debugging
    return NextResponse.json(
      { valid: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
