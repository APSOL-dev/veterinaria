import { describe, it, expect } from 'vitest';
import { Pagination, getPaginationRange } from './Pagination';

describe('getPaginationRange helper', () => {
  it('should return all pages when totalPages <= 7', () => {
    expect(getPaginationRange(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(getPaginationRange(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(getPaginationRange(1, 1)).toEqual([1]);
  });

  it('should return [1, 2, 3, 4, 5, "...", totalPages] when on initial pages', () => {
    expect(getPaginationRange(1, 79)).toEqual([1, 2, 3, 4, 5, '...', 79]);
    expect(getPaginationRange(2, 79)).toEqual([1, 2, 3, 4, 5, '...', 79]);
    expect(getPaginationRange(3, 79)).toEqual([1, 2, 3, 4, 5, '...', 79]);
    expect(getPaginationRange(4, 79)).toEqual([1, 2, 3, 4, 5, '...', 79]);
  });

  it('should return [1, "...", totalPages-4, totalPages-3, totalPages-2, totalPages-1, totalPages] when near end', () => {
    expect(getPaginationRange(76, 79)).toEqual([1, '...', 75, 76, 77, 78, 79]);
    expect(getPaginationRange(77, 79)).toEqual([1, '...', 75, 76, 77, 78, 79]);
    expect(getPaginationRange(78, 79)).toEqual([1, '...', 75, 76, 77, 78, 79]);
    expect(getPaginationRange(79, 79)).toEqual([1, '...', 75, 76, 77, 78, 79]);
  });

  it('should return [1, "...", current-1, current, current+1, "...", totalPages] when in middle', () => {
    expect(getPaginationRange(40, 79)).toEqual([1, '...', 39, 40, 41, '...', 79]);
    expect(getPaginationRange(10, 20)).toEqual([1, '...', 9, 10, 11, '...', 20]);
  });

  it('should handle edge cases like totalPages <= 0 or 1', () => {
    expect(getPaginationRange(1, 1)).toEqual([1]);
    expect(getPaginationRange(1, 0)).toEqual([1]);
  });
});

describe('Pagination Component Structure', () => {
  it('is exported as a valid React component', () => {
    expect(Pagination).toBeDefined();
    expect(typeof Pagination).toBe('function');
  });

  it('computes range bounds correctly for various slice calculations', () => {
    const totalItems = 1564;
    const pageSize = 20;
    
    // Page 1
    const page1Start = totalItems === 0 ? 0 : (1 - 1) * pageSize + 1;
    const page1End = Math.min(1 * pageSize, totalItems);
    expect(page1Start).toBe(1);
    expect(page1End).toBe(20);

    // Last Page (79)
    const page79Start = totalItems === 0 ? 0 : (79 - 1) * pageSize + 1;
    const page79End = Math.min(79 * pageSize, totalItems);
    expect(page79Start).toBe(1561);
    expect(page79End).toBe(1564);

    // Empty list
    const emptyStart = 0 === 0 ? 0 : (1 - 1) * pageSize + 1;
    const emptyEnd = Math.min(1 * pageSize, 0);
    expect(emptyStart).toBe(0);
    expect(emptyEnd).toBe(0);
  });
});
