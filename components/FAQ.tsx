"use client";

import { useRef, useState } from "react";
import type { JSX } from "react";

// <FAQ> component is a lsit of <Item> component
// Just import the FAQ & add your FAQ content to the const faqList arrayy below.

interface FAQItemProps {
  question: string;
  answer: JSX.Element;
}

const faqList: FAQItemProps[] = [
  {
    question: "Is there a free plan?",
    answer: (
      <div className="space-y-2 leading-relaxed">
        <p>
          <strong className="text-success">🎁 YES! Transcription is FREE FOREVER.</strong>
        </p>
        <p>You get two ways to use My Coach Pilot:</p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>
            <strong>Free Transcription Mode</strong> - unlimited real-time speech-to-text transcription, completely free forever. Perfect for note-taking, meetings, and lectures. No AI responses, just accurate transcripts.
          </li>
          <li>
            <strong>AI Conversation Mode</strong> - 60 minutes free trial to test all AI features (intelligent responses, templates, custom instructions). Upgrade to paid plans for unlimited AI assistance.
          </li>
        </ul>
        <p className="text-sm opacity-75">
          Switch between modes anytime in AI Settings. No credit card required to start.
        </p>
      </div>
    ),
  },
  {
    question: "What do I get exactly?",
    answer: (
      <div className="space-y-2 leading-relaxed">
        <p>With My Coach Pilot you get:</p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>
            <strong>Web app</strong> with real-time AI voice assistant
          </li>
          <li>
            <strong>GPT-5 Realtime powered</strong> intelligence
          </li>
          <li>
            <strong>7 pre-built templates</strong> for different use cases
          </li>
          <li>
            <strong>Unlimited custom templates</strong> you can create
          </li>
          <li>
            <strong>Real-time audio transcription</strong> with 99% accuracy
          </li>
          <li>
            <strong>Silent Mode</strong> - mute bot, read text responses
          </li>
          <li>
            <strong>Screen capture</strong> for important visuals
          </li>
          <li>
            <strong>Setup guide</strong> to get started in 60 seconds
          </li>
        </ul>
      </div>
    ),
  },
  {
    question: "What templates are available?",
    answer: (
      <div className="space-y-2 leading-relaxed">
        <p>
          Choose from 7 pre-built templates or create unlimited custom ones:
        </p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>
            <strong>General Assistant</strong> - default multi-purpose template
          </li>
          <li>
            <strong>Technical Interview</strong> - coding & system design help
          </li>
          <li>
            <strong>Meeting Notes</strong> - transcription & action items
          </li>
          <li>
            <strong>Education & Learning</strong> - tutoring & explanations
          </li>
          <li>
            <strong>Customer Support</strong> - call assistance & responses
          </li>
          <li>
            <strong>Content Creation</strong> - writing & brainstorming
          </li>
          <li>
            <strong>Custom Templates</strong> - create your own for any workflow
          </li>
        </ul>
      </div>
    ),
  },
  {
    question: "Can I use it discreetly in public?",
    answer: (
      <div className="space-y-2 leading-relaxed">
        <p>
          <strong className="text-secondary">🔇 YES! Silent Mode lets you use it anywhere.</strong>
        </p>
        <p>Unlike other voice AI apps, My Coach Pilot offers Silent Mode:</p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>
            <strong>Mute bot voice</strong> - no audio output, bot stays silent
          </li>
          <li>
            <strong>Read text responses</strong> - AI answers appear as text in real-time
          </li>
          <li>
            <strong>Perfect for public places</strong> - metro, office, café, library
          </li>
          <li>
            <strong>No one knows you&apos;re using AI</strong> - completely discreet
          </li>
        </ul>
        <p className="text-sm opacity-75">
          Other AI apps force you to hear the bot speak. We let you choose: voice or silent text mode.
        </p>
      </div>
    ),
  },
  {
    question: "Can I customize the AI behavior?",
    answer: (
      <div className="space-y-2 leading-relaxed">
        <p>Yes! Extensive customization options:</p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>
            <strong>Select from 7 templates</strong> - pre-configured for different scenarios
          </li>
          <li>
            <strong>Create custom templates</strong> - unlimited, fully customizable
          </li>
          <li>
            <strong>Add custom instructions</strong> - additional context for any template
          </li>
          <li>
            <strong>Adjust AI behavior</strong> - response style, tone, technical depth
          </li>
          <li>
            <strong>Save & switch</strong> - easily swap between different templates
          </li>
        </ul>
        <p className="text-sm opacity-75">
          Perfect for adapting to any workflow or specific requirements.
        </p>
      </div>
    ),
  },
  {
    question: "I have another question",
    answer: (
      <div className="space-y-2 leading-relaxed">
        <p>
          We&apos;re here to help! Contact us at{" "}
          <strong>support@mycoachpilot.com</strong>
        </p>
        <p>
          Or check out the open source version on GitHub for technical details
          and community support.
        </p>
      </div>
    ),
  },
];

const FaqItem = ({ item }: { item: FAQItemProps }) => {
  const accordion = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <li>
      <button
        className="relative flex gap-2 items-center w-full py-5 text-base font-semibold text-left border-t md:text-lg border-base-content/10"
        onClick={(e) => {
          e.preventDefault();
          setIsOpen(!isOpen);
        }}
        aria-expanded={isOpen}
      >
        <span
          className={`flex-1 text-base-content ${isOpen ? "text-primary" : ""}`}
        >
          {item?.question}
        </span>
        <svg
          className={`flex-shrink-0 w-4 h-4 ml-auto fill-current`}
          viewBox="0 0 16 16"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            y="7"
            width="16"
            height="2"
            rx="1"
            className={`transform origin-center transition duration-200 ease-out ${
              isOpen && "rotate-180"
            }`}
          />
          <rect
            y="7"
            width="16"
            height="2"
            rx="1"
            className={`transform origin-center rotate-90 transition duration-200 ease-out ${
              isOpen && "rotate-180 hidden"
            }`}
          />
        </svg>
      </button>

      <div
        ref={accordion}
        className={`transition-all duration-300 ease-in-out opacity-80 overflow-hidden`}
        style={
          isOpen
            ? { maxHeight: accordion?.current?.scrollHeight, opacity: 1 }
            : { maxHeight: 0, opacity: 0 }
        }
      >
        <div className="pb-5 leading-relaxed">{item?.answer}</div>
      </div>
    </li>
  );
};

const FAQ = () => {
  return (
    <section className="bg-base-200" id="faq">
      <div className="py-24 px-8 max-w-7xl mx-auto flex flex-col md:flex-row gap-12">
        <div className="flex flex-col text-left basis-1/2">
          <p className="inline-block font-semibold text-primary mb-4">FAQ</p>
          <p className="sm:text-4xl text-3xl font-extrabold text-base-content">
            Frequently Asked Questions
          </p>
        </div>

        <ul className="basis-1/2">
          {faqList.map((item, i) => (
            <FaqItem key={i} item={item} />
          ))}
        </ul>
      </div>
    </section>
  );
};

export default FAQ;
