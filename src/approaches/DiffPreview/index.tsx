import React, { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import { useStore } from '../../store';
import { MermaidRenderer, MermaidRendererRef } from '../../components/MermaidRenderer';
import { ChatInterface } from '../../components/ChatInterface';
import { parseMermaidFromResponse } from '../../providers/llm-provider';
import './DiffPreview.css';

interface DiffElement {
  id: string;
  label: string;
  type: 'added' | 'removed' | 'unchanged';
}

// Simple parser to extract node definitions from mermaid code
function parseNodes(code: string): Map<string, string> {
  const nodes = new Map<string, string>();

  // Match node definitions like: A[Label], B((Circle)), C{Diamond}, etc.
  const nodePatterns = [
    /(\w+)\[([^\]]+)\]/g,      // A[Label]
    /(\w+)\[\[([^\]]+)\]\]/g,  // A[[Label]]
    /(\w+)\(([^)]+)\)/g,       // A(Label)
    /(\w+)\(\(([^)]+)\)\)/g,   // A((Label))
    /(\w+)\{([^}]+)\}/g,       // A{Label}
    /(\w+)\[\(([^)]+)\)\]/g,   // A[(Label)]
    /(\w+)>([^\]]+)\]/g,       // A>Label]
  ];

  for (const pattern of nodePatterns) {
    let match;
    const regex = new RegExp(pattern.source, 'g');
    while ((match = regex.exec(code)) !== null) {
      nodes.set(match[1], match[2]);
    }
  }

  // Also match simple node references in connections
  const connections = code.match(/(\w+)\s*--[->|]+\s*(\w+)/g) || [];
  connections.forEach(conn => {
    const parts = conn.match(/(\w+)\s*--[->|]+\s*(\w+)/);
    if (parts) {
      if (!nodes.has(parts[1])) nodes.set(parts[1], parts[1]);
      if (!nodes.has(parts[2])) nodes.set(parts[2], parts[2]);
    }
  });

  return nodes;
}

// Compare two sets of nodes to find differences
function diffNodes(currentCode: string, proposedCode: string): DiffElement[] {
  const currentNodes = parseNodes(currentCode);
  const proposedNodes = parseNodes(proposedCode);
  const diff: DiffElement[] = [];

  // Find removed nodes (in current but not in proposed)
  currentNodes.forEach((label, id) => {
    if (!proposedNodes.has(id)) {
      diff.push({ id, label, type: 'removed' });
    }
  });

  // Find added nodes (in proposed but not in current)
  proposedNodes.forEach((label, id) => {
    if (!currentNodes.has(id)) {
      diff.push({ id, label, type: 'added' });
    }
  });

  return diff;
}

export const DiffPreview: React.FC = () => {
  const {
    diagram,
    setDiagramCode,
    diffState,
    setProposedCode,
    clearDiff,
    messages,
  } = useStore();

  const rendererRef = useRef<MermaidRendererRef>(null);
  const [showCodeDiff, setShowCodeDiff] = useState(false);

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

  // Calculate diff elements
  const diffElements = useMemo(() => {
    if (!diffState.proposedCode || diffState.proposedCode === diagram.code) {
      return [];
    }
    return diffNodes(diagram.code, diffState.proposedCode);
  }, [diagram.code, diffState.proposedCode]);

  // What to show in the diagram
  const displayCode = diffState.proposedCode || diagram.code;
  const hasDiff = diffState.proposedCode && diffState.proposedCode !== diagram.code;

  // Set of elements that are new (added)
  const addedElements = useMemo(() => {
    return new Set(diffElements.filter(e => e.type === 'added').map(e => e.id));
  }, [diffElements]);

  // Build highlighted elements based on SVG IDs (mermaid uses flowchart-{id}-{num} format)
  const [highlightNew, setHighlightNew] = useState<Set<string>>(new Set());

  // After render, find the actual SVG element IDs for our diff elements
  useEffect(() => {
    if (!hasDiff || !rendererRef.current) return;

    const elements = rendererRef.current.getElements();
    const newSet = new Set<string>();

    elements.forEach(el => {
      // Check if this element's ID or label matches any added element
      const cleanId = el.id.replace(/^flowchart-/, '').replace(/-\d+$/, '');
      if (addedElements.has(cleanId) || addedElements.has(el.label)) {
        newSet.add(el.id);
      }
    });

    setHighlightNew(newSet);
  }, [hasDiff, addedElements, displayCode]);

  const handleAcceptAll = useCallback(() => {
    if (diffState.proposedCode) {
      setDiagramCode(diffState.proposedCode);
      clearDiff();
    }
  }, [diffState.proposedCode, setDiagramCode, clearDiff]);

  const handleRejectAll = useCallback(() => {
    clearDiff();
  }, [clearDiff]);

  // Accept individual change - for now, accept all means apply the proposed code
  const handleAcceptChange = useCallback((elementId: string) => {
    // In a more sophisticated implementation, we'd merge specific changes
    // For now, accepting any change accepts all
    handleAcceptAll();
  }, [handleAcceptAll]);

  const handleRejectChange = useCallback((elementId: string) => {
    // In a more sophisticated implementation, we'd reject specific changes
    // For now, rejecting any change rejects all
    handleRejectAll();
  }, [handleRejectAll]);

  return (
    <div className="diff-preview approach-layout">
      <div className="diagram-panel">
        <div className="panel-header">
          <h3>Diagram</h3>
          {hasDiff && (
            <div className="diff-controls">
              <span className="diff-badge">{diffElements.length} change{diffElements.length !== 1 ? 's' : ''}</span>
              <button className="accept-btn" onClick={handleAcceptAll}>
                Accept All
              </button>
              <button className="reject-btn" onClick={handleRejectAll}>
                Reject All
              </button>
            </div>
          )}
        </div>
        <div className="diagram-instructions">
          Describe changes in chat. New elements shown in green, removed in red.
        </div>

        {/* Changes list with accept/reject buttons */}
        {hasDiff && diffElements.length > 0 && (
          <div className="changes-list">
            {diffElements.map(change => (
              <div key={change.id} className={`change-item ${change.type}`}>
                <span className="change-type">
                  {change.type === 'added' ? '+' : '-'}
                </span>
                <span className="change-label">{change.label}</span>
                <div className="change-actions">
                  <button
                    className="accept-change"
                    onClick={() => handleAcceptChange(change.id)}
                    title="Accept change"
                  >
                    ✓
                  </button>
                  <button
                    className="reject-change"
                    onClick={() => handleRejectChange(change.id)}
                    title="Reject change"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <MermaidRenderer
          ref={rendererRef}
          code={displayCode}
          highlightNew={highlightNew}
        />

        {/* Code diff toggle */}
        {hasDiff && (
          <div className="code-diff">
            <div className="diff-header" onClick={() => setShowCodeDiff(!showCodeDiff)}>
              <span>Code Changes</span>
              <button className="toggle-diff">{showCodeDiff ? 'Hide' : 'Show'}</button>
            </div>
            {showCodeDiff && (
              <div className="diff-content">
                <div className="diff-side old">
                  <div className="diff-label">Current</div>
                  <pre>{diagram.code}</pre>
                </div>
                <div className="diff-side new">
                  <div className="diff-label">Proposed</div>
                  <pre>{diffState.proposedCode}</pre>
                </div>
              </div>
            )}
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
