import fs from "node:fs";
import path from "node:path";

const targetDir = path.join(process.cwd(), "src", "assets", "fonts");
fs.mkdirSync(targetDir, { recursive: true });

const fonts = [
  ["@fontsource/inter", "inter-latin-400-normal.woff"],
  ["@fontsource/inter", "inter-latin-600-normal.woff"],
  ["@fontsource/inter", "inter-latin-800-normal.woff"],
  ["@fontsource/jetbrains-mono", "jetbrains-mono-latin-400-normal.woff"],
  ["@fontsource/jetbrains-mono", "jetbrains-mono-latin-700-normal.woff"],
  ["@fontsource/playfair-display", "playfair-display-latin-500-italic.woff"],
  ["@fontsource/playfair-display", "playfair-display-latin-600-normal.woff"],
  ["@fontsource/playfair-display", "playfair-display-latin-700-normal.woff"],
];

let copied = 0;
for (const [pkg, file] of fonts) {
  const src = path.join(process.cwd(), "node_modules", pkg, "files", file);
  const dest = path.join(targetDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    copied++;
  } else {
    console.warn(`Font not found: ${src}`);
  }
}
console.log(`Copied ${copied}/${fonts.length} fonts to src/assets/fonts successfully.`);
