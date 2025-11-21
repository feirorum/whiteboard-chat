// Core types for the whiteboard-chat application

export type ApproachType =
  | 'marker-mode'
  | 'annotation-layer'
  | 'diff-preview'
  | 'ghost-suggestions'
  | 'version-timeline';

export interface ApproachInfo {
  id: ApproachType;
  name: string;
  description: string;
  icon: string;
}

// Chat types
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  imageBase64?: string;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
}

// Diagram types
export interface DiagramElement {
  id: string;
  type: 'node' | 'edge' | 'subgraph';
  label: string;
  bounds?: DOMRect;
}

export interface DiagramState {
  code: string;
  svg: string;
  elements: DiagramElement[];
}

// LLM Provider types
export type LLMProviderType = 'ollama' | 'openrouter';

export interface LLMConfig {
  provider: LLMProviderType;
  model: string;
  baseUrl?: string;
  apiKey?: string;
}

export interface LLMProvider {
  name: string;
  supportsVision: boolean;
  chat(messages: Message[], config: LLMConfig): Promise<string>;
  chatWithImage(messages: Message[], imageBase64: string, config: LLMConfig): Promise<string>;
}

// Approach-specific state types
export interface MarkerState {
  markedElements: Set<string>;
}

export interface Annotation {
  id: string;
  type: 'circle' | 'arrow' | 'text' | 'strikethrough' | 'freehand';
  points: { x: number; y: number }[];
  color: string;
  text?: string;
}

export interface AnnotationState {
  annotations: Annotation[];
  currentTool: Annotation['type'] | null;
  currentColor: string;
}

export interface DiffChange {
  id: string;
  type: 'add' | 'remove' | 'modify';
  elementId?: string;
  description: string;
}

export interface DiffState {
  currentCode: string;
  proposedCode: string;
  changes: DiffChange[];
  acceptedChanges: Set<string>;
}

export interface GhostElement {
  id: string;
  mermaidCode: string;
  description: string;
  position?: { x: number; y: number };
}

export interface GhostState {
  ghosts: GhostElement[];
}

export interface DiagramVersion {
  id: string;
  code: string;
  description: string;
  timestamp: number;
  parentId?: string;
}

export interface Branch {
  id: string;
  name: string;
  versionIds: string[];
}

export interface TimelineState {
  versions: DiagramVersion[];
  currentVersionId: string;
  branches: Branch[];
  currentBranchId: string;
}

// Example scenario types
export interface ExampleScenario {
  id: string;
  name: string;
  description: string;
  initialDiagram: string;
  suggestedPrompts: string[];
  expectedEvolution: string[];
}
