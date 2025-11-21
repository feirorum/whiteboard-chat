import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../../src/store';

describe('Ghost Suggestions Approach', () => {
  beforeEach(() => {
    useStore.setState({
      currentApproach: 'ghost-suggestions',
      diagram: { code: 'flowchart TB\n  A --> B', svg: '', elements: [] },
      ghostState: { ghosts: [] },
    });
  });

  describe('Adding Ghosts', () => {
    it('should add a ghost suggestion', () => {
      const { addGhost } = useStore.getState();

      addGhost({
        mermaidCode: 'Cache[(Redis Cache)]',
        description: 'Add caching layer for improved performance',
      });

      const ghosts = useStore.getState().ghostState.ghosts;
      expect(ghosts).toHaveLength(1);
      expect(ghosts[0].description).toBe('Add caching layer for improved performance');
    });

    it('should assign unique IDs to ghosts', () => {
      const { addGhost } = useStore.getState();

      addGhost({ mermaidCode: 'A', description: 'Ghost 1' });
      addGhost({ mermaidCode: 'B', description: 'Ghost 2' });
      addGhost({ mermaidCode: 'C', description: 'Ghost 3' });

      const ghosts = useStore.getState().ghostState.ghosts;
      const ids = ghosts.map((g) => g.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(3);
    });

    it('should store mermaid code for each ghost', () => {
      const { addGhost } = useStore.getState();

      addGhost({
        mermaidCode: 'subgraph Cache\n  Redis[(Redis)]\nend',
        description: 'Cache subgraph',
      });

      const ghosts = useStore.getState().ghostState.ghosts;
      expect(ghosts[0].mermaidCode).toContain('Redis');
    });
  });

  describe('Accepting Ghosts', () => {
    it('should accept ghost and merge into diagram', () => {
      const { addGhost, acceptGhost, setDiagramCode } = useStore.getState();

      setDiagramCode('flowchart TB\n  A --> B');
      addGhost({
        mermaidCode: 'B --> C',
        description: 'Add node C',
      });

      const ghostId = useStore.getState().ghostState.ghosts[0].id;
      acceptGhost(ghostId);

      expect(useStore.getState().diagram.code).toContain('A --> B');
      expect(useStore.getState().diagram.code).toContain('B --> C');
    });

    it('should remove ghost after accepting', () => {
      const { addGhost, acceptGhost, setDiagramCode } = useStore.getState();

      setDiagramCode('flowchart TB\n  A');
      addGhost({ mermaidCode: 'B', description: 'Add B' });

      const ghostId = useStore.getState().ghostState.ghosts[0].id;
      acceptGhost(ghostId);

      expect(useStore.getState().ghostState.ghosts).toHaveLength(0);
    });
  });

  describe('Dismissing Ghosts', () => {
    it('should dismiss a specific ghost', () => {
      const { addGhost, dismissGhost } = useStore.getState();

      addGhost({ mermaidCode: 'A', description: 'Ghost 1' });
      addGhost({ mermaidCode: 'B', description: 'Ghost 2' });

      const firstGhostId = useStore.getState().ghostState.ghosts[0].id;
      dismissGhost(firstGhostId);

      const ghosts = useStore.getState().ghostState.ghosts;
      expect(ghosts).toHaveLength(1);
      expect(ghosts[0].description).toBe('Ghost 2');
    });

    it('should not affect diagram when dismissing', () => {
      const { addGhost, dismissGhost, setDiagramCode } = useStore.getState();

      setDiagramCode('flowchart TB\n  A');
      addGhost({ mermaidCode: 'B', description: 'Ghost' });

      const ghostId = useStore.getState().ghostState.ghosts[0].id;
      dismissGhost(ghostId);

      expect(useStore.getState().diagram.code).toBe('flowchart TB\n  A');
    });
  });

  describe('Clearing All Ghosts', () => {
    it('should clear all ghosts at once', () => {
      const { addGhost, clearGhosts } = useStore.getState();

      addGhost({ mermaidCode: 'A', description: 'Ghost 1' });
      addGhost({ mermaidCode: 'B', description: 'Ghost 2' });
      addGhost({ mermaidCode: 'C', description: 'Ghost 3' });

      clearGhosts();

      expect(useStore.getState().ghostState.ghosts).toHaveLength(0);
    });
  });
});
