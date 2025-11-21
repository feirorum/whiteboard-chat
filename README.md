# Whiteboard Chat

Agent-Assisted Diagram Evolution - Exploring different UX approaches for collaboratively evolving system design diagrams with AI agents.

## Overview

Humans often discuss and whiteboard together when designing systems. This project explores how we can replicate this collaborative experience with AI agents, combining visual diagrams (Mermaid) with natural language chat.

## Features

- **5 Different UX Approaches** for diagram collaboration
- **Mermaid Diagram Rendering** with interactive elements
- **LLM Integration** supporting both Ollama (local) and OpenRouter (cloud)
- **5 Example Scenarios** with suggested prompts
- **Vision-enabled** - diagrams can be sent as images to the LLM

## Approaches

### 1. Marker Mode
Click on diagram elements to mark them, then describe changes in chat. The LLM receives both the marked image and your instructions.

### 2. Annotation Layer
Draw directly over the diagram - circles, arrows, strikethroughs, text notes. These annotations are captured and sent to the LLM for interpretation.

### 3. Diff Preview
Describe changes in natural language. The LLM proposes changes shown as a visual diff (current vs proposed). Accept or reject before applying.

### 4. Ghost Suggestions
As you chat, the LLM suggests diagram additions that appear as semi-transparent "ghost" elements. Accept to merge into the main diagram or dismiss.

### 5. Version Timeline
Every change creates a version. Scrub through history, compare versions side-by-side, and create branches to explore alternative designs.

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test
```

## LLM Configuration

### Ollama (Local)
1. Install [Ollama](https://ollama.ai)
2. Pull a vision model: `ollama pull llama3.2-vision`
3. Select "Ollama" in the settings panel

### OpenRouter (Cloud)
1. Get an API key from [OpenRouter](https://openrouter.ai)
2. Select "OpenRouter" in settings
3. Enter your API key
4. Choose a vision-capable model (Claude 3.5, GPT-4V, etc.)

## Example Scenarios

1. **E-Commerce System** - Evolve from basic client-server to microservices with caching
2. **Authentication Flow** - Add OAuth, MFA, session management
3. **Data Pipeline** - Add validation, error handling, monitoring
4. **Chatbot Architecture** - Add RAG, tool use, conversation memory
5. **Microservices Migration** - Plan monolith decomposition

## Tech Stack

- React 18 + TypeScript
- Vite for build tooling
- Zustand for state management
- Mermaid for diagram rendering
- html-to-image for diagram capture
- Vitest for testing

## Project Structure

```
src/
├── approaches/          # 5 UX approach implementations
│   ├── MarkerMode/
│   ├── AnnotationLayer/
│   ├── DiffPreview/
│   ├── GhostSuggestions/
│   └── VersionTimeline/
├── components/          # Shared UI components
├── providers/           # LLM provider implementations
├── examples/            # Example scenarios
├── store/              # Zustand state management
├── types/              # TypeScript types
└── App.tsx             # Main application

tests/
├── approaches/         # Approach-specific tests
├── integration/        # Full flow tests
├── store.test.ts       # State management tests
├── providers.test.ts   # LLM provider tests
└── examples.test.ts    # Example scenario tests
```

## Testing

```bash
# Run all tests
npm test

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage
```

## License

MIT
