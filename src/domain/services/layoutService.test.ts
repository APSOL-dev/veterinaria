import { describe, it, expect } from 'vitest';
import { 
  getSidebarWidthClass, 
  getMainPaddingClass, 
  calculateWorkspaceLayout 
} from './layoutService';

describe('layoutService', () => {
  it('getSidebarWidthClass should return w-16 when collapsed and w-64 when expanded', () => {
    expect(getSidebarWidthClass(true)).toBe('w-16');
    expect(getSidebarWidthClass(false)).toBe('w-64');
  });

  it('getMainPaddingClass should return pl-16 when collapsed and pl-64 when expanded', () => {
    expect(getMainPaddingClass(true)).toBe('pl-16');
    expect(getMainPaddingClass(false)).toBe('pl-64');
  });

  it('calculateWorkspaceLayout should return exact pixel widths without gap', () => {
    const collapsedLayout = calculateWorkspaceLayout(true, 1400);
    expect(collapsedLayout.sidebarWidthPx).toBe(64);
    expect(collapsedLayout.mainPaddingPx).toBe(64);
    expect(collapsedLayout.hasGap).toBe(false);

    const expandedLayout = calculateWorkspaceLayout(false, 1400);
    expect(expandedLayout.sidebarWidthPx).toBe(256);
    expect(expandedLayout.mainPaddingPx).toBe(256);
    expect(expandedLayout.hasGap).toBe(false);
  });
});
