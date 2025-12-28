export default {
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['js', 'jsx'],
  testMatch: ['**/?(*.)+(test).[jt]s?(x)'],
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  setupFilesAfterEnv: ['@testing-library/jest-dom/extend-expect'],
};
