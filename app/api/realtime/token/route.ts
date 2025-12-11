import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, instructions, isTranscriptOnly } = body;

    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 400 });
    }

    if (isTranscriptOnly) {
      // TRANSCRIPT-ONLY MODE
      // Uses GA API endpoint /v1/realtime/client_secrets with type: 'transcription'
      const response = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session: {
            type: 'transcription',
            audio: {
              input: {
                transcription: {
                  model: 'gpt-4o-mini-transcribe'
                }
              }
            }
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return NextResponse.json(
          { error: 'Failed to generate transcription token', details: errorData },
          { status: response.status }
        );
      }

      const tokenData = await response.json();
      return NextResponse.json({
        token: tokenData.value,
        expires_at: tokenData.expires_at,
        mode: 'transcript_only',
      });

    } else {
      // CONVERSATION MODE
      // Uses GA API endpoint /v1/realtime/client_secrets with type: 'realtime'
      const response = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session: {
            type: 'realtime',
            model: 'gpt-realtime',
            instructions: instructions || 'You are a helpful AI assistant.',
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return NextResponse.json(
          { error: 'Failed to generate conversation token', details: errorData },
          { status: response.status }
        );
      }

      const tokenData = await response.json();
      return NextResponse.json({
        token: tokenData.value,
        expires_at: tokenData.expires_at,
        mode: 'conversation',
      });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
  }
}
