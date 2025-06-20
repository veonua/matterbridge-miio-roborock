// jest.config.js

// This Jest configuration is designed for a TypeScript project using ESM modules with ts-jest.

import { createDefaultEsmPreset } from 'ts-jest';

const presetConfig = createDefaultEsmPreset({
  tsconfig: './tsconfig.jest.json',
});

const jestConfig = {
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/'],
  maxWorkers: '100%',
  ...presetConfig,
};

export default jestConfig;
