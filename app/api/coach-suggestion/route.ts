/**
 * AI Coach Suggestion Endpoint
 *
 * POST /api/coach-suggestion
 *
 * Generates coaching suggestions based on meeting transcript using OpenAI.
 * Uses gpt-5-mini for fast, cost-effective suggestions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { buildSystemPrompt } from '@/constants/meeting-coach-templates';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { apiKey, transcript, coachingStyle, templateId } = body;

    // Validate required fields
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key is required', code: 'INVALID_API_KEY' },
        { status: 400 }
      );
    }

    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript is required', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    if (!coachingStyle) {
      return NextResponse.json(
        { error: 'Coaching style is required', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    // Build system prompt with template and coaching style
    const systemPrompt = buildSystemPrompt(
      templateId || 'general',
      coachingStyle
    );

    // Call OpenAI Chat Completions API
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-5-mini',
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: transcript,
            },
          ],
          max_tokens: 300,
          temperature: 0.7,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (response.status === 401) {
          return NextResponse.json(
            { error: 'Invalid OpenAI API key', code: 'INVALID_API_KEY' },
            { status: 401 }
          );
        } else if (response.status === 429) {
          const retryAfter = response.headers.get('retry-after');
          return NextResponse.json(
            {
              error: 'Rate limit exceeded',
              code: 'RATE_LIMIT',
              retryAfter: retryAfter ? parseInt(retryAfter) : 60,
            },
            { status: 429 }
          );
        } else {
          return NextResponse.json(
            {
              error: errorData.error?.message || 'OpenAI API error',
              code: 'SERVER_ERROR',
            },
            { status: response.status }
          );
        }
      }

      const data = await response.json();
      const suggestion = data.choices?.[0]?.message?.content || null;

      // Check if LLM returned "NO_SUGGESTION"
      if (!suggestion || suggestion.trim() === 'NO_SUGGESTION') {
        return NextResponse.json({ suggestion: null }, { status: 200 });
      }

      // Validate suggestion (min 10 chars, max reasonable length)
      if (suggestion.length < 10) {
        return NextResponse.json({ suggestion: null }, { status: 200 });
      }

      return NextResponse.json({ suggestion: suggestion.trim() }, { status: 200 });
    } catch (fetchError) {
      clearTimeout(timeout);

      if ((fetchError as Error).name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timeout', code: 'REQUEST_TIMEOUT' },
          { status: 408 }
        );
      }

      throw fetchError;
    }
  } catch (error) {
    // Error logged to console for debugging
    return NextResponse.json(
      { error: 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
