// Flat config lives here so ESLint stops its upward search at this folder —
// without it, the parent Next.js repo's config gets picked up and its eslint
// patch throws before any rule runs.
const raycastConfig = require("@raycast/eslint-config");

module.exports = [...raycastConfig, { ignores: ["dist/**", "node_modules/**", "raycast-env.d.ts"] }];
