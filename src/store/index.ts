import { create } from 'zustand';
import type {
  ApproachType,
  Message,
  DiagramState,
  LLMConfig,
  MarkerState,
  AnnotationState,
  DiffState,
  GhostState,
  TimelineState,
  ExampleScenario,
  DiagramVersion,
  Annotation,
  GhostElement,
} from '../types';

interface AppState {
  // Current approach
  currentApproach: ApproachType;
  setCurrentApproach: (approach: ApproachType) => void;

  // Diagram state
  diagram: DiagramState;
  setDiagramCode: (code: string) => void;
  setDiagramSvg: (svg: string) => void;

  // Chat state
  messages: Message[];
  isLoading: boolean;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;

  // LLM config
  llmConfig: LLMConfig;
  setLLMConfig: (config: Partial<LLMConfig>) => void;

  // Example scenario
  currentExample: ExampleScenario | null;
  setCurrentExample: (example: ExampleScenario | null) => void;

  // Approach-specific state
  markerState: MarkerState;
  toggleMarkedElement: (elementId: string) => void;
  clearMarkedElements: () => void;

  annotationState: AnnotationState;
  addAnnotation: (annotation: Omit<Annotation, 'id'>) => void;
  clearAnnotations: () => void;
  setAnnotationTool: (tool: Annotation['type'] | null) => void;
  setAnnotationColor: (color: string) => void;

  diffState: DiffState;
  setProposedCode: (code: string) => void;
  acceptChange: (changeId: string) => void;
  rejectChange: (changeId: string) => void;
  applyAcceptedChanges: () => void;
  clearDiff: () => void;

  ghostState: GhostState;
  addGhost: (ghost: Omit<GhostElement, 'id'>) => void;
  acceptGhost: (ghostId: string) => void;
  dismissGhost: (ghostId: string) => void;
  clearGhosts: () => void;

