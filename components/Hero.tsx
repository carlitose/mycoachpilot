"use client";

import Link from "next/link";

const Hero = () => {
  return (
    <section className="max-w-7xl mx-auto bg-base-100 flex flex-col lg:flex-row items-center justify-center gap-16 lg:gap-20 px-8 py-8 lg:py-20">
      <div className="flex flex-col gap-10 lg:gap-14 items-center justify-center text-center lg:text-left lg:items-start">
        <div className="flex flex-col gap-2 items-center lg:items-start">
          <div className="badge badge-primary badge-lg">
            🔇 Silent AI - Nobody will know you&apos;re using it
          </div>
        </div>

        <h1 className="font-extrabold text-4xl lg:text-6xl tracking-tight md:-mb-4">
          An expert
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {" "}
            whispering in your ear.
          </span>
          <br />
          <span className="text-3xl lg:text-5xl">In every conversation. In silence.</span>
        </h1>

        <p className="text-lg leading-relaxed !text-gray-900 dark:!text-gray-100 max-w-xl">
          The AI that listens to your meetings, calls and conversations and suggests
          what to say in real-time.{" "}
          <span className="font-bold !text-gray-900 dark:!text-gray-100">
            You read, others hear nothing.
          </span>
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Link href="/signin?trial=true" className="btn btn-primary btn-wide">
            Try Free
          </Link>
          <a
            href="https://www.youtube.com/watch?v=8eb2wqJickg"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline btn-wide"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M8 5v10l7-5-7-5z" />
            </svg>
            Watch How It Works
          </a>
        </div>

        <div className="text-center lg:text-left space-y-2">
          <p className="text-sm !text-gray-700 dark:!text-gray-300 flex items-center gap-2">
            <span className="text-success">✓</span> Works with Zoom, Meet, Teams, and any audio
          </p>
          <p className="text-sm !text-gray-700 dark:!text-gray-300 flex items-center gap-2">
            <span className="text-success">✓</span> Real-time AI responses (GPT-5)
          </p>
          <p className="text-sm !text-gray-700 dark:!text-gray-300 flex items-center gap-2">
            <span className="text-success">✓</span> Nobody knows you&apos;re using it
          </p>
        </div>
      </div>

      <div className="lg:w-full">
        {/* Demo of the silent AI interface */}
        <div className="mockup-window border bg-base-300 shadow-2xl">
          <div className="flex justify-center px-4 py-8 bg-base-200">
            <div className="w-full max-w-md">
              {/* Video call simulation */}
              <div className="bg-gray-800 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-white text-xs font-medium">Zoom Meeting</span>
                  </div>
                  <div className="ml-auto">
                    <span className="text-green-400 text-xs">● Recording</span>
                  </div>
                </div>

                {/* Mock video call participants */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-gray-700 rounded aspect-video flex flex-col items-center justify-center p-2">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mb-1">
                      <span className="text-white text-xs font-bold">CEO</span>
                    </div>
                    <span className="text-gray-400 text-xs">John Smith</span>
                  </div>
                  <div className="bg-gray-700 rounded aspect-video flex flex-col items-center justify-center p-2 ring-2 ring-primary">
                    <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center mb-1">
                      <span className="text-white text-xs font-bold">You</span>
                    </div>
                    <span className="text-gray-400 text-xs">Speaking...</span>
                  </div>
                </div>

                {/* CEO Question */}
                <div className="bg-gray-700 rounded-lg p-2 mb-3">
                  <div className="text-gray-400 text-xs mb-1">CEO asking:</div>
                  <div className="text-white text-sm italic">
                    &quot;What were our Q3 conversion rates?&quot;
                  </div>
                </div>
              </div>

              {/* Silent AI Suggestion - Only you can see */}
              <div className="bg-gradient-to-r from-primary/20 to-secondary/20 border-2 border-primary rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-primary text-lg">🔇</span>
                  <span className="text-primary text-xs font-bold uppercase">Only you can see this</span>
                </div>
                <div className="text-base-content text-sm">
                  <span className="font-semibold">Q3 Results:</span> Conversion rate was 4.2%, up 18% from Q2.
                  Main drivers: new checkout flow (+12%) and email campaigns (+6%).
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="loading loading-dots loading-xs text-primary"></div>
                  <span className="text-xs text-base-content/60">Listening...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
