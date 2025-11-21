import React, { useEffect, useRef, useState, useCallback } from 'react';
import mermaid from 'mermaid';
import { toPng } from 'html-to-image';
import { useStore } from '../store';
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

interface MermaidRendererProps {
  onElementClick?: (element: DiagramElement) => void;
  onImageCapture?: (imageBase64: string) => void;
  showMarkers?: boolean;
  overlayContent?: React.ReactNode;
}

export const MermaidRenderer: React.FC<MermaidRendererProps> = ({
  onElementClick,
  onImageCapture,
  showMarkers = false,
  overlayContent,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const diagramRef = useRef<HTMLDivElement>(null);
  const { diagram, setDiagramSvg, markerState } = useStore();
  const [error, setError] = useState<string | null>(null);
  const [elements, setElements] = useState<DiagramElement[]>([]);

  // Render mermaid diagram
  useEffect(() => {
    const renderDiagram = async () => {
      if (!diagram.code || !diagramRef.current) return;

      try {
        setError(null);
        const id = `mermaid-${Date.now()}`;
        const { svg } = await mermaid.render(id, diagram.code);
        diagramRef.current.innerHTML = svg;
        setDiagramSvg(svg);

        // Parse elements from SVG for interactivity
        const svgElement = diagramRef.current.querySelector('svg');
        if (svgElement) {
          const parsedElements = parseElementsFromSvg(svgElement);
          setElements(parsedElements);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to render diagram');
        console.error('Mermaid render error:', err);
      }
    };

    renderDiagram();
  }, [diagram.code, setDiagramSvg]);

  // Parse clickable elements from rendered SVG
  const parseElementsFromSvg = (svg: SVGElement): DiagramElement[] => {
    const elements: DiagramElement[] = [];

    // Find nodes (flowchart)
    svg.querySelectorAll('.node').forEach((node) => {
      const id = node.id || node.getAttribute('data-id') || '';
      const label = node.querySelector('.nodeLabel')?.textContent || '';
      const rect = node.getBoundingClientRect();
      elements.push({
        id,
        type: 'node',
        label,
        bounds: rect,
      });
    });

    // Find edges
    svg.querySelectorAll('.edgePath').forEach((edge, index) => {
      const id = edge.id || `edge-${index}`;
      elements.push({
        id,
        type: 'edge',
        label: '',
      });
    });

    // Find subgraphs
    svg.querySelectorAll('.cluster').forEach((cluster) => {
      const id = cluster.id || '';
      const label = cluster.querySelector('.cluster-label')?.textContent || '';
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
      if (!onElementClick || !diagramRef.current) return;

      const target = e.target as HTMLElement;
      const nodeElement = target.closest('.node, .cluster, .edgePath');

      if (nodeElement) {
        const id = nodeElement.id || nodeElement.getAttribute('data-id') || '';
        const label = nodeElement.querySelector('.nodeLabel, .cluster-label')?.textContent || '';
        const type = nodeElement.classList.contains('cluster')
          ? 'subgraph'
          : nodeElement.classList.contains('edgePath')
          ? 'edge'
          : 'node';

        onElementClick({ id, type, label });
      }
    },
    [onElementClick]
  );

  // Capture diagram as image
  const captureImage = useCallback(async (): Promise<string> => {
    if (!containerRef.current) return '';

    try {
      const dataUrl = await toPng(containerRef.current, {
        backgroundColor: '#1a1a2e',
        quality: 0.95,
      });
      onImageCapture?.(dataUrl);
      return dataUrl;
    } catch (err) {
      console.error('Image capture error:', err);
      return '';
    }
  }, [onImageCapture]);

  // Expose capture function via ref
  useEffect(() => {
    (window as any).__captureDiagram = captureImage;
    return () => {
      delete (window as any).__captureDiagram;
    };
  }, [captureImage]);

  return (
    <div className="mermaid-renderer" ref={containerRef}>
      <div
        ref={diagramRef}
        className={`mermaid-diagram ${showMarkers ? 'interactive' : ''}`}
        onClick={handleClick}
      />

      {/* Marker highlights for marked elements */}
      {showMarkers && markerState.markedElements.size > 0 && (
        <div className="markers-overlay">
          {elements
            .filter((el) => markerState.markedElements.has(el.id))
            .map((el) => (
              <div
                key={el.id}
                className="element-marker"
                style={{
                  position: 'absolute',
                  // Position would be calculated from bounds
                }}
              >
                <span className="marker-badge">{el.label}</span>
              </div>
            ))}
        </div>
      )}

      {/* Custom overlay content (for annotations, ghosts, etc.) */}
      {overlayContent && <div className="custom-overlay">{overlayContent}</div>}

      {/* Error display */}
      {error && (
        <div className="mermaid-error">
          <strong>Diagram Error:</strong>
          <pre>{error}</pre>
        </div>
      )}

      {/* Empty state */}
      {!diagram.code && !error && (
        <div className="mermaid-empty">
          <p>No diagram loaded</p>
          <p className="hint">Select an example or paste Mermaid code to begin</p>
        </div>
      )}
    </div>
  );
};

export default MermaidRenderer;
