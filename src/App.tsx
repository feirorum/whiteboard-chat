import React from 'react';
import { useStore } from './store';
import { Header } from './components';
import {
  MarkerMode,
  AnnotationLayer,
  DiffPreview,
  GhostSuggestions,
  VersionTimeline,
} from './approaches';
import './App.css';

const App: React.FC = () => {
  const { currentApproach, currentExample } = useStore();

  const renderApproach = () => {
    switch (currentApproach) {
      case 'marker-mode':
        return <MarkerMode />;
      case 'annotation-layer':
        return <AnnotationLayer />;
      case 'diff-preview':
        return <DiffPreview />;
      case 'ghost-suggestions':
        return <GhostSuggestions />;
      case 'version-timeline':
        return <VersionTimeline />;
      default:
        return <MarkerMode />;
    }
  };

  return (
    <div className="app">
      <Header />
      <main className="app-main">
        {!currentExample ? (
          <div className="no-example-selected">
            <h2>Welcome to Whiteboard Chat</h2>
            <p>Select an example scenario from the header to begin exploring agent-assisted diagram evolution.</p>
            <div className="approach-preview">
              <h3>Available Approaches</h3>
              <ul>
                <li>
                  <strong>Marker Mode:</strong> Click on diagram elements to mark them, then describe what changes you want.
                </li>
                <li>
                  <strong>Annotation Layer:</strong> Draw circles, arrows, and notes over the diagram to communicate intent visually.
                </li>
                <li>
                  <strong>Diff Preview:</strong> See proposed changes side-by-side before accepting them.
                </li>
                <li>
                  <strong>Ghost Suggestions:</strong> AI suggestions appear as transparent overlays you can accept or dismiss.
                </li>
                <li>
                  <strong>Version Timeline:</strong> Track every change as a version, compare, and branch to explore alternatives.
                </li>
              </ul>
            </div>
          </div>
        ) : (
          renderApproach()
        )}
      </main>
    </div>
  );
};

export default App;
