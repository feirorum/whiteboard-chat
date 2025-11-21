import React, { useState } from 'react';
import { useStore } from '../store';
import { allExamples } from '../examples';
import type { ApproachType, ApproachInfo } from '../types';
import './Header.css';

const approaches: ApproachInfo[] = [
  {
    id: 'marker-mode',
    name: 'Marker Mode',
    description: 'Click elements to mark them, then describe changes',
    icon: '🎯',
  },
  {
    id: 'annotation-layer',
    name: 'Annotation Layer',
    description: 'Draw annotations over the diagram',
    icon: '✏️',
  },
  {
    id: 'diff-preview',
    name: 'Diff Preview',
    description: 'See proposed changes before applying',
    icon: '📊',
  },
  {
    id: 'ghost-suggestions',
    name: 'Ghost Suggestions',
    description: 'AI suggests additions as transparent overlays',
    icon: '👻',
  },
  {
    id: 'version-timeline',
    name: 'Version Timeline',
    description: 'Track changes over time, branch and explore',
    icon: '📅',
  },
];

export const Header: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);
  const {
    currentApproach,
    setCurrentApproach,
    currentExample,
    setCurrentExample,
    llmConfig,
    setLLMConfig,
    clearMessages,
  } = useStore();

  const handleApproachChange = (approach: ApproachType) => {
    setCurrentApproach(approach);
  };

  const handleExampleChange = (exampleId: string) => {
    const example = allExamples.find((e) => e.id === exampleId);
    setCurrentExample(example || null);
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <h1 className="app-title">Whiteboard Chat</h1>
        <span className="app-subtitle">Agent-Assisted Diagram Evolution</span>
      </div>

      <div className="header-controls">
        {/* Approach Selector */}
        <div className="control-group">
          <label>Approach:</label>
          <select
            value={currentApproach}
            onChange={(e) => handleApproachChange(e.target.value as ApproachType)}
          >
            {approaches.map((approach) => (
              <option key={approach.id} value={approach.id}>
                {approach.icon} {approach.name}
              </option>
            ))}
          </select>
        </div>

        {/* Example Selector */}
        <div className="control-group">
          <label>Example:</label>
          <select
            value={currentExample?.id || ''}
            onChange={(e) => handleExampleChange(e.target.value)}
          >
            <option value="">Select an example...</option>
            {allExamples.map((example) => (
              <option key={example.id} value={example.id}>
                {example.name}
              </option>
            ))}
          </select>
        </div>

        {/* Settings Toggle */}
        <button
          className="settings-btn"
          onClick={() => setShowSettings(!showSettings)}
        >
          ⚙️ Settings
        </button>

        {/* Clear Chat */}
        <button className="clear-btn" onClick={clearMessages}>
          🗑️ Clear Chat
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="settings-panel">
          <h3>LLM Configuration</h3>

          <div className="setting-row">
            <label>Provider:</label>
            <select
              value={llmConfig.provider}
              onChange={(e) =>
                setLLMConfig({ provider: e.target.value as 'ollama' | 'openrouter' })
              }
            >
              <option value="ollama">Ollama (Local)</option>
              <option value="openrouter">OpenRouter (Cloud)</option>
            </select>
          </div>

          {llmConfig.provider === 'ollama' && (
            <>
              <div className="setting-row">
                <label>Base URL:</label>
                <input
                  type="text"
                  value={llmConfig.baseUrl}
                  onChange={(e) => setLLMConfig({ baseUrl: e.target.value })}
                  placeholder="http://localhost:11434"
                />
              </div>
              <div className="setting-row">
                <label>Model:</label>
                <input
                  type="text"
                  value={llmConfig.model}
                  onChange={(e) => setLLMConfig({ model: e.target.value })}
                  placeholder="llama3.2-vision"
                />
              </div>
            </>
          )}

          {llmConfig.provider === 'openrouter' && (
            <>
              <div className="setting-row">
                <label>API Key:</label>
                <input
                  type="password"
                  value={llmConfig.apiKey}
                  onChange={(e) => setLLMConfig({ apiKey: e.target.value })}
                  placeholder="sk-or-..."
                />
              </div>
              <div className="setting-row">
                <label>Model:</label>
                <select
                  value={llmConfig.model}
                  onChange={(e) => setLLMConfig({ model: e.target.value })}
                >
                  <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</option>
                  <option value="anthropic/claude-3-opus">Claude 3 Opus</option>
                  <option value="openai/gpt-4-vision-preview">GPT-4 Vision</option>
                  <option value="openai/gpt-4o">GPT-4o</option>
                  <option value="google/gemini-pro-vision">Gemini Pro Vision</option>
                </select>
              </div>
            </>
          )}

          <button className="close-settings" onClick={() => setShowSettings(false)}>
            Close
          </button>
        </div>
      )}

      {/* Current Approach Description */}
      <div className="approach-description">
        {approaches.find((a) => a.id === currentApproach)?.description}
      </div>
    </header>
  );
};

export default Header;
