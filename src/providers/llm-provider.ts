import type { Message, LLMConfig, LLMProvider } from '../types';

// System prompt for diagram evolution
export const SYSTEM_PROMPT = `You are an expert system architect helping to evolve system design diagrams.
You communicate through Mermaid diagram syntax and clear explanations.

When asked to modify a diagram:
1. Analyze the current diagram structure
2. Understand the user's intent from their message and any visual annotations
3. Provide the complete updated Mermaid code
4. Explain what changes you made and why

Format your response as:
\`\`\`mermaid
[complete updated diagram code]
\`\`\`

**Changes made:**
- [bullet points explaining changes]

**Reasoning:**
[brief explanation of architectural decisions]`;

// Ollama provider implementation
export const ollamaProvider: LLMProvider = {
  name: 'Ollama',
  supportsVision: true,

  async chat(messages: Message[], config: LLMConfig): Promise<string> {
    const baseUrl = config.baseUrl || 'http://localhost:11434';

    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model || 'llama3.2-vision',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages.map(m => ({ role: m.role, content: m.content }))
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.message?.content || '';
  },

  async chatWithImage(messages: Message[], imageBase64: string, config: LLMConfig): Promise<string> {
    const baseUrl = config.baseUrl || 'http://localhost:11434';

    // Format messages with image for vision model
    const formattedMessages = messages.map((m, idx) => {
      if (idx === messages.length - 1 && m.role === 'user') {
        return {
          role: m.role,
          content: m.content,
          images: [imageBase64.replace(/^data:image\/\w+;base64,/, '')],
        };
      }
      return { role: m.role, content: m.content };
    });

    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model || 'llama3.2-vision',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...formattedMessages
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.message?.content || '';
  },
};

// OpenRouter provider implementation
export const openRouterProvider: LLMProvider = {
  name: 'OpenRouter',
  supportsVision: true,

  async chat(messages: Message[], config: LLMConfig): Promise<string> {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'HTTP-Referer': window.location.origin,
      },
      body: JSON.stringify({
        model: config.model || 'anthropic/claude-3.5-sonnet',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages.map(m => ({ role: m.role, content: m.content }))
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenRouter error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  },

  async chatWithImage(messages: Message[], imageBase64: string, config: LLMConfig): Promise<string> {
    // Format the last user message to include the image
    const formattedMessages = messages.map((m, idx) => {
      if (idx === messages.length - 1 && m.role === 'user') {
        return {
          role: m.role,
          content: [
            { type: 'text', text: m.content },
            {
              type: 'image_url',
              image_url: {
                url: imageBase64.startsWith('data:')
                  ? imageBase64
                  : `data:image/png;base64,${imageBase64}`,
              },
            },
          ],
        };
      }
      return { role: m.role, content: m.content };
    });

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'HTTP-Referer': window.location.origin,
      },
      body: JSON.stringify({
        model: config.model || 'anthropic/claude-3.5-sonnet',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...formattedMessages
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenRouter error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  },
};

// Provider factory
export function getProvider(type: 'ollama' | 'openrouter'): LLMProvider {
  switch (type) {
    case 'ollama':
      return ollamaProvider;
    case 'openrouter':
      return openRouterProvider;
    default:
      throw new Error(`Unknown provider: ${type}`);
  }
}

// Parse Mermaid code from LLM response
export function parseMermaidFromResponse(response: string): string | null {
  const mermaidMatch = response.match(/```mermaid\n([\s\S]*?)\n```/);
  return mermaidMatch ? mermaidMatch[1].trim() : null;
}
