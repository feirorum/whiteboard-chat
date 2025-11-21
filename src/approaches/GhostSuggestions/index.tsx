import React, { useCallback, useEffect } from 'react';
import { useStore } from '../../store';
import { MermaidRenderer } from '../../components/MermaidRenderer';
import { ChatInterface } from '../../components/ChatInterface';
import { parseMermaidFromResponse } from '../../providers/llm-provider';
import './GhostSuggestions.css';

export const GhostSuggestions: React.FC = () => {
  const {
    diagram,
    setDiagramCode,
    ghostState,
    addGhost,
    acceptGhost,
    dismissGhost,
    clearGhosts,
    messages,
  } = useStore();

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
      }
    },
    [ghostState.ghosts, setDiagramCode, dismissGhost]
  );

  const buildContextInfo = useCallback((): string => {
    return 'Please suggest changes to the diagram. Your suggestions will appear as "ghost" previews that the user can accept or dismiss.';
  }, []);

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
          AI suggestions appear as ghost overlays. Accept or dismiss them.
        </div>

        <div className="diagram-with-ghosts">
          <MermaidRenderer />

          {/* Ghost suggestions panel */}
          {ghostState.ghosts.length > 0 && (
            <div className="ghosts-panel">
              <h4>Suggestions</h4>
              {ghostState.ghosts.map((ghost) => (
                <div key={ghost.id} className="ghost-card">
                  <div className="ghost-description">{ghost.description}</div>
                  <div className="ghost-preview">
                    <code>{ghost.mermaidCode.slice(0, 100)}...</code>
                  </div>
                  <div className="ghost-actions">
                    <button
                      className="accept-ghost-btn"
                      onClick={() => handleAcceptGhost(ghost.id)}
                    >
                      Accept
                    </button>
                    <button
                      className="dismiss-ghost-btn"
                      onClick={() => dismissGhost(ghost.id)}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="chat-panel">
        <ChatInterface contextInfo={buildContextInfo()} />
      </div>
    </div>
  );
};

export default GhostSuggestions;
