import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../../src/store';

describe('Diff Preview Approach', () => {
  beforeEach(() => {
    useStore.setState({
      currentApproach: 'diff-preview',
      diagram: { code: 'flowchart TB\n  A --> B', svg: '', elements: [] },
      diffState: {
        currentCode: '',
        proposedCode: '',
        changes: [],
        acceptedChanges: new Set(),
      },
    });
  });

  describe('Proposed Changes', () => {
    it('should set proposed code', () => {
      const { setDiagramCode, setProposedCode } = useStore.getState();

      setDiagramCode('flowchart TB\n  A --> B');
      setProposedCode('flowchart TB\n  A --> B --> C');

      const diff = useStore.getState().diffState;
      expect(diff.currentCode).toBe('flowchart TB\n  A --> B');
      expect(diff.proposedCode).toBe('flowchart TB\n  A --> B --> C');
    });

    it('should detect when there is a diff', () => {
      const { setDiagramCode, setProposedCode } = useStore.getState();

      setDiagramCode('flowchart TB\n  A');
      setProposedCode('flowchart TB\n  A --> B');

      const diff = useStore.getState().diffState;
      const hasDiff = diff.proposedCode && diff.proposedCode !== diff.currentCode;

      expect(hasDiff).toBe(true);
    });

    it('should detect when there is no diff', () => {
      const { setDiagramCode, setProposedCode } = useStore.getState();

      setDiagramCode('flowchart TB\n  A');
      setProposedCode('flowchart TB\n  A');

      const diff = useStore.getState().diffState;
      const hasDiff = diff.proposedCode && diff.proposedCode !== diff.currentCode;

      expect(hasDiff).toBe(false);
    });
  });

  describe('Accepting and Rejecting', () => {
    it('should accept change by ID', () => {
      const { acceptChange } = useStore.getState();

      acceptChange('change1');
      acceptChange('change2');

      const accepted = useStore.getState().diffState.acceptedChanges;
      expect(accepted.has('change1')).toBe(true);
      expect(accepted.has('change2')).toBe(true);
    });

    it('should reject change by ID', () => {
      const { acceptChange, rejectChange } = useStore.getState();

      acceptChange('change1');
      acceptChange('change2');
      rejectChange('change1');

      const accepted = useStore.getState().diffState.acceptedChanges;
      expect(accepted.has('change1')).toBe(false);
      expect(accepted.has('change2')).toBe(true);
    });

    it('should apply accepted changes to diagram', () => {
      const { setDiagramCode, setProposedCode, acceptChange, applyAcceptedChanges } =
        useStore.getState();

      setDiagramCode('flowchart TB\n  A');
      setProposedCode('flowchart TB\n  A --> B');
      acceptChange('all');
      applyAcceptedChanges();

      expect(useStore.getState().diagram.code).toBe('flowchart TB\n  A --> B');
    });

    it('should not apply changes when none accepted', () => {
      const { setDiagramCode, setProposedCode, applyAcceptedChanges } = useStore.getState();

      setDiagramCode('flowchart TB\n  A');
      setProposedCode('flowchart TB\n  A --> B');
      applyAcceptedChanges();

      expect(useStore.getState().diagram.code).toBe('flowchart TB\n  A');
    });

    it('should clear diff after applying', () => {
      const { setDiagramCode, setProposedCode, acceptChange, applyAcceptedChanges } =
        useStore.getState();

      setDiagramCode('flowchart TB\n  A');
      setProposedCode('flowchart TB\n  A --> B');
      acceptChange('all');
      applyAcceptedChanges();

      const diff = useStore.getState().diffState;
      expect(diff.proposedCode).toBe('');
      expect(diff.currentCode).toBe('');
    });
  });

  describe('Clearing Diff', () => {
    it('should clear all diff state', () => {
      const { setDiagramCode, setProposedCode, acceptChange, clearDiff } = useStore.getState();

      setDiagramCode('flowchart TB\n  A');
      setProposedCode('flowchart TB\n  A --> B');
      acceptChange('change1');

      clearDiff();

      const diff = useStore.getState().diffState;
      expect(diff.proposedCode).toBe('');
      expect(diff.currentCode).toBe('');
      expect(diff.acceptedChanges.size).toBe(0);
    });
  });
});
