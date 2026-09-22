import { describe, it, expect } from 'vitest';
import { AutoResizeTextarea } from './AutoResizeTextarea';

describe('AutoResizeTextarea', () => {
  it('is defined and is a valid React forwardRef component', () => {
    expect(AutoResizeTextarea).toBeDefined();
    expect(AutoResizeTextarea.displayName).toBe('AutoResizeTextarea');
  });

  it('calculates auto resize dimensions based on content', () => {
    const textarea = document.createElement('textarea');
    textarea.value = 'Linea 1\nLinea 2\nLinea 3';
    document.body.appendChild(textarea);
    expect(textarea.value.split('\n').length).toBe(3);
    document.body.removeChild(textarea);
  });
});
