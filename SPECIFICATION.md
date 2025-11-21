# Whiteboard Chat: Agent-Assisted Diagram Evolution

## Overview

This project explores different UX approaches for collaboratively evolving system design diagrams with AI agents. The core premise is that humans often discuss and whiteboard together - how can we replicate this experience with AI agents?

## Core Concepts

### Visual + Text Communication
- Mermaid diagrams as the visual medium (easily editable, text-based source)
- Chat interface for natural language discussion
- Image capture of diagram state for LLM vision input
- Bidirectional updates: text descriptions inform diagrams, diagram changes inform discussion

### LLM Backend Support
- **Ollama**: Local inference for privacy and offline use
- **OpenRouter**: Cloud-based access to multiple models (GPT-4V, Claude, etc.)

---

## Approach 1: "Marker Mode" - Click-to-Mark Elements

### Concept
User clicks on diagram elements to mark them for change. Marked elements are highlighted. User types instruction about desired changes. Screenshot with highlights + text sent to LLM.

### UX Flow
1. User views current diagram
2. Clicks on nodes/edges to mark them (they get highlighted)
3. Types instruction: "Make the marked service async and add a message queue"
4. System captures diagram image with highlights
5. LLM receives: marked image + instruction + current Mermaid code
6. LLM responds with: new Mermaid code + explanation
7. User can accept, modify, or reject changes

### Pros
- Very direct - point at what you want to change
- Natural interaction pattern (like pointing on a whiteboard)
- Clear context for LLM

### Cons
- Requires element detection/hit testing
- May be imprecise for complex diagrams

---

## Approach 2: "Annotation Layer" - Draw Over Diagram

### Concept
User can draw annotations over the diagram - circles, arrows, text notes, strikethroughs. These are captured as an overlay and sent with instructions to the LLM.

### UX Flow
1. User views diagram
2. Enters annotation mode (toolbar)
3. Draws: circle around area, arrow pointing somewhere, crosses out element
4. Types instruction referencing annotations
5. Combined image sent to LLM
6. LLM interprets annotations and produces changes

### Pros
- Most whiteboard-like experience
- Can express complex intentions (arrows showing flow changes)
- Supports freeform communication

### Cons
- Requires drawing canvas implementation
- LLM interpretation of drawings may be imprecise
- More cognitive load on user

---

## Approach 3: "Diff Preview" - Propose and Accept

### Concept
User describes change in natural language. LLM proposes changes shown as a visual diff (additions in green, deletions in red). User can accept/reject individual changes.

### UX Flow
1. User types: "Add a cache layer between API and Database"
2. LLM generates new Mermaid code
3. System shows side-by-side or overlay diff:
   - Green: new elements
   - Red: removed elements
   - Yellow: modified elements
4. User can accept all, reject all, or cherry-pick
5. Changes applied on confirmation

### Pros
- Clear visibility of proposed changes
- Granular control over acceptance
- Familiar diff-based workflow for developers

### Cons
- Diff visualization for diagrams is non-trivial
- May break flow for small iterative changes

---

## Approach 4: "Ghost Suggestions" - Ambient Proposals

### Concept
As user types in chat, LLM proactively suggests diagram additions that appear as semi-transparent "ghost" elements. User can drag to accept or dismiss.

### UX Flow
1. User types: "We need to handle authentication..."
2. While typing/after sending, LLM analyzes context
3. Ghost elements appear: faded "Auth Service" node, dotted connection
4. User can:
   - Click ghost to accept (becomes solid)
   - Drag ghost to reposition
   - Dismiss ghost (X button)
5. Continuous refinement as conversation progresses

### Pros
- Non-intrusive suggestions
- Feels collaborative (agent "sketching along")
- Rapid iteration

### Cons
- Complex state management (ghost vs real elements)
- Potential for distraction with too many suggestions
- Requires streaming/real-time updates

---

## Approach 5: "Version Timeline" - Branch and Explore

### Concept
Every change creates a version. User can scrub through timeline, branch off to explore alternatives, compare versions. LLM can suggest "what if" branches.

### UX Flow
1. Initial diagram is Version 1
2. User or LLM makes changes -> Version 2
3. Timeline slider shows history
4. User can:
   - Scrub back to any version
   - Branch from any point ("What if we used microservices instead?")
   - Compare two versions side-by-side
5. LLM can suggest: "Would you like to see an alternative with event sourcing?"
6. Creates parallel branch for comparison

### Pros
- Enables exploration without fear of losing work
- Great for comparing architectural alternatives
- Natural undo/redo

