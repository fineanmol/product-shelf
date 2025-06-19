#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Read package.json
const packageJsonPath = path.join(process.cwd(), "package.json");
const packageJson = require(packageJsonPath);

// Parse current version
const [major, minor] = packageJson.version.split(".").map(Number);

let newVersion;

// If minor version is 9, increment major and reset minor to 0
if (minor === 9) {
  newVersion = `${major + 1}.0.0`;
} else {
  // Just increment minor version
  newVersion = `${major}.${minor + 1}.0`;
}

// Update package.json
packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n");

console.log(`Version updated: ${packageJson.version} → ${newVersion}`);
