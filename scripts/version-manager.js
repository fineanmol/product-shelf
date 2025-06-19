#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Read package.json
const packageJsonPath = path.join(process.cwd(), "package.json");
const packageJson = require(packageJsonPath);

// Parse current version
const [major, minor, patch] = packageJson.version.split(".").map(Number);

let newVersion;

// Increment version following the pattern:
// - After x.y.9 → x.(y+1).0
// - After x.9.9 → (x+1).0.0
if (patch === 9) {
  if (minor === 9) {
    // Move to next major version
    newVersion = `${major + 1}.0.0`;
  } else {
    // Move to next minor version
    newVersion = `${major}.${minor + 1}.0`;
  }
} else {
  // Regular patch increment
  newVersion = `${major}.${minor}.${patch + 1}`;
}

// Update package.json
packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n");

console.log(`Version updated: ${packageJson.version} → ${newVersion}`);
