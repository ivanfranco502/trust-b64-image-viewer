import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

// 1x1 transparent PNG, 68 bytes.
const PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

async function pasteAndPreview(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.click(screen.getByLabelText('Input'));
  await user.paste(text);
  await user.click(screen.getByRole('button', { name: 'Preview' }));
}

describe('<App />', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('shows the image with its type and size when Preview is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);

    await pasteAndPreview(user, PNG);

    const img = screen.getByRole('img', { name: 'Decoded image preview' });
    expect(img).toHaveAttribute('src', `data:image/png;base64,${PNG}`);
    expect(screen.getByText('image/png')).toBeInTheDocument();
    expect(screen.getByText('68 B')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('does not preview until Preview is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByLabelText('Input'));
    await user.paste(PNG);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('shows the dimensions once the image loads', async () => {
    const user = userEvent.setup();
    render(<App />);

    await pasteAndPreview(user, `data:image/png;base64,${PNG}`);

    const img = screen.getByRole('img', { name: 'Decoded image preview' });
    Object.defineProperty(img, 'naturalWidth', { value: 640 });
    Object.defineProperty(img, 'naturalHeight', { value: 480 });
    fireEvent.load(img);

    expect(screen.getByText('640 × 480 px')).toBeInTheDocument();
  });

  it('shows an error and no image for invalid base64', async () => {
    const user = userEvent.setup();
    render(<App />);

    await pasteAndPreview(user, 'not*base64');

    expect(screen.getByRole('alert')).toHaveTextContent(/not valid base64/);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('shows an error and removes the image when the browser cannot render it', async () => {
    const user = userEvent.setup();
    render(<App />);

    await pasteAndPreview(user, `data:image/png;base64,${btoa('not really a png')}`);
    fireEvent.error(screen.getByRole('img', { name: 'Decoded image preview' }));

    expect(screen.getByRole('alert')).toHaveTextContent(/cannot display this image/);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('clears a previous error when a preview succeeds', async () => {
    const user = userEvent.setup();
    render(<App />);

    await pasteAndPreview(user, 'not*base64');
    expect(screen.getByRole('alert')).toBeInTheDocument();

    await user.clear(screen.getByLabelText('Input'));
    await pasteAndPreview(user, PNG);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Decoded image preview' })).toBeInTheDocument();
  });

  it('renders a footer with a link to the build commit', () => {
    render(<App />);
    const link = screen.getByRole('link', { name: /[0-9a-f]{7}/ });
    expect(link).toHaveAttribute('href', expect.stringMatching(/\/commit\/[0-9a-f]+$/));
  });

  it('starts in light mode and toggles to dark when the toggle is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    await user.click(screen.getByRole('button', { name: /switch to dark mode/i }));

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(screen.getByRole('button', { name: /switch to light mode/i })).toBeInTheDocument();
  });

  it('restores the persisted theme on mount', () => {
    localStorage.setItem('theme', 'dark');
    render(<App />);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(screen.getByRole('button', { name: /switch to light mode/i })).toBeInTheDocument();
  });
});
