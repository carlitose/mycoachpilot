"use client"
import { Mic, Settings, Play, Camera } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
  onStartSession: () => void;
}

export default function EmptyState({ onStartSession }: EmptyStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Main illustration/icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-32 h-32 bg-gradient-to-br from-violet-600 to-blue-600 rounded-full flex items-center justify-center animate-pulse">
              <Mic className="w-16 h-16 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <Play className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Welcome message */}
        <div className="space-y-3">
          <h2 className="text-3xl font-bold text-slate-50">
            Welcome to My Coach Pilot!
          </h2>
          <p className="text-lg text-slate-300">
            Your AI-powered voice assistant is ready to help
          </p>
        </div>

        {/* CTA Button */}
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={onStartSession}
            className="group relative px-8 py-4 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 rounded-xl text-white font-semibold text-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <span className="flex items-center gap-3">
              <Play className="w-6 h-6" />
              Press to Start Your Session
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping" />
            </span>
          </button>

          <p className="text-sm text-slate-400">
            Click the button above or press the <span className="text-violet-400 font-mono">Play</span> icon below
          </p>
        </div>

        {/* Quick tips section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-gradient-to-br from-green-900/30 to-green-800/20 rounded-lg p-4 space-y-2 border-2 border-green-500/50">
            <div className="flex items-center gap-2 text-green-400">
              <span className="text-xl">🎁</span>
              <h3 className="font-semibold text-sm">Free Forever</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Unlimited speech-to-text transcription. No AI, no limits.
            </p>
            <Link
              href="/app/settings/ai"
              className="text-xs text-green-400 hover:text-green-300 underline inline-block"
            >
              Switch to Free Mode →
            </Link>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4 space-y-2 border border-slate-700">
            <div className="flex items-center gap-2 text-blue-400">
              <Settings className="w-5 h-5" />
              <h3 className="font-semibold">Choose Your Template</h3>
            </div>
            <p className="text-sm text-slate-400">
              7 pre-built templates for different use cases
            </p>
            <Link
              href="/app/settings/ai"
              className="text-xs text-blue-400 hover:text-blue-300 underline"
            >
              Browse Templates →
            </Link>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4 space-y-2 border border-slate-700">
            <div className="flex items-center gap-2 text-green-400">
              <Camera className="w-5 h-5" />
              <h3 className="font-semibold">Screen Capture</h3>
            </div>
            <p className="text-sm text-slate-400">
              Share what you&apos;re seeing with AI using screen capture
            </p>
          </div>
        </div>

        {/* Additional info */}
        <div className="flex items-center justify-center gap-6 text-sm text-slate-500 pt-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span>Ultra-low latency</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <span>GPT-5 Powered</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-violet-500 rounded-full" />
            <span>Real-time transcription</span>
          </div>
        </div>
      </div>
    </div>
  );
}