  timelineState: TimelineState;
  addVersion: (code: string, description: string) => void;
  goToVersion: (versionId: string) => void;
  createBranch: (name: string) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useStore = create<AppState>((set, get) => ({
  // Current approach
  currentApproach: 'marker-mode',
  setCurrentApproach: (approach) => set({ currentApproach: approach }),

  // Diagram state
  diagram: {
    code: '',
    svg: '',
    elements: [],
  },
  setDiagramCode: (code) =>
    set((state) => ({ diagram: { ...state.diagram, code } })),
  setDiagramSvg: (svg) =>
    set((state) => ({ diagram: { ...state.diagram, svg } })),

  // Chat state
  messages: [],
  isLoading: false,
  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        { ...message, id: generateId(), timestamp: Date.now() },
      ],
    })),
  setLoading: (loading) => set({ isLoading: loading }),
  clearMessages: () => set({ messages: [] }),

  // LLM config
  llmConfig: {
    provider: 'ollama',
    model: 'llama3.2-vision',
    baseUrl: 'http://localhost:11434',
    apiKey: '',
  },
  setLLMConfig: (config) =>
    set((state) => ({ llmConfig: { ...state.llmConfig, ...config } })),

  // Example scenario
  currentExample: null,
  setCurrentExample: (example) => {
    set({ currentExample: example });
    if (example) {
      get().setDiagramCode(example.initialDiagram);
      get().clearMessages();
      // Reset all approach states
      get().clearMarkedElements();
      get().clearAnnotations();
      get().clearDiff();
      get().clearGhosts();
      // Initialize timeline with first version
      const versionId = generateId();
      set({
        timelineState: {
          versions: [
            {
              id: versionId,
              code: example.initialDiagram,
              description: 'Initial diagram',
              timestamp: Date.now(),
            },
          ],
          currentVersionId: versionId,
          branches: [{ id: 'main', name: 'main', versionIds: [versionId] }],
          currentBranchId: 'main',
        },
      });
    }
  },

  // Marker state
  markerState: { markedElements: new Map(), nextIndex: 0 },
  toggleMarkedElement: (elementId) =>
    set((state) => {
      const newMarked = new Map(state.markerState.markedElements);
      if (newMarked.has(elementId)) {
        newMarked.delete(elementId);
        return { markerState: { ...state.markerState, markedElements: newMarked } };
      } else {
        newMarked.set(elementId, state.markerState.nextIndex);
        return {
          markerState: {
            markedElements: newMarked,
            nextIndex: state.markerState.nextIndex + 1,
          },
        };
      }
    }),
  clearMarkedElements: () =>
    set({ markerState: { markedElements: new Map(), nextIndex: 0 } }),

  // Annotation state
  annotationState: {
    annotations: [],
    currentTool: null,
    currentColor: '#e94560',
  },
  addAnnotation: (annotation) =>
    set((state) => ({
      annotationState: {
        ...state.annotationState,
        annotations: [
          ...state.annotationState.annotations,
          { ...annotation, id: generateId() },
        ],
      },
    })),
  clearAnnotations: () =>
    set((state) => ({
      annotationState: { ...state.annotationState, annotations: [] },
    })),
  setAnnotationTool: (tool) =>
    set((state) => ({
      annotationState: { ...state.annotationState, currentTool: tool },
    })),
  setAnnotationColor: (color) =>
    set((state) => ({
      annotationState: { ...state.annotationState, currentColor: color },
    })),

  // Diff state
  diffState: {
    currentCode: '',
    proposedCode: '',
    changes: [],
    acceptedChanges: new Set(),
  },
  setProposedCode: (code) =>
    set((state) => ({
      diffState: {
        ...state.diffState,
        proposedCode: code,
        currentCode: state.diagram.code,
      },
    })),
  acceptChange: (changeId) =>
    set((state) => {
      const newAccepted = new Set(state.diffState.acceptedChanges);
      newAccepted.add(changeId);
      return { diffState: { ...state.diffState, acceptedChanges: newAccepted } };
    }),
  rejectChange: (changeId) =>
    set((state) => {
      const newAccepted = new Set(state.diffState.acceptedChanges);
      newAccepted.delete(changeId);
      return { diffState: { ...state.diffState, acceptedChanges: newAccepted } };
    }),
  applyAcceptedChanges: () => {
    const { diffState } = get();
    // For simplicity, if any changes are accepted, apply the proposed code
    if (diffState.acceptedChanges.size > 0) {
      get().setDiagramCode(diffState.proposedCode);
    }
    get().clearDiff();
  },
  clearDiff: () =>
    set({
      diffState: {
        currentCode: '',
        proposedCode: '',
        changes: [],
        acceptedChanges: new Set(),
      },
    }),

  // Ghost state
  ghostState: { ghosts: [] },
  addGhost: (ghost) =>
    set((state) => ({
      ghostState: {
        ghosts: [...state.ghostState.ghosts, { ...ghost, id: generateId() }],
      },
    })),
  acceptGhost: (ghostId) => {
    const { ghostState, diagram } = get();
    const ghost = ghostState.ghosts.find((g) => g.id === ghostId);
    if (ghost) {
      // Merge ghost mermaid code into main diagram
      get().setDiagramCode(diagram.code + '\n' + ghost.mermaidCode);
      get().dismissGhost(ghostId);
    }
  },
  dismissGhost: (ghostId) =>
    set((state) => ({
      ghostState: {
        ghosts: state.ghostState.ghosts.filter((g) => g.id !== ghostId),
      },
    })),
  clearGhosts: () => set({ ghostState: { ghosts: [] } }),

  // Timeline state
  timelineState: {
    versions: [],
    currentVersionId: '',
    branches: [{ id: 'main', name: 'main', versionIds: [] }],
    currentBranchId: 'main',
  },
  addVersion: (code, description) => {
    const versionId = generateId();
    const { timelineState } = get();
    const newVersion: DiagramVersion = {
      id: versionId,
      code,
      description,
      timestamp: Date.now(),
      parentId: timelineState.currentVersionId || undefined,
    };

    set((state) => {
      const currentBranch = state.timelineState.branches.find(
        (b) => b.id === state.timelineState.currentBranchId
      );
      const updatedBranches = state.timelineState.branches.map((b) =>
        b.id === state.timelineState.currentBranchId
          ? { ...b, versionIds: [...b.versionIds, versionId] }
          : b
      );

      return {
        timelineState: {
          ...state.timelineState,
          versions: [...state.timelineState.versions, newVersion],
          currentVersionId: versionId,
          branches: updatedBranches,
        },
      };
    });

    get().setDiagramCode(code);
  },
  goToVersion: (versionId) => {
    const { timelineState } = get();
    const version = timelineState.versions.find((v) => v.id === versionId);
    if (version) {
      set((state) => ({
        timelineState: { ...state.timelineState, currentVersionId: versionId },
      }));
      get().setDiagramCode(version.code);
    }
  },
  createBranch: (name) => {
    const branchId = generateId();
    const { timelineState } = get();
    set((state) => ({
      timelineState: {
        ...state.timelineState,
        branches: [
          ...state.timelineState.branches,
          { id: branchId, name, versionIds: [state.timelineState.currentVersionId] },
        ],
        currentBranchId: branchId,
      },
    }));
  },
}));
