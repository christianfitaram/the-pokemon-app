const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "\\.(css|less|sass|scss)$": "<rootDir>/test/styleMock.js",
  },
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/cypress/"],
};

module.exports = createJestConfig(customJestConfig);
