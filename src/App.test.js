import { act, render, screen } from '@testing-library/react';
import App from './App';

test('renders Drill4J UI h1', () => {
  render(<App />);
  const linkElement = screen.getByText(/Drill4J UI/i);
  expect(linkElement).toBeInTheDocument();
});
