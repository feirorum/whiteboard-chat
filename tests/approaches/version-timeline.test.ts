import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../../src/store';

describe('Version Timeline Approach', () => {
  beforeEach(() => {
    useStore.setState({
      currentApproach: 'version-timeline',
      diagram: { code: '', svg: '', elements: [] },
      timelineState: {
        versions: [],
        currentVersionId: '',
        branches: [{ id: 'main', name: 'main', versionIds: [] }],
        currentBranchId: 'main',
      },
    });
  });

  describe('Version Creation', () => {
    it('should create initial version', () => {
      const { addVersion } = useStore.getState();

      addVersion('flowchart TB\n  A', 'Initial diagram');

      const timeline = useStore.getState().timelineState;
      expect(timeline.versions).toHaveLength(1);
      expect(timeline.versions[0].description).toBe('Initial diagram');
    });

    it('should update diagram code when adding version', () => {
      const { addVersion } = useStore.getState();

      addVersion('flowchart TB\n  A --> B', 'Added node B');

      expect(useStore.getState().diagram.code).toBe('flowchart TB\n  A --> B');
    });

    it('should set current version to new version', () => {
      const { addVersion } = useStore.getState();

      addVersion('flowchart TB\n  A', 'v1');
      const v1Id = useStore.getState().timelineState.currentVersionId;

      addVersion('flowchart TB\n  A --> B', 'v2');
      const v2Id = useStore.getState().timelineState.currentVersionId;

      expect(v1Id).not.toBe(v2Id);
      expect(v2Id).toBe(useStore.getState().timelineState.versions[1].id);
    });

    it('should track parent version', () => {
      const { addVersion } = useStore.getState();

      addVersion('flowchart TB\n  A', 'v1');
      const v1Id = useStore.getState().timelineState.currentVersionId;

      addVersion('flowchart TB\n  A --> B', 'v2');
      const v2 = useStore.getState().timelineState.versions[1];

      expect(v2.parentId).toBe(v1Id);
    });

    it('should record timestamp for each version', () => {
      const { addVersion } = useStore.getState();
      const before = Date.now();

      addVersion('flowchart TB\n  A', 'v1');

      const after = Date.now();
      const timestamp = useStore.getState().timelineState.versions[0].timestamp;

      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('Version Navigation', () => {
    it('should go to specific version', () => {
      const { addVersion, goToVersion } = useStore.getState();

      addVersion('flowchart TB\n  A', 'v1');
      const v1Id = useStore.getState().timelineState.currentVersionId;

      addVersion('flowchart TB\n  A --> B', 'v2');
      addVersion('flowchart TB\n  A --> B --> C', 'v3');

      goToVersion(v1Id);

      expect(useStore.getState().timelineState.currentVersionId).toBe(v1Id);
      expect(useStore.getState().diagram.code).toBe('flowchart TB\n  A');
    });

    it('should handle going to current version', () => {
      const { addVersion, goToVersion } = useStore.getState();

      addVersion('flowchart TB\n  A', 'v1');
      const v1Id = useStore.getState().timelineState.currentVersionId;

      goToVersion(v1Id);

      expect(useStore.getState().timelineState.currentVersionId).toBe(v1Id);
    });

    it('should handle non-existent version gracefully', () => {
      const { addVersion, goToVersion } = useStore.getState();

      addVersion('flowchart TB\n  A', 'v1');
      const v1Id = useStore.getState().timelineState.currentVersionId;

      goToVersion('nonexistent-id');

      // Should remain at current version
      expect(useStore.getState().timelineState.currentVersionId).toBe(v1Id);
    });
  });

  describe('Branching', () => {
    it('should create new branch', () => {
      const { addVersion, createBranch } = useStore.getState();

      addVersion('flowchart TB\n  A', 'v1');
      createBranch('feature-1');

      const timeline = useStore.getState().timelineState;
      expect(timeline.branches).toHaveLength(2);
      expect(timeline.branches.some((b) => b.name === 'feature-1')).toBe(true);
    });

    it('should switch to new branch after creation', () => {
      const { addVersion, createBranch } = useStore.getState();

      addVersion('flowchart TB\n  A', 'v1');
      createBranch('feature-1');

      const timeline = useStore.getState().timelineState;
      expect(timeline.currentBranchId).not.toBe('main');
    });

    it('should include current version in new branch', () => {
      const { addVersion, createBranch } = useStore.getState();

      addVersion('flowchart TB\n  A', 'v1');
      const v1Id = useStore.getState().timelineState.currentVersionId;

      createBranch('feature-1');

      const timeline = useStore.getState().timelineState;
      const newBranch = timeline.branches.find((b) => b.name === 'feature-1');

      expect(newBranch?.versionIds).toContain(v1Id);
    });

    it('should support multiple branches', () => {
      const { addVersion, createBranch } = useStore.getState();

      addVersion('flowchart TB\n  A', 'v1');
      createBranch('feature-1');
      createBranch('feature-2');
      createBranch('experiment');

      const timeline = useStore.getState().timelineState;
      expect(timeline.branches).toHaveLength(4); // main + 3 new
    });
  });

  describe('Version History', () => {
    it('should maintain version order', () => {
      const { addVersion } = useStore.getState();

      addVersion('flowchart TB\n  A', 'First');
      addVersion('flowchart TB\n  A --> B', 'Second');
      addVersion('flowchart TB\n  A --> B --> C', 'Third');

      const versions = useStore.getState().timelineState.versions;
      expect(versions[0].description).toBe('First');
      expect(versions[1].description).toBe('Second');
      expect(versions[2].description).toBe('Third');
    });

    it('should store code for each version', () => {
      const { addVersion } = useStore.getState();

      addVersion('flowchart TB\n  A', 'v1');
      addVersion('flowchart TB\n  A --> B', 'v2');

      const versions = useStore.getState().timelineState.versions;
      expect(versions[0].code).toBe('flowchart TB\n  A');
      expect(versions[1].code).toBe('flowchart TB\n  A --> B');
    });
  });
});
