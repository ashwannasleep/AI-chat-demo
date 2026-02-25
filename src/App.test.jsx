import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, test, expect, vi } from 'vitest';
import App from './App';
import { chat } from './lib/openaiClient';

vi.mock('./lib/openaiClient', () => ({
  chat: vi.fn(),
}));

const mockChat = vi.mocked(chat);

beforeEach(() => {
  localStorage.clear();
  mockChat.mockReset();
  mockChat.mockResolvedValue({
    reply: 'Mock assistant reply.',
    meta: {
      source: 'mock_local',
      fallbackReason: 'Live API unavailable. Using local smart fallback.',
    },
  });
});

test('renders title', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /AI Chat\s*Demo/i })).toBeInTheDocument();
});

test('restores session from localStorage', () => {
  localStorage.setItem('ai-chat-demo.session.v1', JSON.stringify({
    smartMode: false,
    messages: [
      { id: 'u1', role: 'user', content: 'restored user message' },
      { id: 'a1', role: 'assistant', content: 'restored assistant message' },
    ],
  }));

  render(<App />);

  expect(screen.getByText('restored assistant message')).toBeInTheDocument();
  expect(screen.getByLabelText(/smart mode/i)).not.toBeChecked();
});

test('quick action sends follow-up prompt', async () => {
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /Explain deeper/i }));

  await waitFor(() => expect(mockChat).toHaveBeenCalledTimes(1));

  const sentMessages = mockChat.mock.calls[0][0];
  const lastMessage = sentMessages[sentMessages.length - 1];
  expect(lastMessage.role).toBe('user');
  expect(lastMessage.content).toMatch(/Go deeper on your previous answer/i);
});

test('streams assistant response chunks into the UI', async () => {
  mockChat.mockImplementation(async (_messages, options = {}) => {
    options.onChunk?.('Part ');
    await Promise.resolve();
    options.onChunk?.('one');
    return {
      reply: 'Part one',
      meta: {
        source: 'mock_local',
        fallbackReason: 'stream fallback',
      },
    };
  });

  render(<App />);

  fireEvent.change(screen.getByLabelText(/message input/i), { target: { value: 'hello stream' } });
  fireEvent.click(screen.getByRole('button', { name: /Transmit/i }));

  expect(await screen.findByText(/Part one/i)).toBeInTheDocument();
  expect(await screen.findByText(/stream fallback/i)).toBeInTheDocument();
});
