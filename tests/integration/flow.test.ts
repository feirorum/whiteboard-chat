import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useStore } from '../../src/store';
import { allExamples } from '../../src/examples';
import { parseMermaidFromResponse } from '../../src/providers/llm-provider';

describe('Integration: Full Flow', () => {
  beforeEach(() => {
    // Reset all store state
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

  describe('Example Loading', () => {
    it('should load example and set diagram', () => {
      const { setCurrentExample } = useStore.getState();
      const example = allExamples[0]; // E-commerce example

      setCurrentExample(example);

      expect(useStore.getState().diagram.code).toBe(example.initialDiagram);
      expect(useStore.getState().currentExample).toBe(example);
    });

    it('should clear messages when loading new example', () => {
      const { setCurrentExample, addMessage } = useStore.getState();

      addMessage({ role: 'user', content: 'Test message' });
      addMessage({ role: 'assistant', content: 'Response' });

      setCurrentExample(allExamples[0]);

      expect(useStore.getState().messages).toHaveLength(0);
    });

    it('should reset approach states when loading example', () => {
      const { setCurrentExample, toggleMarkedElement, addAnnotation, addGhost } =
        useStore.getState();

      // Add some state
      toggleMarkedElement('node1');
      addAnnotation({ type: 'circle', points: [], color: '#fff' });
      addGhost({ mermaidCode: 'A', description: 'Ghost' });

      // Load example
      setCurrentExample(allExamples[0]);

      // Check states are reset
      expect(useStore.getState().markerState.markedElements.size).toBe(0);
      expect(useStore.getState().annotationState.annotations).toHaveLength(0);
      expect(useStore.getState().ghostState.ghosts).toHaveLength(0);
    });

    it('should initialize timeline with first version', () => {
      const { setCurrentExample } = useStore.getState();
      const example = allExamples[0];

      setCurrentExample(example);

      const timeline = useStore.getState().timelineState;
      expect(timeline.versions).toHaveLength(1);
      expect(timeline.versions[0].code).toBe(example.initialDiagram);
      expect(timeline.versions[0].description).toBe('Initial diagram');
    });
  });

  describe('Approach Switching', () => {
    it('should preserve diagram when switching approaches', () => {
      const { setCurrentExample, setCurrentApproach } = useStore.getState();

      setCurrentExample(allExamples[0]);
      const initialCode = useStore.getState().diagram.code;

      setCurrentApproach('annotation-layer');
      expect(useStore.getState().diagram.code).toBe(initialCode);

      setCurrentApproach('diff-preview');
      expect(useStore.getState().diagram.code).toBe(initialCode);

      setCurrentApproach('ghost-suggestions');
      expect(useStore.getState().diagram.code).toBe(initialCode);

      setCurrentApproach('version-timeline');
      expect(useStore.getState().diagram.code).toBe(initialCode);
    });

    it('should preserve chat history when switching approaches', () => {
      const { setCurrentExample, setCurrentApproach, addMessage } = useStore.getState();

      setCurrentExample(allExamples[0]);
      addMessage({ role: 'user', content: 'Add caching' });
      addMessage({ role: 'assistant', content: 'Here is the updated diagram...' });

      setCurrentApproach('diff-preview');

      expect(useStore.getState().messages).toHaveLength(2);
    });
  });

  describe('LLM Response Processing', () => {
    it('should parse mermaid from typical response', () => {
      const mockResponse = `I've updated the diagram to add a caching layer:

\`\`\`mermaid
flowchart TB
    Client --> API
    API --> Cache
    Cache --> DB
\`\`\`

**Changes made:**
- Added Cache node between API and Database
- Updated connections

**Reasoning:**
Adding a cache improves read performance by reducing database load.`;

      const mermaidCode = parseMermaidFromResponse(mockResponse);

      expect(mermaidCode).toContain('flowchart TB');
      expect(mermaidCode).toContain('Cache');
    });

    it('should handle response without mermaid code', () => {
      const mockResponse = `I understand you want to add caching. Could you specify which type of cache you prefer - Redis, Memcached, or application-level caching?`;

      const mermaidCode = parseMermaidFromResponse(mockResponse);

      expect(mermaidCode).toBeNull();
    });
  });

  describe('Chat Message Flow', () => {
    it('should add user and assistant messages in sequence', () => {
      const { addMessage } = useStore.getState();

      addMessage({ role: 'user', content: 'Add authentication service' });
      addMessage({
        role: 'assistant',
        content: '```mermaid\nflowchart TB\n  Auth[Auth Service]\n```',
      });

      const messages = useStore.getState().messages;
      expect(messages).toHaveLength(2);
      expect(messages[0].role).toBe('user');
      expect(messages[1].role).toBe('assistant');
      expect(messages[1].timestamp).toBeGreaterThanOrEqual(messages[0].timestamp);
    });

    it('should track loading state during chat', () => {
      const { setLoading } = useStore.getState();

      expect(useStore.getState().isLoading).toBe(false);

      setLoading(true);
      expect(useStore.getState().isLoading).toBe(true);

      setLoading(false);
      expect(useStore.getState().isLoading).toBe(false);
    });
  });

  describe('LLM Configuration', () => {
    it('should support switching between providers', () => {
      const { setLLMConfig } = useStore.getState();

      setLLMConfig({ provider: 'openrouter', apiKey: 'test-key' });

      const config = useStore.getState().llmConfig;
      expect(config.provider).toBe('openrouter');
      expect(config.apiKey).toBe('test-key');
    });

    it('should support changing models', () => {
      const { setLLMConfig } = useStore.getState();

      setLLMConfig({ model: 'gpt-4-vision-preview' });

      expect(useStore.getState().llmConfig.model).toBe('gpt-4-vision-preview');
    });
  });

  describe('Full User Flow Simulation', () => {
    it('should simulate marker mode workflow', () => {
      const {
        setCurrentExample,
        setCurrentApproach,
        toggleMarkedElement,
        addMessage,
        setDiagramCode,
      } = useStore.getState();

      // 1. Load example
      setCurrentExample(allExamples[0]);
      setCurrentApproach('marker-mode');

      // 2. Mark elements
      toggleMarkedElement('API');
      toggleMarkedElement('Database');

      // 3. Send message
      addMessage({ role: 'user', content: 'Add caching between these marked elements' });

      // 4. Simulate LLM response
      const newDiagram = `flowchart TB
    Client --> API
    API --> Cache[(Redis)]
    Cache --> DB[(Database)]`;

      addMessage({
        role: 'assistant',
        content: `\`\`\`mermaid\n${newDiagram}\n\`\`\``,
      });

      // 5. Apply new diagram
      setDiagramCode(newDiagram);

      // Verify final state
      expect(useStore.getState().diagram.code).toContain('Cache');
      expect(useStore.getState().messages).toHaveLength(2);
    });

    it('should simulate version timeline workflow', () => {
      const { setCurrentExample, setCurrentApproach, addVersion, goToVersion, createBranch } =
        useStore.getState();

      // 1. Load example
      setCurrentExample(allExamples[0]);
      setCurrentApproach('version-timeline');

      // Initial version created by setCurrentExample
      const v1Id = useStore.getState().timelineState.currentVersionId;

      // 2. Make changes (simulating LLM responses)
      addVersion('flowchart TB\n  A --> B --> C', 'Added node C');
      const v2Id = useStore.getState().timelineState.currentVersionId;

      addVersion('flowchart TB\n  A --> B --> C --> D', 'Added node D');
      const v3Id = useStore.getState().timelineState.currentVersionId;

      // 3. Navigate history
      goToVersion(v1Id);
      expect(useStore.getState().diagram.code).toContain(allExamples[0].initialDiagram);

      // 4. Create branch from v1
      createBranch('alternative-design');

      // 5. Add to branch
      addVersion('flowchart TB\n  A --> X --> Y', 'Alternative path');

      // Verify timeline
      const timeline = useStore.getState().timelineState;
      expect(timeline.versions.length).toBeGreaterThanOrEqual(4);
      expect(timeline.branches).toHaveLength(2);
    });
  });
});
