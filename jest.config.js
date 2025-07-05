// jest.config.js

// This Jest configuration is designed for a TypeScript project using ESM modules with ts-jest.

import { createDefaultEsmPreset } from 'ts-jest';

const presetConfig = createDefaultEsmPreset({
  tsconfig: './tsconfig.jest.json',
});

const jestConfig = {
  ...presetConfig,
  testEnvironment: 'node',
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' }, // Handle ESM imports by removing the .js extension
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/vitest/'],
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/', '/vitest/'],
  maxWorkers: '100%',
  forceExit: true, // Force Jest to exit to prevent hanging on open handles from matterbridge framework
};

export default jestConfig;
