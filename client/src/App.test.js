/* global describe, it, expect, test */

import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Kalooki Game', () => {
  render(<App />);
  const linkElement = screen.getByText('Kalooki Game v0.3');
  expect(linkElement).toBeInTheDocument();
});