### Cons
- More complex UI
- Storage overhead for versions
- May encourage over-exploration vs. decision-making

---

## Technical Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                        App Shell                             │
│  ┌─────────────┐ ┌──────────────┐ ┌───────────────────────┐ │
│  │  Approach   │ │   Example    │ │    LLM Provider       │ │
│  │  Selector   │ │   Loader     │ │    Selector           │ │
│  └─────────────┘ └──────────────┘ └───────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    Active Approach View                      │
│  ┌────────────────────────┐  ┌────────────────────────────┐ │
│  │                        │  │                            │ │
│  │   Mermaid Renderer     │  │     Chat Interface         │ │
│  │   + Approach-specific  │  │     + Message History      │ │
│  │     Interaction Layer  │  │     + Input                │ │
│  │                        │  │                            │ │
│  └────────────────────────┘  └────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### LLM Provider Interface

```typescript
interface LLMProvider {
  name: string;
  supportsVision: boolean;

  chat(messages: Message[]): Promise<string>;
  chatWithImage(messages: Message[], imageBase64: string): Promise<string>;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}
```

### Mermaid Integration

```typescript
interface DiagramState {
  code: string;           // Mermaid source
  svg: string;            // Rendered SVG
  elements: Element[];    // Parsed elements for interaction
}

interface Element {
  id: string;
  type: 'node' | 'edge' | 'subgraph';
  label: string;
  bounds: DOMRect;
}
```

### Approach-Specific State

```typescript
// Marker Mode
interface MarkerState {
  markedElements: Set<string>;
}

// Annotation Layer
interface AnnotationState {
  annotations: Annotation[];
}

// Diff Preview
interface DiffState {
  currentCode: string;
  proposedCode: string;
  acceptedChanges: Set<string>;
}

// Ghost Suggestions
interface GhostState {
  ghosts: GhostElement[];
}

// Version Timeline
interface TimelineState {
  versions: Version[];
  currentIndex: number;
  branches: Branch[];
}
```

---

## Example Scenarios

### Scenario 1: E-Commerce System Design
Starting diagram: Basic client-server-database
Evolution: Add caching, message queues, microservices

### Scenario 2: Authentication Flow
Starting diagram: Simple login flow
Evolution: Add OAuth, MFA, session management

### Scenario 3: Data Pipeline
Starting diagram: Source -> Process -> Sink
Evolution: Add validation, error handling, monitoring

---

## Testing Strategy

### Unit Tests (No LLM)
- Mermaid rendering
- Element detection/hit testing
- Annotation canvas operations
- Diff calculation
- Version management
- State management for each approach

### Integration Tests (Mock LLM)
- Full flow with mocked LLM responses
- Image capture and transmission
- Response parsing and diagram updates

### Manual Testing
- Actual LLM interaction
- UX evaluation
- Performance testing

---

## File Structure

```
whiteboard-chat/
├── src/
│   ├── components/
│   │   ├── MermaidRenderer.tsx
│   │   ├── ChatInterface.tsx
│   │   ├── ApproachSelector.tsx
│   │   ├── ExampleLoader.tsx
│   │   └── LLMProviderConfig.tsx
│   ├── approaches/
│   │   ├── MarkerMode/
│   │   ├── AnnotationLayer/
│   │   ├── DiffPreview/
│   │   ├── GhostSuggestions/
│   │   └── VersionTimeline/
│   ├── providers/
│   │   ├── llm-provider.ts
│   │   ├── ollama.ts
│   │   └── openrouter.ts
│   ├── examples/
│   │   ├── ecommerce.ts
│   │   ├── auth-flow.ts
│   │   └── data-pipeline.ts
│   ├── hooks/
│   │   ├── useMermaid.ts
│   │   ├── useChat.ts
│   │   └── useLLM.ts
│   ├── utils/
│   │   ├── mermaid-parser.ts
│   │   ├── image-capture.ts
│   │   └── diff-calculator.ts
│   ├── App.tsx
│   └── main.tsx
├── tests/
│   ├── mermaid.test.ts
│   ├── approaches/
│   │   ├── marker-mode.test.ts
│   │   ├── annotation-layer.test.ts
│   │   ├── diff-preview.test.ts
│   │   ├── ghost-suggestions.test.ts
│   │   └── version-timeline.test.ts
│   └── integration/
│       └── full-flow.test.ts
├── package.json
├── vite.config.ts
├── tsconfig.json
└── SPECIFICATION.md
```
