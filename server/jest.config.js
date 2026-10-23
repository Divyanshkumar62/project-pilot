module.exports = {
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  testTimeout: 30000,
  verbose: true,
  coveragePathIgnorePatterns: ["/node_modules/", "/tests/", "/scripts/"],
};
