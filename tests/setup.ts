import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock mermaid
vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue({
      svg: '<svg data-testid="mermaid-svg"><g class="node" id="node1"><rect/><text class="nodeLabel">Test Node</text></g></svg>',
    }),
  },
}));

// Mock html-to-image
vi.mock('html-to-image', () => ({
  toPng: vi.fn().mockResolvedValue('data:image/png;base64,mockImageData'),
}));

// Mock fetch for LLM providers
global.fetch = vi.fn();

// Helper to reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});

// Helper to mock successful LLM response
export function mockLLMResponse(content: string) {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      message: { content },
      choices: [{ message: { content } }],
    }),
  });
}

// Helper to mock failed LLM response
export function mockLLMError(message: string) {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    ok: false,
    statusText: message,
    json: async () => ({ error: { message } }),
  });
}
