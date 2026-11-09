/**
 * tests/master-test-suite.ts
 * Master Zero-Defect Test Runner executing all 4 phases.
 */

import { execSync } from "child_process";

console.log("\n===============================================================================");
console.log("   DOKTER PIKIRAN MAKASSAR STORY MAKER V5 - MASTER VERIFICATION SUITE");
console.log("===============================================================================\n");

const suites = [
  { name: "Tahap 1: Content Matrix & Ahmad Persona Engine", file: "tests/phase1-content-engine.test.ts" },
  { name: "Tahap 2: Satori High-Speed Renderer & Visual API", file: "tests/phase2-renderer-api.test.ts" },
  { name: "Tahap 3: Studio Cockpit UI & Interactive Controls", file: "tests/phase3-studio-cockpit.test.ts" },
  { name: "Tahap 4: Telegram Dispatcher & Human Authorization", file: "tests/phase4-telegram-dispatcher.test.ts" },
];

let totalPass = 0;

for (const suite of suites) {
  console.log(`\n-------------------------------------------------------------------------------`);
  console.log(`>>> MENJALANKAN: ${suite.name}`);
  console.log(`-------------------------------------------------------------------------------`);
  try {
    const output = execSync(`node node_modules/tsx/dist/cli.mjs ${suite.file}`, {
      encoding: "utf-8",
      stdio: "pipe",
    });
    console.log(output);
  } catch (err: any) {
    console.error(`FATAL FAILURE IN ${suite.name}:`, err.stdout || err.message);
    process.exit(1);
  }
}

console.log("\n===============================================================================");
console.log("   SELURUH 4 TAHAP LENGKAP & 100% TEST-PASSED (ZERO-DEFECT STATUS)");
console.log("===============================================================================\n");
