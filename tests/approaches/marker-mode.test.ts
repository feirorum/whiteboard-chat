import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../../src/store';

describe('Marker Mode Approach', () => {
  beforeEach(() => {
    useStore.setState({
      currentApproach: 'marker-mode',
      diagram: { code: 'flowchart TB\n  A --> B --> C', svg: '', elements: [] },
      markerState: { markedElements: new Set() },
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

    it('should unmark an already marked element', () => {
      const { toggleMarkedElement } = useStore.getState();

      toggleMarkedElement('nodeA');
      toggleMarkedElement('nodeA');

      const marked = useStore.getState().markerState.markedElements;
      expect(marked.has('nodeA')).toBe(false);
    });

    it('should handle marking multiple elements', () => {
      const { toggleMarkedElement } = useStore.getState();

      toggleMarkedElement('nodeA');
      toggleMarkedElement('nodeB');
      toggleMarkedElement('edge1');

      const marked = useStore.getState().markerState.markedElements;
      expect(marked.size).toBe(3);
    });

    it('should clear all markers at once', () => {
      const { toggleMarkedElement, clearMarkedElements } = useStore.getState();

      toggleMarkedElement('nodeA');
      toggleMarkedElement('nodeB');
      toggleMarkedElement('nodeC');

      clearMarkedElements();

      expect(useStore.getState().markerState.markedElements.size).toBe(0);
    });
  });

  describe('Context Building', () => {
    it('should build context with marked elements', () => {
      const { toggleMarkedElement } = useStore.getState();

      toggleMarkedElement('nodeA');
      toggleMarkedElement('nodeB');

      const marked = useStore.getState().markerState.markedElements;
      const markedArray = Array.from(marked);

      expect(markedArray).toContain('nodeA');
      expect(markedArray).toContain('nodeB');
    });

    it('should work with empty markers', () => {
      const marked = useStore.getState().markerState.markedElements;
      expect(marked.size).toBe(0);
    });
  });
});
