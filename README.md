# MyCoachPilot Free

A real-time AI-powered meeting coach that provides live transcription, speaker identification, and contextual coaching suggestions to help you become more effective in meetings and conversations.

## Features

### Three Session Modes

- **Meeting Coach Mode** - Transcribe yourself and others while receiving live AI coaching suggestions. Supports dual audio input (your microphone + system/meeting audio) for capturing both sides of any conversation.

- **Conversation Mode** - Have interactive voice conversations with an AI coach. Full two-way audio using OpenAI's Realtime API with system audio capture support.

- **Transcript-Only Mode** - Pure real-time transcription without coaching, useful for note-taking and accessibility.

### Core Capabilities

- **Live Transcription** - Real-time speech-to-text powered by OpenAI Realtime API
- **Speaker Identification** - Automatic tracking and labeling of different speakers
- **AI Coaching Suggestions** - Context-aware coaching tips based on your conversation
- **Audio Source Flexibility** - Capture from microphone, system audio, or mixed sources
- **Session History** - Persistent storage and review of all past sessions
- **Customizable Coaching** - Choose from different coaching styles (diplomatic, assertive, analytical, supportive) or create custom prompts

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- OpenAI API key with Realtime API access
- For mixed audio capture on macOS: [BlackHole](https://existential.audio/blackhole/) or similar virtual audio device

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/mycoachpilotfree.git
cd mycoachpilotfree

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:

```env
OPENAI_API_KEY=your-openai-api-key
```

### Running the Application

```bash
# Start development server (runs on http://localhost:13000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### CLI Usage

MyCoachPilot also includes a command-line interface for terminal-based sessions:

```bash
# Start a coaching session
npm run cli session start --mode meeting_coach

# List available audio devices
npm run cli session start --list-devices

# Configure API key
npm run cli config set-key openai <your-api-key>
```

## Configuration

### In-App Settings

Access settings via the gear icon in the header:

- **API Keys** - Configure your OpenAI API key
- **Audio Input** - Select microphone and system audio devices
- **Coaching Style** - Choose your preferred coaching approach
- **Custom Prompts** - Define custom system prompts for personalized coaching
- **Advanced Settings** - Fine-tune VAD sensitivity, suggestion frequency, and more

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key | Yes |

## Architecture

MyCoachPilot follows **Clean Architecture + Hexagonal + DDD** principles with clear layer separation:

```
src/
├── domain/           # Pure business logic (entities, value objects, events)
├── application/      # Use cases, ports (interfaces), domain services
├── infrastructure/   # Redux store, adapters, repositories
└── presentation/     # React components and hooks
```

### Key Principles

- **Dependency Rule** - Dependencies flow inward only. Domain layer has zero external dependencies.
- **Ports & Adapters** - External services accessed via port interfaces for easy testing and swapping implementations.
- **Result Type** - All fallible operations return `Result<T, E>`, never throw exceptions.
- **Domain Events** - Cross-context communication via EventBus pattern.

### Bounded Contexts

| Context | Responsibility |
|---------|---------------|
| **Session** | Coaching session lifecycle management |
| **Transcript** | Real-time transcription and speaker management |
| **Coaching** | AI-powered suggestion generation |
| **Settings** | User configuration and API keys |

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 13000 |
| `npm run build` | Create production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Auto-fix ESLint issues |
| `npm run typecheck` | TypeScript type checking |
| `npm run test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Generate test coverage report |
| `npm run knip` | Find unused imports/dependencies |
| `npm run jscpd` | Detect code duplication |

## Technology Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **TypeScript** - Type-safe development
- **Redux Toolkit** - State management
- **Tailwind CSS** - Styling
- **Radix UI** - Headless UI components

### External Services
- **OpenAI Realtime API** - Real-time transcription and voice conversations

### Testing & Quality
- **Vitest** - Unit and integration testing
- **ESLint** - Code linting
- **JSCPD** - Code duplication detection
- **Knip** - Unused dependency detection

## Browser Compatibility

MyCoachPilot requires a modern browser with support for:

- Web Audio API
- MediaDevices API
- `getDisplayMedia` (for tab/system audio capture)
- WebSocket

Tested on Chrome 90+, Firefox 90+, and Safari 15+.

## Contributing

Contributions are welcome! Please read the contribution guidelines before submitting a pull request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [OpenAI](https://openai.com) for the Realtime API
- [Radix UI](https://radix-ui.com) for accessible component primitives
- [Tailwind CSS](https://tailwindcss.com) for utility-first styling
