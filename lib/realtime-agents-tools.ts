import { Agent } from '@openai/agents';
import { tool, RealtimeContextData } from '@openai/agents-realtime';
import { z } from 'zod';
import { log } from '@/lib/logger';

// 1. AGENTS AS TOOLS - For thinking mode
const deepThinker = new Agent({
  name: 'Deep Thinker',
  instructions: `You are a thoughtful analyst who carefully considers problems from multiple angles.
  Break down complex problems step by step and provide thorough reasoning.
  Focus on providing insights, patterns, and strategic advice.`,
  model:'gpt-5',
});

// Convert the agent to a tool
const deepThinkingTool = deepThinker.asTool({
  toolName: 'think_deeply',
  toolDescription: 'Engage in deep thinking and reasoning about complex topics or the current conversation',
});

// 2. DELEGATION THROUGH TOOLS - For image/file analysis (screenshots and uploads)
const analyzeImageParameters = z.object({
  prompt: z.string().describe('What to analyze in the image').default('Analyze this image and provide helpful insights'),
});

const analyzeImageTool = tool<
  typeof analyzeImageParameters,
  RealtimeContextData
>({
  name: 'analyze_image',
  description: 'Analyze an image (screenshot or uploaded file) and provide insights',
  parameters: analyzeImageParameters,
  execute: async ({ prompt }) => {
    try {
      // Check for image data from either screenshot or file upload
      const imageData = (window as any).__pendingScreenshot || (window as any).__pendingFile;

      if (!imageData) {
        return `Error: No image found. Please capture a screenshot or upload an image first.`;
      }

      // Clear the pending data after using it
      (window as any).__pendingScreenshot = null;
      (window as any).__pendingFile = null;

      // Image analysis requires backend API - placeholder for custom implementation
      log.info('[Tool] Image analysis requested', { prompt, hasImage: !!imageData });

      return `Image analysis feature requires a vision API endpoint. Please implement /api/vision-analysis or use a direct OpenAI Vision API call.`;

    } catch (error) {
      log.error('[Tool] Error analyzing image:', error);
      return `Error analyzing image: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },
});

// 3. Code analysis tool (bonus)
const codeAnalyzer = new Agent({
  name: 'Code Analyst',
  instructions: 'You are an expert programmer who analyzes code for bugs, performance issues, and best practices. Provide actionable insights.',
  model: 'gpt-5',
});

const codeAnalysisTool = codeAnalyzer.asTool({
  toolName: 'analyze_code',
  toolDescription: 'Analyze code snippets for issues, improvements, and best practices',
});

// Export all tools for the RealtimeAgent
export const realtimeTools = [
  deepThinkingTool,
  analyzeImageTool,
  codeAnalysisTool,
];
