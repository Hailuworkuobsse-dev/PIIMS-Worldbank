/**
 * One-time script to split existing en.json / am.json into per-feature namespaces.
 * Run: npx tsx scripts/split-i18n.ts
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "src", "lib", "i18n");

const NAMESPACE_MAP: Record<string, string[]> = {
  common: [
    "app",
    "actions",
    "nav",
    "a11y",
    "errors",
    "shell",
    "dashboard",
    "syncConflict",
  ],
  auth: ["auth"],
  projects: ["projects"],
  inception: ["inception"],
  results: ["results"],
  financial: ["financial"],
  procurement: ["procurement"],
  supplier: ["supplier"],
  beneficiaries: ["beneficiaries"],
  geo: ["geo"],
  documents: ["documents"],
  grievance: ["grievance"],
  "impact-indicators": ["impactIndicators"],
  survey: ["survey"],
  field: ["field"],
  qa: ["qa"],
  warehouse: ["warehouse", "research"],
  analytics: ["analytics"],
  admin: ["admin"],
  reports: ["reports"],
};

for (const lang of ["en", "am"] as const) {
  const srcFile = path.join(root, `${lang}.json`);
  if (!fs.existsSync(srcFile)) {
    console.warn(`⚠ ${srcFile} not found, skipping`);
    continue;
  }
  const data = JSON.parse(fs.readFileSync(srcFile, "utf8"));

  const langDir = path.join(root, lang);
  fs.mkdirSync(langDir, { recursive: true });

  for (const [namespace, keys] of Object.entries(NAMESPACE_MAP)) {
    const subset: Record<string, unknown> = {};
    for (const key of keys) {
      if (key in data) subset[key] = data[key];
    }
    fs.writeFileSync(
      path.join(langDir, `${namespace}.json`),
      JSON.stringify(subset, null, 2) + "\n",
      "utf8",
    );
    console.log(`✓ ${lang}/${namespace}.json`);
  }
}

console.log(
  "\n✨ Split complete. Verify, then delete en.json / am.json at the root.",
);