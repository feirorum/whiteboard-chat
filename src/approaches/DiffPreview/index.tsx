import React, { useCallback, useState, useEffect } from 'react';
import mermaid from 'mermaid';
import { useStore } from '../../store';
import { ChatInterface } from '../../components/ChatInterface';
import { parseMermaidFromResponse } from '../../providers/llm-provider';
import './DiffPreview.css';

export const DiffPreview: React.FC = () => {
  const {
    diagram,
    setDiagramCode,
    diffState,
    setProposedCode,
    applyAcceptedChanges,
    clearDiff,
    messages,
  } = useStore();

  const [currentSvg, setCurrentSvg] = useState('');
  const [proposedSvg, setProposedSvg] = useState('');

  // Render current diagram
  useEffect(() => {
    const renderCurrent = async () => {
      if (!diagram.code) return;
      try {
        const { svg } = await mermaid.render(`current-${Date.now()}`, diagram.code);
        setCurrentSvg(svg);
      } catch (e) {
        console.error('Error rendering current diagram:', e);
      }
    };
    renderCurrent();
  }, [diagram.code]);

  // Render proposed diagram
  useEffect(() => {
    const renderProposed = async () => {
      if (!diffState.proposedCode) {
        setProposedSvg('');
        return;
      }
      try {
        const { svg } = await mermaid.render(`proposed-${Date.now()}`, diffState.proposedCode);
        setProposedSvg(svg);
      } catch (e) {
        console.error('Error rendering proposed diagram:', e);
      }
    };
    renderProposed();
  }, [diffState.proposedCode]);

  // Watch for new assistant messages and extract proposed changes
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'assistant') {
      const newCode = parseMermaidFromResponse(lastMessage.content);
      if (newCode && newCode !== diagram.code) {
        setProposedCode(newCode);
      }
    }
  }, [messages, diagram.code, setProposedCode]);

  const handleAccept = useCallback(() => {
    if (diffState.proposedCode) {
      setDiagramCode(diffState.proposedCode);
      clearDiff();
    }
  }, [diffState.proposedCode, setDiagramCode, clearDiff]);

  const handleReject = useCallback(() => {
    clearDiff();
  }, [clearDiff]);

  const hasDiff = diffState.proposedCode && diffState.proposedCode !== diagram.code;

  return (
    <div className="diff-preview approach-layout">
      <div className="diagram-panel">
        <div className="panel-header">
          <h3>Diagram</h3>
          {hasDiff && (
            <div className="diff-controls">
              <span className="diff-badge">Changes proposed</span>
              <button className="accept-btn" onClick={handleAccept}>
                Accept All
              </button>
              <button className="reject-btn" onClick={handleReject}>
                Reject
              </button>
            </div>
          )}
        </div>
        <div className="diagram-instructions">
          Describe changes in chat. Proposed changes will appear for review.
        </div>

        <div className={`diff-view ${hasDiff ? 'has-diff' : ''}`}>
          {/* Current diagram */}
          <div className="diagram-side current">
            <div className="side-label">Current</div>
            <div
              className="diagram-content"
              dangerouslySetInnerHTML={{ __html: currentSvg }}
            />
          </div>

          {/* Proposed diagram (when diff exists) */}
          {hasDiff && (
            <div className="diagram-side proposed">
              <div className="side-label">Proposed</div>
              <div
                className="diagram-content"
                dangerouslySetInnerHTML={{ __html: proposedSvg }}
              />
            </div>
          )}
        </div>

        {/* Code diff view */}
        {hasDiff && (
          <div className="code-diff">
            <div className="diff-header">
              <span>Code Changes</span>
              <button className="toggle-diff">Show/Hide</button>
            </div>
            <div className="diff-content">
              <div className="diff-side old">
                <pre>{diagram.code}</pre>
              </div>
              <div className="diff-side new">
                <pre>{diffState.proposedCode}</pre>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="chat-panel">
        <ChatInterface />
      </div>
    </div>
  );
};

export default DiffPreview;
