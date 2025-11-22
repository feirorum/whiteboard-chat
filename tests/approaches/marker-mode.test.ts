import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../../src/store';

describe('Marker Mode Approach', () => {
  beforeEach(() => {
    useStore.setState({
      currentApproach: 'marker-mode',
      diagram: { code: 'flowchart TB\n  A --> B --> C', svg: '', elements: [] },
      markerState: { markedElements: new Map(), nextIndex: 0 },
    });
  });

  describe('Element Marking', () => {
    it('should mark a single element', () => {
      const { toggleMarkedElement } = useStore.getState();

      toggleMarkedElement('nodeA');

      const marked = useStore.getState().markerState.markedElements;
      expect(marked.has('nodeA')).toBe(true);
      expect(marked.size).toBe(1);
    });

    it('should assign index to marked element', () => {
      const { toggleMarkedElement } = useStore.getState();

      toggleMarkedElement('nodeA');

      const marked = useStore.getState().markerState.markedElements;
      expect(marked.get('nodeA')).toBe(0);
    });

    it('should unmark an already marked element', () => {
      const { toggleMarkedElement } = useStore.getState();

      toggleMarkedElement('nodeA');
      toggleMarkedElement('nodeA');

      const marked = useStore.getState().markerState.markedElements;
      expect(marked.has('nodeA')).toBe(false);
    });

    it('should handle marking multiple elements with sequential indices', () => {
      const { toggleMarkedElement } = useStore.getState();

      toggleMarkedElement('nodeA');
      toggleMarkedElement('nodeB');
      toggleMarkedElement('edge1');

      const marked = useStore.getState().markerState.markedElements;
      expect(marked.size).toBe(3);
      expect(marked.get('nodeA')).toBe(0);
      expect(marked.get('nodeB')).toBe(1);
      expect(marked.get('edge1')).toBe(2);
    });

    it('should clear all markers at once', () => {
      const { toggleMarkedElement, clearMarkedElements } = useStore.getState();

      toggleMarkedElement('nodeA');
      toggleMarkedElement('nodeB');
      toggleMarkedElement('nodeC');

      clearMarkedElements();

      const state = useStore.getState().markerState;
      expect(state.markedElements.size).toBe(0);
      expect(state.nextIndex).toBe(0);
    });
  });

  describe('Context Building', () => {
    it('should build context with marked elements', () => {
      const { toggleMarkedElement } = useStore.getState();

      toggleMarkedElement('nodeA');
      toggleMarkedElement('nodeB');

      const marked = useStore.getState().markerState.markedElements;
      const markedKeys = Array.from(marked.keys());

      expect(markedKeys).toContain('nodeA');
      expect(markedKeys).toContain('nodeB');
    });

    it('should work with empty markers', () => {
      const marked = useStore.getState().markerState.markedElements;
      expect(marked.size).toBe(0);
    });
  });
});
