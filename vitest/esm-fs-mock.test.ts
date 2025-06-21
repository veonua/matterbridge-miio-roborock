// src\esm-fs-unstable-mock.test.ts

// ESM unstable mock of 'node:fs'

import type { PathLike } from 'node:fs';

import { vi, describe, beforeEach, afterAll } from 'vitest';

vi.mock('node:fs', async () => {
  const originalModule = await vi.importActual<typeof import('node:fs')>('node:fs');
  return {
    ...originalModule,

    existsSync: vi.fn<typeof existsSync>((path: PathLike) => {
      return originalModule.existsSync(path);
    }),
  };
});
const { existsSync, promises } = await import('node:fs');

describe('ESM module node:fs mock test', () => {
  it('should call the original module', async () => {
    const not_a_file = (await import('./esm-fs-mock.ts')).not_a_file;
    expect(not_a_file).toBeDefined();

    expect(not_a_file()).toBe(false);
  });

  it('should call the mocked module', async () => {
    const not_a_file = (await import('./esm-fs-mock.ts')).not_a_file;
    expect(not_a_file).toBeDefined();

    vi.mocked(existsSync).mockImplementation((path: PathLike) => {
      return true;
    });
    expect(not_a_file()).toBe(true);
  });
});
