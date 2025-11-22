import React, { useCallback, useRef, useMemo } from 'react';
import { useStore } from '../../store';
import { MermaidRenderer, MermaidRendererRef, MARKER_COLORS } from '../../components/MermaidRenderer';
import { ChatInterface } from '../../components/ChatInterface';
import type { DiagramElement } from '../../types';
import './MarkerMode.css';

export const MarkerMode: React.FC = () => {
  const { markerState, toggleMarkedElement, clearMarkedElements, diagram } = useStore();
  const rendererRef = useRef<MermaidRendererRef>(null);

  const handleElementClick = useCallback(
    (element: DiagramElement) => {
      toggleMarkedElement(element.id);
    },
    [toggleMarkedElement]
  );

  const handleCaptureForSend = useCallback(async (): Promise<string> => {
    if (rendererRef.current) {
      return await rendererRef.current.captureImage();
    }
    return '';
  }, []);

  // Build context with numbered references for LLM
  const buildContextInfo = useCallback((): string => {
    if (markerState.markedElements.size === 0) {
      return '';
    }

    const markerDescriptions: string[] = [];
    markerState.markedElements.forEach((index, elementId) => {
      const cleanId = elementId.replace(/^flowchart-/, '').replace(/-\d+$/, '');
      markerDescriptions.push(`#${index + 1} (${MARKER_COLORS[index % MARKER_COLORS.length]}): "${cleanId}"`);
    });

    return `The user has marked ${markerState.markedElements.size} element(s) in the diagram with colored numbered badges:\n${markerDescriptions.join('\n')}\n\nPlease focus your changes on these marked elements. Reference them by their number when explaining changes.`;
  }, [markerState.markedElements]);

  // Convert marked elements for the renderer
  const markedElementsMap = useMemo(() => {
    return markerState.markedElements;
  }, [markerState.markedElements]);

  // Get sorted list for display
  const sortedMarkers = useMemo(() => {
    const entries = Array.from(markerState.markedElements.entries());
    return entries.sort((a, b) => a[1] - b[1]);
  }, [markerState.markedElements]);

  return (
    <div className="marker-mode approach-layout">
      <div className="diagram-panel">
        <div className="panel-header">
          <h3>Diagram</h3>
          <div className="marker-controls">
            <span className="marked-count">
              {markerState.markedElements.size} marked
            </span>
            <button
              onClick={clearMarkedElements}
              disabled={markerState.markedElements.size === 0}
              className="clear-markers-btn"
            >
              Clear Markers
            </button>
          </div>
        </div>
        <div className="diagram-instructions">
          Click on diagram elements to mark them. Each gets a unique color and number.
        </div>

        {/* Legend of marked elements */}
        {sortedMarkers.length > 0 && (
          <div className="markers-legend">
            {sortedMarkers.map(([elementId, index]) => {
              const cleanId = elementId.replace(/^flowchart-/, '').replace(/-\d+$/, '');
              return (
                <div key={elementId} className="marker-item" onClick={() => toggleMarkedElement(elementId)}>
                  <span
                    className="marker-color"
                    style={{ backgroundColor: MARKER_COLORS[index % MARKER_COLORS.length] }}
                  >
                    {index + 1}
                  </span>
                  <span className="marker-label">{cleanId}</span>
                  <span className="marker-remove">×</span>
                </div>
              );
            })}
          </div>
        )}

        <MermaidRenderer
          ref={rendererRef}
          code={diagram.code}
          onElementClick={handleElementClick}
          markedElements={markedElementsMap}
          interactive={true}
        />
      </div>

      <div className="chat-panel">
        <ChatInterface
          onSendWithImage={handleCaptureForSend}
          contextInfo={buildContextInfo()}
        />
      </div>
    </div>
  );
};

export default MarkerMode;
