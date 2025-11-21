import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ollamaProvider,
  openRouterProvider,
  getProvider,
  parseMermaidFromResponse,
  SYSTEM_PROMPT,
} from '../src/providers/llm-provider';
import type { LLMConfig, Message } from '../src/types';

describe('LLM Providers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('parseMermaidFromResponse', () => {
    it('should extract mermaid code from response', () => {
      const response = `Here's the updated diagram:

\`\`\`mermaid
flowchart TB
  A --> B
  B --> C
\`\`\`

I added node C to the flow.`;

      const result = parseMermaidFromResponse(response);
      expect(result).toBe('flowchart TB\n  A --> B\n  B --> C');
    });

    it('should return null if no mermaid block found', () => {
      const response = 'No diagram here, just text.';
      const result = parseMermaidFromResponse(response);
      expect(result).toBeNull();
    });

    it('should handle multiple code blocks and extract mermaid', () => {
      const response = `First some code:

\`\`\`javascript
console.log('hello');
\`\`\`

And the diagram:

\`\`\`mermaid
sequenceDiagram
  A->>B: Hello
\`\`\`

Done!`;

      const result = parseMermaidFromResponse(response);
      expect(result).toBe('sequenceDiagram\n  A->>B: Hello');
    });
  });

  describe('getProvider', () => {
    it('should return ollama provider', () => {
      const provider = getProvider('ollama');
      expect(provider.name).toBe('Ollama');
      expect(provider.supportsVision).toBe(true);
    });

    it('should return openrouter provider', () => {
      const provider = getProvider('openrouter');
      expect(provider.name).toBe('OpenRouter');
      expect(provider.supportsVision).toBe(true);
    });

    it('should throw for unknown provider', () => {
      expect(() => getProvider('unknown' as any)).toThrow('Unknown provider');
    });
  });

  describe('SYSTEM_PROMPT', () => {
    it('should contain mermaid instructions', () => {
      expect(SYSTEM_PROMPT).toContain('Mermaid');
      expect(SYSTEM_PROMPT).toContain('```mermaid');
    });

    it('should instruct about response format', () => {
      expect(SYSTEM_PROMPT).toContain('Changes made');
      expect(SYSTEM_PROMPT).toContain('Reasoning');
    });
  });

  describe('Ollama Provider', () => {
    const mockConfig: LLMConfig = {
      provider: 'ollama',
      model: 'llama3.2-vision',
      baseUrl: 'http://localhost:11434',
    };

    const mockMessages: Message[] = [
      { id: '1', role: 'user', content: 'Add a cache', timestamp: Date.now() },
    ];

    it('should send chat request to correct URL', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: { content: 'Response' } }),
      });

      await ollamaProvider.chat(mockMessages, mockConfig);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/chat',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should include system prompt in messages', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: { content: 'Response' } }),
      });

      await ollamaProvider.chat(mockMessages, mockConfig);

      const callBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
      expect(callBody.messages[0].role).toBe('system');
      expect(callBody.messages[0].content).toContain('Mermaid');
    });

    it('should throw on error response', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      });

      await expect(ollamaProvider.chat(mockMessages, mockConfig)).rejects.toThrow(
        'Ollama error'
      );
    });

    it('should send image with vision request', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: { content: 'Response' } }),
      });

      await ollamaProvider.chatWithImage(
        mockMessages,
        'data:image/png;base64,abc123',
        mockConfig
      );

      const callBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
      const lastMessage = callBody.messages[callBody.messages.length - 1];
      expect(lastMessage.images).toContain('abc123');
    });
  });

  describe('OpenRouter Provider', () => {
    const mockConfig: LLMConfig = {
      provider: 'openrouter',
      model: 'anthropic/claude-3.5-sonnet',
      apiKey: 'test-api-key',
    };

    const mockMessages: Message[] = [
      { id: '1', role: 'user', content: 'Add a cache', timestamp: Date.now() },
    ];

    it('should send request with authorization header', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'Response' } }] }),
      });

      await openRouterProvider.chat(mockMessages, mockConfig);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/chat/completions',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-api-key',
          }),
        })
      );
    });

    it('should format image as content array for vision', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'Response' } }] }),
      });

      await openRouterProvider.chatWithImage(
        mockMessages,
        'data:image/png;base64,abc123',
        mockConfig
      );

      const callBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
      const lastMessage = callBody.messages[callBody.messages.length - 1];
      expect(Array.isArray(lastMessage.content)).toBe(true);
      expect(lastMessage.content[0].type).toBe('text');
      expect(lastMessage.content[1].type).toBe('image_url');
    });

    it('should throw with error message from API', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized',
        json: async () => ({ error: { message: 'Invalid API key' } }),
      });

      await expect(openRouterProvider.chat(mockMessages, mockConfig)).rejects.toThrow(
        'Invalid API key'
      );
    });
  });
});
