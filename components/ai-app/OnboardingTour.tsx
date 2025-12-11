"use client"
import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';

interface OnboardingStep {
  title: string;
  description: string;
  highlight?: string;
  icon: string;
}

interface OnboardingTourProps {
  onComplete: () => void;
  onSkip: () => void;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: "Welcome to My Coach Pilot! 🎉",
    description: "Free transcription forever + 60 minutes AI trial. Choose what works for you. Let's get you started in just 60 seconds!",
    icon: "👋"
  },
  {
    title: "Free Transcription Forever 🎁",
    description: "Want just speech-to-text? Switch to Free Transcription Mode in AI Settings for unlimited transcription - no AI responses, no limits, completely free forever. Or try the full AI assistant with your 60 minute trial!",
    highlight: "ai-settings",
    icon: "🎁"
  },
  {
    title: "Press Play to Start",
    description: "Click the Play button (▶️) in the toolbar below to start a voice session. Your AI assistant will listen and respond in real-time.",
    highlight: "play-button",
    icon: "🎤"
  },
  {
    title: "Choose Your AI Template",
    description: "Select from 7 pre-built templates (Interview, Education, Meeting Notes, etc.) in AI Settings. Each template is optimized for different use cases.",
    highlight: "ai-settings",
    icon: "🎓"
  },
  {
    title: "Track Your Minutes",
    description: "Your remaining minutes are always visible in the top-right corner. You'll get warnings when running low.",
    highlight: "minutes-counter",
    icon: "⏱️"
  },
  {
    title: "You're All Set! 🚀",
    description: "That's it! Start your first session now and experience the power of real-time AI voice assistance.",
    icon: "✨"
  }
];

export default function OnboardingTour({ onComplete, onSkip }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in after mount
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  const handleSkipTour = () => {
    setIsVisible(false);
    setTimeout(() => {
      onSkip();
    }, 300);
  };

  const step = ONBOARDING_STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  return (
    <div
      className={`fixed inset-0 z-50 transition-all duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Tour modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className={`relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl border border-slate-700 max-w-2xl w-full transform transition-all duration-300 ${
            isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
          }`}
        >
          {/* Skip button */}
          <button
            onClick={handleSkipTour}
            className="absolute top-4 right-4 p-2 hover:bg-slate-700 rounded-lg transition-colors group"
            title="Skip tour"
          >
            <X className="w-5 h-5 text-slate-400 group-hover:text-slate-200" />
          </button>

          {/* Content */}
          <div className="p-8 md:p-12">
            {/* Step icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-violet-600 to-blue-600 rounded-full flex items-center justify-center text-4xl">
                {step.icon}
              </div>
            </div>

            {/* Step content */}
            <div className="text-center space-y-4 mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-50">
                {step.title}
              </h2>
              <p className="text-lg text-slate-300 leading-relaxed">
                {step.description}
              </p>
            </div>

            {/* Progress indicators */}
            <div className="flex justify-center gap-2 mb-8">
              {ONBOARDING_STEPS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentStep
                      ? 'w-8 bg-violet-500'
                      : index < currentStep
                      ? 'w-2 bg-green-500'
                      : 'w-2 bg-slate-600'
                  }`}
                  aria-label={`Go to step ${index + 1}`}
                />
              ))}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between gap-4">
              {/* Previous button */}
              <button
                onClick={handlePrevious}
                disabled={isFirstStep}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  isFirstStep
                    ? 'opacity-0 pointer-events-none'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Previous</span>
              </button>

              {/* Step counter */}
              <div className="text-sm text-slate-400 font-medium">
                {currentStep + 1} / {ONBOARDING_STEPS.length}
              </div>

              {/* Next/Complete button */}
              <button
                onClick={handleNext}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 ${
                  isLastStep
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
                    : 'bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white'
                }`}
              >
                <span>{isLastStep ? "Let's Go!" : 'Next'}</span>
                {isLastStep ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Skip link */}
            {!isLastStep && (
              <div className="text-center mt-6">
                <button
                  onClick={handleSkipTour}
                  className="text-sm text-slate-400 hover:text-slate-200 underline transition-colors"
                >
                  Skip tour and explore on my own
                </button>
              </div>
            )}
          </div>

          {/* Decorative elements */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-violet-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl" />
        </div>
      </div>
    </div>
  );
}
