const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "www");

const entries = [
  "index.html",
  "styles.css",
  "sw.js",
  "manifest.webmanifest",
  "assets",
  "src"
];

function copyRecursive(source, destination) {
  const stat = fs.statSync(source);

  if (stat.isDirectory()) {
    fs.mkdirSync(destination, { recursive: true });
    for (const child of fs.readdirSync(source)) {
      copyRecursive(path.join(source, child), path.join(destination, child));
    }
    return;
  }

  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

for (const entry of entries) {
  copyRecursive(path.join(root, entry), path.join(outDir, entry));
}

const vendorDir = path.join(root, "assets", "vendor");
fs.mkdirSync(vendorDir, { recursive: true });
fs.copyFileSync(
  path.join(root, "node_modules", "html2pdf.js", "dist", "html2pdf.bundle.min.js"),
  path.join(vendorDir, "html2pdf.bundle.min.js")
);
copyRecursive(path.join(vendorDir, "html2pdf.bundle.min.js"), path.join(outDir, "assets", "vendor", "html2pdf.bundle.min.js"));
