/** @type {import('jest').Config} */
const config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/__tests__"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          // Relax some strict options for tests only
          strict: false,
          esModuleInterop: true,
          moduleResolution: "node",
        },
      },
    ],
  },
  collectCoverageFrom: [
    "lib/**/*.ts",
    "middleware/**/*.ts",
    "!lib/prisma.ts",
    "!**/*.d.ts",
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testPathIgnorePatterns: ["/node_modules/", "/.next/"],
};

module.exports = config;
