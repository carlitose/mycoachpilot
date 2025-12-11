import * as React from "react";

const UseCase = ({
  emoji,
  title,
  scenario,
}: {
  emoji: string;
  title: string;
  scenario: string;
}) => {
  return (
    <div className="bg-base-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
      <div className="text-4xl mb-4">{emoji}</div>
      <h3 className="font-bold text-lg mb-3">{title}</h3>
      <p className="text-base-content/70 italic">&quot;{scenario}&quot;</p>
    </div>
  );
};

const FeaturesGrid = () => {
  const useCases = [
    {
      emoji: "🏢",
      title: "In a meeting with your boss",
      scenario: "The CEO asks you a question about Q3 numbers. MyCoachPilot shows you the exact data while you speak.",
    },
    {
      emoji: "📞",
      title: "On a call with a difficult client",
      scenario: "The client raises an objection. The AI suggests 3 possible responses in real-time.",
    },
    {
      emoji: "🎓",
      title: "In class or a course",
      scenario: "The professor explains a complex concept. The AI re-explains it simply, while they speak.",
    },
    {
      emoji: "💼",
      title: "In a job interview",
      scenario: "They ask you a technical question. You see the structured answer on screen, respond with confidence.",
    },
    {
      emoji: "🏥",
      title: "At the doctor or lawyer",
      scenario: "You don't understand the technical terms. The AI translates them in real-time and suggests what to ask.",
    },
  ];

  return (
    <section className="bg-base-100">
      <div className="py-24 px-8 max-w-7xl mx-auto">
        <div className="flex flex-col text-center w-full mb-16">
          <div className="mb-6">
            <span className="badge badge-primary badge-lg">Real-World Scenarios</span>
          </div>
          <h2 className="max-w-2xl mx-auto font-extrabold text-4xl md:text-5xl tracking-tight mb-6">
            When do you need MyCoachPilot?
          </h2>
          <p className="max-w-lg mx-auto text-lg opacity-80 leading-relaxed">
            Whenever you need an expert by your side - but can&apos;t let anyone know.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-6">
          {useCases.map((useCase, index) => (
            <UseCase
              key={index}
              emoji={useCase.emoji}
              title={useCase.title}
              scenario={useCase.scenario}
            />
          ))}
        </div>

        <div className="flex flex-col items-center mt-16 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-8">
          <div className="badge badge-accent mb-4">🔇 Silent Mode</div>
          <h3 className="text-2xl font-bold mb-4 text-center">You read. They hear nothing.</h3>
          <p className="text-center max-w-md opacity-80">
            AI suggestions appear only on your screen. Perfect for any situation where discretion matters.
          </p>
        </div>
      </div>
    </section>
  );
};

export default FeaturesGrid;
