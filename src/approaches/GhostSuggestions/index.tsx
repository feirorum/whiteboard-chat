import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { useStore } from '../../store';
import { MermaidRenderer, MermaidRendererRef } from '../../components/MermaidRenderer';
import { ChatInterface } from '../../components/ChatInterface';
import { parseMermaidFromResponse } from '../../providers/llm-provider';
import './GhostSuggestions.css';

export const GhostSuggestions: React.FC = () => {
  const {
    diagram,
    setDiagramCode,
    ghostState,
    addGhost,
    dismissGhost,
    clearGhosts,
    messages,
  } = useStore();

  const rendererRef = useRef<MermaidRendererRef>(null);
  const [previewGhostId, setPreviewGhostId] = useState<string | null>(null);

  // Watch for new assistant messages and extract suggestions as ghosts
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'assistant') {
      const newCode = parseMermaidFromResponse(lastMessage.content);
      if (newCode && newCode !== diagram.code) {
        // Extract the difference as a ghost suggestion
        const descriptionMatch = lastMessage.content.match(/\*\*Changes made:\*\*([\s\S]*?)(?=\*\*|$)/);
        const description = descriptionMatch
          ? descriptionMatch[1].trim().slice(0, 100)
          : 'Suggested changes';

        addGhost({
          mermaidCode: newCode,
          description,
        });
      }
    }
  }, [messages, diagram.code, addGhost]);

  const handleAcceptGhost = useCallback(
    (ghostId: string) => {
      const ghost = ghostState.ghosts.find((g) => g.id === ghostId);
      if (ghost) {
        setDiagramCode(ghost.mermaidCode);
        dismissGhost(ghostId);
        setPreviewGhostId(null);
      }
    },
    [ghostState.ghosts, setDiagramCode, dismissGhost]
  );

  const handleDismissGhost = useCallback(
    (ghostId: string) => {
      dismissGhost(ghostId);
      if (previewGhostId === ghostId) {
        setPreviewGhostId(null);
      }
    },
    [dismissGhost, previewGhostId]
  );

  const handlePreviewGhost = useCallback((ghostId: string) => {
    setPreviewGhostId(prev => prev === ghostId ? null : ghostId);
  }, []);

  const buildContextInfo = useCallback((): string => {
    return 'Please suggest changes to the diagram. Your suggestions will appear as "ghost" previews that the user can accept or dismiss.';
  }, []);

  // Get the code to display - either preview or current
  const displayCode = useMemo(() => {
    if (previewGhostId) {
      const ghost = ghostState.ghosts.find(g => g.id === previewGhostId);
      return ghost?.mermaidCode || diagram.code;
    }
    return diagram.code;
  }, [previewGhostId, ghostState.ghosts, diagram.code]);

  // When previewing, highlight all elements as "new/ghost"
  const highlightAsGhost = useMemo(() => {
    if (!previewGhostId) return undefined;
    // Return a special flag to apply ghost styling to the whole diagram
    return new Set(['__preview_mode__']);
  }, [previewGhostId]);

  return (
    <div className="ghost-suggestions approach-layout">
      <div className="diagram-panel">
        <div className="panel-header">
          <h3>Diagram</h3>
          {ghostState.ghosts.length > 0 && (
            <div className="ghost-controls">
              <span className="ghost-count">
                {ghostState.ghosts.length} suggestion{ghostState.ghosts.length !== 1 ? 's' : ''}
              </span>
              <button className="clear-ghosts-btn" onClick={clearGhosts}>
                Dismiss All
              </button>
            </div>
          )}
        </div>
        <div className="diagram-instructions">
          AI suggestions appear below. Click "Preview" to see changes, then Accept or Dismiss.
        </div>

        {/* Ghost suggestions list */}
        {ghostState.ghosts.length > 0 && (
          <div className="ghosts-list">
            {ghostState.ghosts.map((ghost) => (
              <div
                key={ghost.id}
                className={`ghost-card ${previewGhostId === ghost.id ? 'previewing' : ''}`}
              >
                <div className="ghost-info">
                  <span className="ghost-icon">👻</span>
                  <span className="ghost-description">{ghost.description || 'Suggested changes'}</span>
                </div>
                <div className="ghost-actions">
                  <button
                    className={`preview-ghost-btn ${previewGhostId === ghost.id ? 'active' : ''}`}
                    onClick={() => handlePreviewGhost(ghost.id)}
                  >
                    {previewGhostId === ghost.id ? 'Hide Preview' : 'Preview'}
                  </button>
                  <button
                    className="accept-ghost-btn"
                    onClick={() => handleAcceptGhost(ghost.id)}
                  >
                    Accept
                  </button>
                  <button
                    className="dismiss-ghost-btn"
                    onClick={() => handleDismissGhost(ghost.id)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={`diagram-container ${previewGhostId ? 'ghost-preview-mode' : ''}`}>
          {previewGhostId && (
            <div className="preview-badge">
              <span>👻 Preview Mode</span>
              <span className="preview-hint">This is how the diagram will look if you accept</span>
            </div>
          )}
          <MermaidRenderer
            ref={rendererRef}
            code={displayCode}
            className={previewGhostId ? 'ghost-preview' : ''}
          />
        </div>
      </div>

      <div className="chat-panel">
        <ChatInterface contextInfo={buildContextInfo()} />
      </div>
    </div>
  );
};

export default GhostSuggestions;
