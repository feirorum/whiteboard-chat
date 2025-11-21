import React, { useCallback } from 'react';
import { useStore } from '../../store';
import { MermaidRenderer } from '../../components/MermaidRenderer';
import { ChatInterface } from '../../components/ChatInterface';
import type { DiagramElement } from '../../types';
import './MarkerMode.css';

export const MarkerMode: React.FC = () => {
  const { markerState, toggleMarkedElement, clearMarkedElements, diagram } = useStore();

  const handleElementClick = useCallback(
    (element: DiagramElement) => {
      toggleMarkedElement(element.id);
    },
    [toggleMarkedElement]
  );

  const handleCaptureForSend = useCallback(async (): Promise<string> => {
    const captureFunc = (window as any).__captureDiagram;
    if (captureFunc) {
      return await captureFunc();
    }
    return '';
  }, []);

  const buildContextInfo = useCallback((): string => {
    const marked = Array.from(markerState.markedElements);
    if (marked.length === 0) {
      return '';
    }
    return `The user has marked the following elements (highlighted in the image): ${marked.join(', ')}. Please focus changes on these marked elements.`;
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
          Click on diagram elements to mark them for changes
        </div>
        <MermaidRenderer
          onElementClick={handleElementClick}
          showMarkers={true}
          overlayContent={
            <MarkedElementsOverlay
              markedIds={markerState.markedElements}
            />
          }
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

// Overlay to highlight marked elements
const MarkedElementsOverlay: React.FC<{ markedIds: Set<string> }> = ({ markedIds }) => {
  if (markedIds.size === 0) return null;

  return (
    <div className="marked-elements-info">
      <div className="marked-badge">
        {markedIds.size} element{markedIds.size !== 1 ? 's' : ''} marked
      </div>
    </div>
  );
};

export default MarkerMode;
