import React, { useCallback, useState, useEffect } from 'react';
import mermaid from 'mermaid';
import { useStore } from '../../store';
import { ChatInterface } from '../../components/ChatInterface';
import './VersionTimeline.css';

export const VersionTimeline: React.FC = () => {
  const {
    diagram,
    timelineState,
    goToVersion,
    createBranch,
    addVersion,
  } = useStore();

  const [diagramSvg, setDiagramSvg] = useState('');
  const [compareSvg, setCompareSvg] = useState('');
  const [compareVersionId, setCompareVersionId] = useState<string | null>(null);
  const [showBranchInput, setShowBranchInput] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');

  // Render current diagram
  useEffect(() => {
    const render = async () => {
      if (!diagram.code) return;
      try {
        const { svg } = await mermaid.render(`timeline-${Date.now()}`, diagram.code);
        setDiagramSvg(svg);
      } catch (e) {
        console.error('Error rendering diagram:', e);
      }
    };
    render();
  }, [diagram.code]);

  // Render comparison diagram
  useEffect(() => {
    const render = async () => {
      if (!compareVersionId) {
        setCompareSvg('');
        return;
      }
      const version = timelineState.versions.find((v) => v.id === compareVersionId);
      if (!version) return;
      try {
        const { svg } = await mermaid.render(`compare-${Date.now()}`, version.code);
        setCompareSvg(svg);
      } catch (e) {
        console.error('Error rendering comparison:', e);
      }
    };
    render();
  }, [compareVersionId, timelineState.versions]);

  const handleVersionClick = useCallback(
    (versionId: string) => {
      goToVersion(versionId);
    },
    [goToVersion]
  );

  const handleCompareClick = useCallback((versionId: string) => {
    setCompareVersionId((prev) => (prev === versionId ? null : versionId));
  }, []);

  const handleCreateBranch = useCallback(() => {
    if (newBranchName.trim()) {
      createBranch(newBranchName.trim());
      setNewBranchName('');
      setShowBranchInput(false);
    }
  }, [newBranchName, createBranch]);

  const currentVersion = timelineState.versions.find(
    (v) => v.id === timelineState.currentVersionId
  );

  const currentBranch = timelineState.branches.find(
    (b) => b.id === timelineState.currentBranchId
  );

  const buildContextInfo = useCallback((): string => {
    return `Each change you suggest will create a new version in the timeline. The user can browse through versions and create branches to explore alternatives.`;
  }, []);

  return (
    <div className="version-timeline approach-layout">
      <div className="diagram-panel">
        <div className="panel-header">
          <h3>Diagram</h3>
          <div className="timeline-controls">
            <span className="version-badge">
              v{timelineState.versions.findIndex((v) => v.id === timelineState.currentVersionId) + 1}
              /{timelineState.versions.length}
            </span>
            <span className="branch-badge">
              {currentBranch?.name || 'main'}
            </span>
            {!showBranchInput ? (
              <button className="branch-btn" onClick={() => setShowBranchInput(true)}>
                + Branch
              </button>
            ) : (
              <div className="branch-input">
                <input
                  type="text"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  placeholder="Branch name..."
                  autoFocus
                />
                <button onClick={handleCreateBranch}>Create</button>
                <button onClick={() => setShowBranchInput(false)}>Cancel</button>
              </div>
            )}
          </div>
        </div>
        <div className="diagram-instructions">
          Each change creates a version. Scrub timeline, compare, or branch.
        </div>

        {/* Diagram view */}
        <div className={`diagram-area ${compareVersionId ? 'comparing' : ''}`}>
          <div className="diagram-view current-view">
            {currentVersion && (
              <div className="version-info">
                <span className="version-label">Current</span>
                <span className="version-desc">{currentVersion.description}</span>
              </div>
            )}
            <div
              className="diagram-content"
              dangerouslySetInnerHTML={{ __html: diagramSvg }}
            />
          </div>

          {compareVersionId && compareSvg && (
            <div className="diagram-view compare-view">
              <div className="version-info">
                <span className="version-label">Compare</span>
                <button className="close-compare" onClick={() => setCompareVersionId(null)}>
                  &times;
                </button>
              </div>
              <div
                className="diagram-content"
                dangerouslySetInnerHTML={{ __html: compareSvg }}
              />
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="timeline">
          <div className="timeline-track">
            {timelineState.versions.map((version, idx) => (
              <div
                key={version.id}
                className={`timeline-node ${
                  version.id === timelineState.currentVersionId ? 'active' : ''
                } ${version.id === compareVersionId ? 'comparing' : ''}`}
                onClick={() => handleVersionClick(version.id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  handleCompareClick(version.id);
                }}
                title={`v${idx + 1}: ${version.description}\nRight-click to compare`}
              >
                <div className="node-dot" />
                <div className="node-label">v{idx + 1}</div>
              </div>
            ))}
          </div>
          <div className="timeline-hint">
            Click to go to version, right-click to compare
          </div>
        </div>
      </div>

      <div className="chat-panel">
        <ChatInterface contextInfo={buildContextInfo()} />
      </div>
    </div>
  );
};

export default VersionTimeline;
