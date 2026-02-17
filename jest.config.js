/** @type {import('jest').Config} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/__tests__'],
    testMatch: ['**/*.test.ts'],
    moduleNameMapper: {
        '^@/lib/prisma$': '<rootDir>/__mocks__/prisma',
        '^@/(.*)$': '<rootDir>/$1',
    },
    clearMocks: true,
    collectCoverageFrom: [
        'app/api/**/*.ts',
        'middleware.ts',
        'lib/**/*.ts',
        '!**/*.d.ts',
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'clover'],
    verbose: true,
}
