import { describe, it, expect } from 'vitest';
import {
  slugify,
  isValidSlug,
  parseTags,
  targetingSummary,
  GRID_TYPES,
  GRID_TYPE_LABEL,
  CONTENT_TYPES,
  CONTENT_TYPE_LABEL,
  CODING_LANGUAGES,
  CODING_LANGUAGE_LABEL,
  MOCK_TEST_CATEGORIES,
} from '@/lib/learning/constants';

describe('learning/constants slugify', () => {
  it('lower-cases and hyphenates', () => {
    expect(slugify('Java Tutorial')).toBe('java-tutorial');
    expect(slugify('  OOP: Inheritance & Polymorphism ')).toBe('oop-inheritance-polymorphism');
  });

  it('collapses runs of non-alphanumerics and trims edge hyphens', () => {
    expect(slugify('C++  //  Notes!!!')).toBe('c-notes');
    expect(slugify('---edge---')).toBe('edge');
  });

  it('returns an empty string when nothing is usable', () => {
    expect(slugify('   ')).toBe('');
    expect(slugify('!!!')).toBe('');
  });

  it('caps length at 80 chars', () => {
    expect(slugify('a'.repeat(200)).length).toBe(80);
  });
});

describe('learning/constants isValidSlug', () => {
  it('accepts hyphen-separated alphanumerics', () => {
    expect(isValidSlug('java')).toBe(true);
    expect(isValidSlug('java-tutorial-2')).toBe(true);
  });

  it('rejects leading/trailing/double hyphens, spaces and caps', () => {
    for (const bad of ['-java', 'java-', 'java--x', 'Java', 'java tutorial', 'java_x', '']) {
      expect(isValidSlug(bad)).toBe(false);
    }
  });

  it('every slugify output is a valid slug (or empty)', () => {
    for (const s of ['Hello World', 'A.B.C', '汉字 test', '2024 Roadmap!']) {
      const out = slugify(s);
      if (out) expect(isValidSlug(out)).toBe(true);
    }
  });
});

describe('learning/constants parseTags', () => {
  it('splits on commas and newlines, trims, de-dupes, drops empties', () => {
    expect(parseTags('arrays, two-pointers,, arrays\n  hashing ')).toEqual(['arrays', 'two-pointers', 'hashing']);
  });
  it('caps at 30 tags', () => {
    const raw = Array.from({ length: 50 }, (_, i) => `t${i}`).join(',');
    expect(parseTags(raw)).toHaveLength(30);
  });
  it('returns [] for blank input', () => {
    expect(parseTags('')).toEqual([]);
    expect(parseTags('  , ,\n')).toEqual([]);
  });
});

describe('learning/constants targetingSummary', () => {
  it('describes global / course / branch / year', () => {
    expect(targetingSummary({ target_type: 'global' })).toBe('Global');
    expect(targetingSummary({ target_type: 'course', target_course_name: 'B.Tech' })).toBe('B.Tech');
    expect(
      targetingSummary({ target_type: 'branch', target_course_name: 'B.Tech', target_branch_names: ['CSE', 'IT'] }),
    ).toBe('B.Tech · 2 branches');
    expect(
      targetingSummary({ target_type: 'branch', target_branch_names: ['CSE'], target_year_label: '3rd Year' }),
    ).toBe('1 branch · 3rd Year');
    expect(targetingSummary({ target_type: 'global', target_year_label: '2nd Year' })).toBe('Global · 2nd Year');
  });
});

describe('learning/constants type enums', () => {
  it('every grid type has a label', () => {
    for (const t of GRID_TYPES) expect(typeof GRID_TYPE_LABEL[t]).toBe('string');
  });
  it('every content type has a label', () => {
    for (const t of CONTENT_TYPES) expect(typeof CONTENT_TYPE_LABEL[t]).toBe('string');
  });
  it('grid types are the two generic tree kinds (specialised grids removed by 036/0064)', () => {
    expect([...GRID_TYPES]).toEqual(['content', 'custom']);
  });
});

describe('learning/constants topic-practice enums (0048/025)', () => {
  it('every coding language has a label and mirrors the website compiler set', () => {
    expect([...CODING_LANGUAGES].sort()).toEqual(['c', 'cpp', 'java', 'javascript', 'python']);
    for (const l of CODING_LANGUAGES) expect(typeof CODING_LANGUAGE_LABEL[l]).toBe('string');
  });
  it('mock-test categories match the practice_tests CHECK', () => {
    expect([...MOCK_TEST_CATEGORIES]).toEqual(['aptitude', 'logical', 'verbal', 'hr', 'company']);
  });
  it('a coding-problem slug derived from a title is a valid slug', () => {
    expect(isValidSlug(slugify('Print Hello World'))).toBe(true);
    expect(isValidSlug(slugify('Add Two Numbers!'))).toBe(true);
  });
});
