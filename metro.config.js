// metro.config.js
// Tells Metro bundler to ignore the backend/ folder (Node.js TypeScript code).
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Exclude backend directory from Metro bundler
config.resolver.blockList = [
  /backend\/.*/,
];

module.exports = config;
