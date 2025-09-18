import { render, screen } from '@testing-library/react';
import { test, expect } from 'vitest';
import App from './App';

test('renders title', () => {
  render(<App />);
  expect(screen.getByText(/AI Chat Demo/i)).toBeInTheDocument();
});
