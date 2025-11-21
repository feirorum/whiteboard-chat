import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../src/store';

describe('Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useStore.setState({
      currentApproach: 'marker-mode',
      diagram: { code: '', svg: '', elements: [] },
      messages: [],
      isLoading: false,
      llmConfig: {
        provider: 'ollama',
        model: 'llama3.2-vision',
        baseUrl: 'http://localhost:11434',
        apiKey: '',
      },
      currentExample: null,
      markerState: { markedElements: new Set() },
      annotationState: { annotations: [], currentTool: null, currentColor: '#e94560' },
      diffState: { currentCode: '', proposedCode: '', changes: [], acceptedChanges: new Set() },
      ghostState: { ghosts: [] },
      timelineState: {
        versions: [],
        currentVersionId: '',
        branches: [{ id: 'main', name: 'main', versionIds: [] }],
        currentBranchId: 'main',
      },
    });
  });

  describe('Approach Selection', () => {
    it('should change current approach', () => {
      const { setCurrentApproach } = useStore.getState();

      setCurrentApproach('annotation-layer');

      expect(useStore.getState().currentApproach).toBe('annotation-layer');
    });

    it('should support all five approaches', () => {
      const { setCurrentApproach } = useStore.getState();
      const approaches = [
        'marker-mode',
        'annotation-layer',
        'diff-preview',
        'ghost-suggestions',
        'version-timeline',
      ] as const;

      approaches.forEach((approach) => {
        setCurrentApproach(approach);
        expect(useStore.getState().currentApproach).toBe(approach);
      });
    });
  });

  describe('Diagram State', () => {
    it('should set diagram code', () => {
      const { setDiagramCode } = useStore.getState();

      setDiagramCode('flowchart TB\n  A --> B');

      expect(useStore.getState().diagram.code).toBe('flowchart TB\n  A --> B');
    });

    it('should set diagram SVG', () => {
      const { setDiagramSvg } = useStore.getState();

      setDiagramSvg('<svg>test</svg>');

      expect(useStore.getState().diagram.svg).toBe('<svg>test</svg>');
    });
  });

  describe('Chat Messages', () => {
    it('should add user message', () => {
      const { addMessage } = useStore.getState();

      addMessage({ role: 'user', content: 'Add a cache layer' });

      const messages = useStore.getState().messages;
      expect(messages).toHaveLength(1);
      expect(messages[0].role).toBe('user');
      expect(messages[0].content).toBe('Add a cache layer');
      expect(messages[0].id).toBeDefined();
      expect(messages[0].timestamp).toBeDefined();
    });

    it('should add assistant message', () => {
      const { addMessage } = useStore.getState();

      addMessage({ role: 'assistant', content: 'Here is the updated diagram...' });

      const messages = useStore.getState().messages;
      expect(messages[0].role).toBe('assistant');
    });

    it('should clear messages', () => {
      const { addMessage, clearMessages } = useStore.getState();

      addMessage({ role: 'user', content: 'Test' });
      addMessage({ role: 'assistant', content: 'Response' });
      clearMessages();

      expect(useStore.getState().messages).toHaveLength(0);
    });

    it('should set loading state', () => {
      const { setLoading } = useStore.getState();

      setLoading(true);
      expect(useStore.getState().isLoading).toBe(true);

      setLoading(false);
      expect(useStore.getState().isLoading).toBe(false);
    });
  });

  describe('LLM Configuration', () => {
    it('should update LLM config', () => {
      const { setLLMConfig } = useStore.getState();

      setLLMConfig({ provider: 'openrouter', model: 'gpt-4o' });

      const config = useStore.getState().llmConfig;
      expect(config.provider).toBe('openrouter');
      expect(config.model).toBe('gpt-4o');
    });

    it('should preserve other config values when updating', () => {
      const { setLLMConfig } = useStore.getState();

      setLLMConfig({ apiKey: 'test-key' });

      const config = useStore.getState().llmConfig;
      expect(config.provider).toBe('ollama'); // Preserved
      expect(config.apiKey).toBe('test-key');
    });
  });

  describe('Marker Mode State', () => {
    it('should toggle marked element', () => {
      const { toggleMarkedElement } = useStore.getState();

      toggleMarkedElement('node1');
      expect(useStore.getState().markerState.markedElements.has('node1')).toBe(true);

      toggleMarkedElement('node1');
      expect(useStore.getState().markerState.markedElements.has('node1')).toBe(false);
    });

    it('should mark multiple elements', () => {
      const { toggleMarkedElement } = useStore.getState();

      toggleMarkedElement('node1');
      toggleMarkedElement('node2');
      toggleMarkedElement('node3');

      const marked = useStore.getState().markerState.markedElements;
      expect(marked.size).toBe(3);
      expect(marked.has('node1')).toBe(true);
      expect(marked.has('node2')).toBe(true);
      expect(marked.has('node3')).toBe(true);
    });

    it('should clear marked elements', () => {
      const { toggleMarkedElement, clearMarkedElements } = useStore.getState();

      toggleMarkedElement('node1');
      toggleMarkedElement('node2');
      clearMarkedElements();

      expect(useStore.getState().markerState.markedElements.size).toBe(0);
    });
  });

  describe('Annotation State', () => {
    it('should add annotation', () => {
      const { addAnnotation } = useStore.getState();

      addAnnotation({
        type: 'circle',
        points: [{ x: 100, y: 100 }, { x: 150, y: 150 }],
        color: '#e94560',
      });

      const annotations = useStore.getState().annotationState.annotations;
      expect(annotations).toHaveLength(1);
      expect(annotations[0].type).toBe('circle');
      expect(annotations[0].id).toBeDefined();
    });

    it('should set annotation tool', () => {
      const { setAnnotationTool } = useStore.getState();

      setAnnotationTool('arrow');
      expect(useStore.getState().annotationState.currentTool).toBe('arrow');

      setAnnotationTool(null);
      expect(useStore.getState().annotationState.currentTool).toBe(null);
    });

    it('should set annotation color', () => {
      const { setAnnotationColor } = useStore.getState();

      setAnnotationColor('#4ecca3');
      expect(useStore.getState().annotationState.currentColor).toBe('#4ecca3');
    });

    it('should clear annotations', () => {
      const { addAnnotation, clearAnnotations } = useStore.getState();

      addAnnotation({ type: 'circle', points: [], color: '#fff' });
      addAnnotation({ type: 'arrow', points: [], color: '#fff' });
      clearAnnotations();

      expect(useStore.getState().annotationState.annotations).toHaveLength(0);
    });
  });

  describe('Diff State', () => {
    it('should set proposed code', () => {
      const { setDiagramCode, setProposedCode } = useStore.getState();

      setDiagramCode('flowchart TB\n  A --> B');
      setProposedCode('flowchart TB\n  A --> B --> C');

      const diff = useStore.getState().diffState;
      expect(diff.currentCode).toBe('flowchart TB\n  A --> B');
      expect(diff.proposedCode).toBe('flowchart TB\n  A --> B --> C');
    });

    it('should clear diff', () => {
      const { setProposedCode, clearDiff } = useStore.getState();

      setProposedCode('flowchart TB\n  A --> B');
      clearDiff();

      const diff = useStore.getState().diffState;
      expect(diff.proposedCode).toBe('');
      expect(diff.currentCode).toBe('');
    });
  });

  describe('Ghost Suggestions State', () => {
    it('should add ghost', () => {
      const { addGhost } = useStore.getState();

      addGhost({
        mermaidCode: 'Cache[(Redis)]',
        description: 'Add caching layer',
      });

      const ghosts = useStore.getState().ghostState.ghosts;
      expect(ghosts).toHaveLength(1);
      expect(ghosts[0].description).toBe('Add caching layer');
      expect(ghosts[0].id).toBeDefined();
    });

    it('should dismiss ghost', () => {
      const { addGhost, dismissGhost } = useStore.getState();

      addGhost({ mermaidCode: 'A', description: 'Ghost 1' });
      const ghostId = useStore.getState().ghostState.ghosts[0].id;

      dismissGhost(ghostId);

      expect(useStore.getState().ghostState.ghosts).toHaveLength(0);
    });

    it('should clear all ghosts', () => {
      const { addGhost, clearGhosts } = useStore.getState();

      addGhost({ mermaidCode: 'A', description: 'Ghost 1' });
      addGhost({ mermaidCode: 'B', description: 'Ghost 2' });
      clearGhosts();

      expect(useStore.getState().ghostState.ghosts).toHaveLength(0);
    });
  });

  describe('Version Timeline State', () => {
    it('should add version', () => {
      const { addVersion } = useStore.getState();

      addVersion('flowchart TB\n  A --> B', 'Initial diagram');

      const timeline = useStore.getState().timelineState;
      expect(timeline.versions).toHaveLength(1);
      expect(timeline.versions[0].code).toBe('flowchart TB\n  A --> B');
      expect(timeline.versions[0].description).toBe('Initial diagram');
      expect(timeline.currentVersionId).toBe(timeline.versions[0].id);
    });

    it('should track version parent', () => {
      const { addVersion } = useStore.getState();

      addVersion('flowchart TB\n  A', 'Version 1');
      const v1Id = useStore.getState().timelineState.currentVersionId;

      addVersion('flowchart TB\n  A --> B', 'Version 2');
      const v2 = useStore.getState().timelineState.versions[1];

      expect(v2.parentId).toBe(v1Id);
    });

    it('should go to version', () => {
      const { addVersion, goToVersion, setDiagramCode } = useStore.getState();

      addVersion('flowchart TB\n  A', 'v1');
      const v1Id = useStore.getState().timelineState.currentVersionId;

      addVersion('flowchart TB\n  A --> B', 'v2');

      goToVersion(v1Id);

      expect(useStore.getState().timelineState.currentVersionId).toBe(v1Id);
      expect(useStore.getState().diagram.code).toBe('flowchart TB\n  A');
    });

    it('should create branch', () => {
      const { addVersion, createBranch } = useStore.getState();

      addVersion('flowchart TB\n  A', 'v1');
      createBranch('feature-branch');

      const timeline = useStore.getState().timelineState;
      expect(timeline.branches).toHaveLength(2);
      expect(timeline.currentBranchId).not.toBe('main');
      expect(timeline.branches.find(b => b.name === 'feature-branch')).toBeDefined();
    });
  });
});
