import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { getProvider, parseMermaidFromResponse } from '../providers/llm-provider';
import './ChatInterface.css';

interface ChatInterfaceProps {
  onSendWithImage?: () => Promise<string>;
  contextInfo?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  onSendWithImage,
  contextInfo,
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    messages,
    isLoading,
    addMessage,
    setLoading,
    llmConfig,
    diagram,
    setDiagramCode,
    currentExample,
    currentApproach,
    addVersion,
  } = useStore();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');

    // Build context message
    let contextMessage = userMessage;
    if (contextInfo) {
      contextMessage = `${contextInfo}\n\nUser request: ${userMessage}`;
    }
    contextMessage += `\n\nCurrent diagram:\n\`\`\`mermaid\n${diagram.code}\n\`\`\``;

    addMessage({ role: 'user', content: userMessage });
    setLoading(true);

    try {
      const provider = getProvider(llmConfig.provider);
      let response: string;

      // Capture image if approach uses visual context
      if (onSendWithImage && ['marker-mode', 'annotation-layer'].includes(currentApproach)) {
        const imageBase64 = await onSendWithImage();
        if (imageBase64) {
          response = await provider.chatWithImage(
            [...messages, { id: '', role: 'user', content: contextMessage, timestamp: 0 }],
            imageBase64,
            llmConfig
          );
        } else {
          response = await provider.chat(
            [...messages, { id: '', role: 'user', content: contextMessage, timestamp: 0 }],
            llmConfig
          );
        }
      } else {
        response = await provider.chat(
          [...messages, { id: '', role: 'user', content: contextMessage, timestamp: 0 }],
          llmConfig
        );
      }

      addMessage({ role: 'assistant', content: response });

      // Extract and apply mermaid code if present
      const newMermaidCode = parseMermaidFromResponse(response);
      if (newMermaidCode) {
        // For timeline approach, create a new version
        if (currentApproach === 'version-timeline') {
          addVersion(newMermaidCode, userMessage.slice(0, 50));
        } else {
          setDiagramCode(newMermaidCode);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      addMessage({
        role: 'assistant',
        content: `Error: ${errorMessage}\n\nPlease check your LLM configuration and try again.`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-interface">
      {/* Messages area */}
      <div className="messages-container">
        {messages.length === 0 && (
          <div className="empty-chat">
            <h3>Start a conversation</h3>
            <p>Describe how you'd like to evolve the diagram.</p>
            {currentExample && currentExample.suggestedPrompts.length > 0 && (
              <div className="suggested-prompts">
                <p className="prompts-label">Suggested prompts:</p>
                {currentExample.suggestedPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    className="prompt-suggestion"
                    onClick={() => setInput(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`message ${message.role}`}>
            <div className="message-header">
              <span className="role-badge">
                {message.role === 'user' ? 'You' : 'Assistant'}
              </span>
              <span className="timestamp">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="message-content">
              <MessageContent content={message.content} />
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="message assistant loading">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form className="input-container" onSubmit={handleSubmit}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe how to evolve the diagram..."
          disabled={isLoading}
          rows={3}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <button type="submit" disabled={isLoading || !input.trim()}>
          {isLoading ? 'Thinking...' : 'Send'}
        </button>
      </form>
    </div>
  );
};

// Component to render message content with code blocks
const MessageContent: React.FC<{ content: string }> = ({ content }) => {
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <>
      {parts.map((part, idx) => {
        if (part.startsWith('```')) {
          const match = part.match(/```(\w*)\n?([\s\S]*?)```/);
          if (match) {
            const [, language, code] = match;
            return (
              <pre key={idx} className={`code-block ${language}`}>
                <code>{code.trim()}</code>
              </pre>
            );
          }
        }
        return (
          <span key={idx} className="text-content">
            {part.split('\n').map((line, lineIdx) => (
              <React.Fragment key={lineIdx}>
                {line}
                {lineIdx < part.split('\n').length - 1 && <br />}
              </React.Fragment>
            ))}
          </span>
        );
      })}
    </>
  );
};

export default ChatInterface;
