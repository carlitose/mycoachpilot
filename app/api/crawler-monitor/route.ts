import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { log } from "@/lib/logger";

// AI Crawler User Agents to monitor
const AI_CRAWLERS = {
  GPTBot: "OpenAI GPT",
  "ChatGPT-User": "ChatGPT",
  ClaudeBot: "Claude",
  "Claude-Web": "Claude Web",
  PerplexityBot: "Perplexity",
  "OAI-SearchBot": "OpenAI Search",
  GoogleOther: "Google Gemini/Bard",
  BingBot: "Bing AI",
};

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "";
    const timestamp = new Date().toISOString();
    const ip =
      headersList.get("x-forwarded-for") ||
      headersList.get("x-real-ip") ||
      "unknown";

    // Check if this is an AI crawler
    let detectedCrawler = null;
    for (const [crawler, name] of Object.entries(AI_CRAWLERS)) {
      if (userAgent.includes(crawler)) {
        detectedCrawler = name;
        break;
      }
    }

    if (detectedCrawler) {
      // Log AI crawler access
      log.info(`[AI Crawler Detected] ${timestamp}`);
      log.info(`Crawler: ${detectedCrawler}`);
      log.info(`User-Agent: ${userAgent}`);
      log.info(`IP: ${ip}`);
      log.info(`Path: ${request.url}`);

      // Here you could save to database for analytics
      // await saveToDatabase({ crawler: detectedCrawler, timestamp, ip, path: request.url });

      return NextResponse.json({
        detected: true,
        crawler: detectedCrawler,
        timestamp,
        message: "AI crawler access logged",
      });
    }

    return NextResponse.json({
      detected: false,
      message: "Not an AI crawler",
    });
  } catch (error) {
    log.error("Crawler monitoring error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Middleware to track crawler access on GET requests
export async function GET(request: NextRequest) {
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "";

  // Check for AI crawlers
  const crawlers = Object.entries(AI_CRAWLERS)
    .filter(([crawler]) => userAgent.includes(crawler))
    .map(([, name]) => name);

  return NextResponse.json({
    userAgent,
    isAICrawler: crawlers.length > 0,
    crawlers,
    timestamp: new Date().toISOString(),
  });
}
