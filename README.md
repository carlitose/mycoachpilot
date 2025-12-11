# Copilot Realtime Interview

An AI-powered real-time voice coaching assistant built with Next.js and OpenAI's Realtime API. This application enables ultra-low latency voice conversations using WebRTC technology.

## Hosted Version

Don't have an OpenAI API key? You can use the fully hosted version at [mycoachpilot.com](https://mycoachpilot.com) - no API key required, just sign up and start using the AI coaching assistant immediately.

## Features

- **Real-time Voice Conversations**: Leverage OpenAI's Realtime API for instant voice interactions
- **WebRTC Integration**: Ultra-low latency audio streaming for seamless conversations
- **Tab Audio Capture**: Capture and process audio from browser tabs
- **Screen Capture & Analysis**: Take screenshots and have the AI analyze them
- **File Upload Support**: Upload images and PDFs for AI analysis
- **Custom Templates**: Create and manage custom AI instruction templates
- **Transcript Mode**: Option to use transcription-only mode without AI responses
- **Conversation Export**: Save conversations as JSON files
- **Onboarding Tour**: Guided introduction for new users

## Tech Stack

- **Framework**: Next.js 15.1 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + DaisyUI
- **AI Integration**: OpenAI Realtime API (`@openai/agents-realtime`)
- **UI Components**: Radix UI, Lucide Icons, Headless UI
- **State Management**: React Hooks

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- OpenAI API Key with Realtime API access

### Installation

1. Clone the repository and navigate to the copilot directory:

```bash
cd copilot
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:13000`.

### Configuration

1. Launch the application and navigate to **AI Settings**
2. Enter your OpenAI API Key
3. Select a template or create a custom one
4. Optionally add custom instructions

## Project Structure

```
copilot/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── realtime/      # Realtime token endpoint
│   │   └── crawler-monitor/
│   ├── app/               # Main application pages
│   │   ├── page.tsx       # Main AI interface
│   │   └── settings/      # Settings pages
│   └── dashboard/         # Dashboard pages
├── components/
│   ├── ai-app/            # AI interface components
│   │   ├── ChatGPTInterface.tsx
│   │   ├── ControlBar.tsx
│   │   ├── MessageList.tsx
│   │   ├── MessageInput.tsx
│   │   └── settings/      # Settings components
│   └── ui/                # Reusable UI components
├── hooks/
│   └── ai-hooks/          # AI-specific hooks
│       ├── useSession.ts  # Main session management
│       ├── useFileUpload.ts
│       ├── useScreenCapture.ts
│       └── useTabAudioCapture.ts
├── lib/                   # Utility functions and configs
└── types/                 # TypeScript type definitions
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 13000 |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |

## Usage Modes

### Conversation Mode
Full bidirectional voice conversation with the AI. The AI will listen to your voice and respond in real-time.

### Transcript Only Mode
The AI only transcribes your speech without providing responses. Useful for note-taking or documentation purposes.

## Key Components

### useSession Hook
Manages the entire realtime session lifecycle including:
- Session creation and teardown
- WebRTC connection management
- Message state management
- Inactivity timeout handling

### ChatGPTInterface
The main UI component that orchestrates:
- Voice session controls
- Message display
- File and screen capture integration
- Tab audio capture

## Browser Compatibility

- **Chrome/Edge**: Full support including tab audio capture
- **Firefox**: Supported (tab audio capture may have limitations)
- **Safari**: WebRTC supported, some features may vary

## License

This project is private and proprietary.
