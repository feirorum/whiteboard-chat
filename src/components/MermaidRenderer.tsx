import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import mermaid from 'mermaid';
import { toPng } from 'html-to-image';
import type { DiagramElement } from '../types';
import './MermaidRenderer.css';

// Initialize mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: 'basis',
  },
});

// Colors for marking elements
export const MARKER_COLORS = [
  '#e94560', // red
  '#4ecca3', // green
  '#00d4ff', // cyan
  '#ffc107', // yellow
  '#9b59b6', // purple
  '#ff6b6b', // coral
  '#3498db', // blue
  '#e67e22', // orange
];

export interface MermaidRendererRef {
  captureImage: () => Promise<string>;
  getElements: () => DiagramElement[];
}

interface MermaidRendererProps {
  code: string;
  onElementClick?: (element: DiagramElement) => void;
  markedElements?: Map<string, number>; // element id -> marker index (for numbered colors)
  interactive?: boolean;
  className?: string;
  highlightNew?: Set<string>; // IDs of new elements (for ghost/diff)
  highlightRemoved?: Set<string>; // IDs of removed elements (for diff)
}

export const MermaidRenderer = forwardRef<MermaidRendererRef, MermaidRendererProps>(
  ({ code, onElementClick, markedElements, interactive = false, className = '', highlightNew, highlightRemoved }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const diagramRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [elements, setElements] = useState<DiagramElement[]>([]);
    const [renderKey, setRenderKey] = useState(0);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      captureImage: async () => {
        if (!containerRef.current) return '';
        try {
          return await toPng(containerRef.current, {
            backgroundColor: '#1a1a2e',
            quality: 0.95,
          });
        } catch (err) {
          console.error('Image capture error:', err);
          return '';
        }
      },
      getElements: () => elements,
    }));

    // Render mermaid diagram
    useEffect(() => {
      const renderDiagram = async () => {
        if (!code || !diagramRef.current) return;

        try {
          setError(null);
          const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const { svg } = await mermaid.render(id, code);
          diagramRef.current.innerHTML = svg;

          // Parse elements from SVG for interactivity
          const svgElement = diagramRef.current.querySelector('svg');
          if (svgElement) {
            const parsedElements = parseElementsFromSvg(svgElement, diagramRef.current);
            setElements(parsedElements);
            setRenderKey(k => k + 1);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to render diagram');
          console.error('Mermaid render error:', err);
        }
      };

      renderDiagram();
    }, [code]);

    // Apply visual markers/highlights after render
    useEffect(() => {
      if (!diagramRef.current) return;

      const svg = diagramRef.current.querySelector('svg');
      if (!svg) return;

      // Remove all existing marker overlays first
      svg.querySelectorAll('.marker-badge-group').forEach(el => el.remove());

      // Apply numbered color markers
      if (markedElements && markedElements.size > 0) {
        markedElements.forEach((index, elementId) => {
          const element = svg.querySelector(`[id="${elementId}"]`) as SVGElement;
          if (!element) return;

          const bbox = (element as SVGGraphicsElement).getBBox?.();
          if (!bbox) return;

          // Get element's transform
          const transform = element.getAttribute('transform') || '';
          const match = transform.match(/translate\(([\d.-]+),?\s*([\d.-]+)?\)/);
          const tx = match ? parseFloat(match[1]) : 0;
          const ty = match ? parseFloat(match[2] || '0') : 0;

          // Create marker badge group
          const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          group.classList.add('marker-badge-group');

          const color = MARKER_COLORS[index % MARKER_COLORS.length];

          // Position at top-right of element
          const cx = tx + bbox.x + bbox.width - 5;
          const cy = ty + bbox.y + 5;

          // Add circle background
          const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          circle.setAttribute('cx', String(cx));
          circle.setAttribute('cy', String(cy));
          circle.setAttribute('r', '12');
          circle.setAttribute('fill', color);
          circle.setAttribute('stroke', 'white');
          circle.setAttribute('stroke-width', '2');
          group.appendChild(circle);

          // Add number text
          const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          text.setAttribute('x', String(cx));
          text.setAttribute('y', String(cy + 4));
          text.setAttribute('text-anchor', 'middle');
          text.setAttribute('fill', 'white');
          text.setAttribute('font-size', '11');
          text.setAttribute('font-weight', 'bold');
          text.setAttribute('font-family', 'Arial, sans-serif');
          text.textContent = String(index + 1);
          group.appendChild(text);

          svg.appendChild(group);

          // Add border highlight to element
          const shapes = element.querySelectorAll('rect, circle, ellipse, polygon');
          shapes.forEach(shape => {
            shape.setAttribute('stroke', color);
            shape.setAttribute('stroke-width', '3');
          });
        });
      }

      // Apply "new" highlights (green dashed border for ghosts/additions)
      if (highlightNew && highlightNew.size > 0) {
        highlightNew.forEach(elementId => {
          const element = svg.querySelector(`[id="${elementId}"]`);
          if (!element) return;

          const shapes = element.querySelectorAll('rect, circle, ellipse, polygon');
          shapes.forEach(shape => {
            shape.setAttribute('stroke', '#4ecca3');
            shape.setAttribute('stroke-width', '3');
            shape.setAttribute('stroke-dasharray', '5,5');
            shape.setAttribute('fill-opacity', '0.7');
          });
        });
      }

      // Apply "removed" highlights (red strikethrough for removals)
      if (highlightRemoved && highlightRemoved.size > 0) {
        highlightRemoved.forEach(elementId => {
          const element = svg.querySelector(`[id="${elementId}"]`);
          if (!element) return;

          const shapes = element.querySelectorAll('rect, circle, ellipse, polygon');
          shapes.forEach(shape => {
            shape.setAttribute('stroke', '#e94560');
            shape.setAttribute('stroke-width', '3');
            shape.setAttribute('fill-opacity', '0.3');
          });

          // Add strikethrough line
          const bbox = (element as SVGGraphicsElement).getBBox?.();
          if (bbox) {
            const transform = element.getAttribute('transform') || '';
            const match = transform.match(/translate\(([\d.-]+),?\s*([\d.-]+)?\)/);
            const tx = match ? parseFloat(match[1]) : 0;
            const ty = match ? parseFloat(match[2] || '0') : 0;

            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.classList.add('marker-badge-group');
            line.setAttribute('x1', String(tx + bbox.x));
            line.setAttribute('y1', String(ty + bbox.y + bbox.height / 2));
            line.setAttribute('x2', String(tx + bbox.x + bbox.width));
            line.setAttribute('y2', String(ty + bbox.y + bbox.height / 2));
            line.setAttribute('stroke', '#e94560');
            line.setAttribute('stroke-width', '3');
            svg.appendChild(line);
          }
        });
      }
    }, [renderKey, markedElements, highlightNew, highlightRemoved]);

    // Parse clickable elements from rendered SVG
    const parseElementsFromSvg = (svg: SVGElement, container: HTMLElement): DiagramElement[] => {
      const elements: DiagramElement[] = [];

      // Find nodes (flowchart)
      svg.querySelectorAll('.node').forEach((node) => {
        const id = node.id || '';
        if (!id) return;

        const labelEl = node.querySelector('.nodeLabel');
        const label = labelEl?.textContent || id.replace(/^flowchart-/, '').replace(/-\d+$/, '');

        elements.push({
          id,
          type: 'node',
          label,
        });
      });

      // Find subgraphs/clusters
      svg.querySelectorAll('.cluster').forEach((cluster) => {
        const id = cluster.id || '';
        if (!id) return;

        const label = cluster.querySelector('.cluster-label')?.textContent || id;
        elements.push({
          id,
          type: 'subgraph',
          label,
        });
      });

      return elements;
    };

    // Handle click on diagram elements
    const handleClick = useCallback(
      (e: React.MouseEvent) => {
        if (!interactive || !onElementClick || !diagramRef.current) return;

        const target = e.target as HTMLElement;
        const nodeElement = target.closest('.node, .cluster');

        if (nodeElement) {
          const id = nodeElement.id || '';
          if (!id) return;

          const labelEl = nodeElement.querySelector('.nodeLabel, .cluster-label');
          const label = labelEl?.textContent || id.replace(/^flowchart-/, '').replace(/-\d+$/, '');
          const type = nodeElement.classList.contains('cluster') ? 'subgraph' : 'node';

          onElementClick({ id, type, label });
        }
      },
      [interactive, onElementClick]
    );

    return (
      <div className={`mermaid-renderer ${className}`} ref={containerRef}>
        <div
          ref={diagramRef}
          className={`mermaid-diagram ${interactive ? 'interactive' : ''}`}
          onClick={handleClick}
        />

        {error && (
          <div className="mermaid-error">
            <strong>Diagram Error:</strong>
            <pre>{error}</pre>
          </div>
        )}

        {!code && !error && (
          <div className="mermaid-empty">
            <p>No diagram loaded</p>
            <p className="hint">Select an example to begin</p>
          </div>
        )}
      </div>
    );
  }
);

MermaidRenderer.displayName = 'MermaidRenderer';

export default MermaidRenderer;
