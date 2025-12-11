import * as React from "react";

const ComparisonRow = ({
  otherAI,
  myCoachPilot,
}: {
  otherAI: { emoji: string; text: string };
  myCoachPilot: { emoji: string; text: string };
}) => {
  return (
    <div className="grid grid-cols-2 gap-4 py-4 border-b border-neutral-content/20 last:border-b-0">
      <div className="flex items-center gap-3 text-left">
        <span className="text-2xl">{otherAI.emoji}</span>
        <span className="text-sm md:text-base opacity-80">{otherAI.text}</span>
      </div>
      <div className="flex items-center gap-3 text-left">
        <span className="text-2xl">{myCoachPilot.emoji}</span>
        <span className="text-sm md:text-base font-medium">{myCoachPilot.text}</span>
      </div>
    </div>
  );
};

const Problem = () => {
  const comparisons = [
    {
      otherAI: { emoji: "🔊", text: "They speak out loud" },
      myCoachPilot: { emoji: "🔇", text: "Responds only in text" },
    },
    {
      otherAI: { emoji: "😳", text: "Everyone hears you using AI" },
      myCoachPilot: { emoji: "🥷", text: "Nobody knows anything" },
    },
    {
      otherAI: { emoji: "❌", text: "Impossible to use in meetings" },
      myCoachPilot: { emoji: "✅", text: "Perfect for meetings and calls" },
    },
    {
      otherAI: { emoji: "⏸️", text: "You have to stop to ask" },
      myCoachPilot: { emoji: "⚡", text: "Real-time suggestions" },
    },
  ];

  return (
    <section className="bg-neutral text-neutral-content">
      <div className="max-w-4xl mx-auto px-8 py-16 md:py-24">
        <h2 className="text-center font-extrabold text-3xl md:text-5xl tracking-tight mb-4">
          The problem with other AI assistants
        </h2>
        <p className="text-center text-lg opacity-80 mb-12 max-w-2xl mx-auto">
          Traditional AI assistants weren&apos;t designed for real conversations.
        </p>

        {/* Comparison Table */}
        <div className="bg-neutral-focus/50 rounded-2xl p-6 md:p-8">
          {/* Header */}
          <div className="grid grid-cols-2 gap-4 pb-4 border-b-2 border-neutral-content/30 mb-2">
            <div className="text-sm md:text-base font-bold opacity-60">Other AI Assistants</div>
            <div className="text-sm md:text-base font-bold text-primary">MyCoachPilot</div>
          </div>

          {/* Rows */}
          {comparisons.map((comparison, index) => (
            <ComparisonRow
              key={index}
              otherAI={comparison.otherAI}
              myCoachPilot={comparison.myCoachPilot}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Problem;
