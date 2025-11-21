import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../../src/store';

describe('Annotation Layer Approach', () => {
  beforeEach(() => {
    useStore.setState({
      currentApproach: 'annotation-layer',
      diagram: { code: 'flowchart TB\n  A --> B', svg: '', elements: [] },
      annotationState: {
        annotations: [],
        currentTool: null,
        currentColor: '#e94560',
      },
    });
  });

  describe('Tool Selection', () => {
    it('should select freehand tool', () => {
      const { setAnnotationTool } = useStore.getState();

      setAnnotationTool('freehand');

      expect(useStore.getState().annotationState.currentTool).toBe('freehand');
    });

    it('should select circle tool', () => {
      const { setAnnotationTool } = useStore.getState();

      setAnnotationTool('circle');

      expect(useStore.getState().annotationState.currentTool).toBe('circle');
    });

    it('should select arrow tool', () => {
      const { setAnnotationTool } = useStore.getState();

      setAnnotationTool('arrow');

      expect(useStore.getState().annotationState.currentTool).toBe('arrow');
    });

    it('should deselect tool', () => {
      const { setAnnotationTool } = useStore.getState();

      setAnnotationTool('circle');
      setAnnotationTool(null);

      expect(useStore.getState().annotationState.currentTool).toBe(null);
    });
  });

  describe('Color Selection', () => {
    it('should change annotation color', () => {
      const { setAnnotationColor } = useStore.getState();

      setAnnotationColor('#4ecca3');

      expect(useStore.getState().annotationState.currentColor).toBe('#4ecca3');
    });
  });

  describe('Creating Annotations', () => {
    it('should add circle annotation', () => {
      const { addAnnotation } = useStore.getState();

      addAnnotation({
        type: 'circle',
        points: [
          { x: 100, y: 100 },
          { x: 150, y: 150 },
        ],
        color: '#e94560',
      });

      const annotations = useStore.getState().annotationState.annotations;
      expect(annotations).toHaveLength(1);
      expect(annotations[0].type).toBe('circle');
      expect(annotations[0].points).toHaveLength(2);
    });

    it('should add arrow annotation', () => {
      const { addAnnotation } = useStore.getState();

      addAnnotation({
        type: 'arrow',
        points: [
          { x: 50, y: 50 },
          { x: 200, y: 100 },
        ],
        color: '#4ecca3',
      });

      const annotations = useStore.getState().annotationState.annotations;
      expect(annotations[0].type).toBe('arrow');
    });

    it('should add freehand annotation with multiple points', () => {
      const { addAnnotation } = useStore.getState();

      addAnnotation({
        type: 'freehand',
        points: [
          { x: 10, y: 10 },
          { x: 15, y: 12 },
          { x: 20, y: 15 },
          { x: 25, y: 20 },
          { x: 30, y: 25 },
        ],
        color: '#ffc107',
      });

      const annotations = useStore.getState().annotationState.annotations;
      expect(annotations[0].points).toHaveLength(5);
    });

    it('should add text annotation', () => {
      const { addAnnotation } = useStore.getState();

      addAnnotation({
        type: 'text',
        points: [{ x: 100, y: 100 }],
        color: '#ffffff',
        text: 'Move this here!',
      });

      const annotations = useStore.getState().annotationState.annotations;
      expect(annotations[0].type).toBe('text');
      expect(annotations[0].text).toBe('Move this here!');
    });

    it('should add strikethrough annotation', () => {
      const { addAnnotation } = useStore.getState();

      addAnnotation({
        type: 'strikethrough',
        points: [
          { x: 100, y: 100 },
          { x: 200, y: 150 },
        ],
        color: '#e94560',
      });

      const annotations = useStore.getState().annotationState.annotations;
      expect(annotations[0].type).toBe('strikethrough');
    });
  });

  describe('Managing Annotations', () => {
    it('should assign unique IDs to annotations', () => {
      const { addAnnotation } = useStore.getState();

      addAnnotation({ type: 'circle', points: [], color: '#fff' });
      addAnnotation({ type: 'arrow', points: [], color: '#fff' });
      addAnnotation({ type: 'freehand', points: [], color: '#fff' });

      const annotations = useStore.getState().annotationState.annotations;
      const ids = annotations.map((a) => a.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(3);
    });

    it('should clear all annotations', () => {
      const { addAnnotation, clearAnnotations } = useStore.getState();

      addAnnotation({ type: 'circle', points: [], color: '#fff' });
      addAnnotation({ type: 'arrow', points: [], color: '#fff' });

      clearAnnotations();

      expect(useStore.getState().annotationState.annotations).toHaveLength(0);
    });

    it('should preserve tool and color when clearing annotations', () => {
      const { addAnnotation, setAnnotationTool, setAnnotationColor, clearAnnotations } =
        useStore.getState();

      setAnnotationTool('arrow');
      setAnnotationColor('#4ecca3');
      addAnnotation({ type: 'arrow', points: [], color: '#4ecca3' });

      clearAnnotations();

      const state = useStore.getState().annotationState;
      expect(state.currentTool).toBe('arrow');
      expect(state.currentColor).toBe('#4ecca3');
    });
  });
});
