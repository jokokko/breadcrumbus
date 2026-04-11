'use strict';

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const ROOT    = __dirname;
const SRC     = path.join(ROOT, 'src');
const DIST    = path.join(ROOT, 'dist');
const VERSION = require('./package.json').version;

// Files never included in any build
const GLOBAL_EXCLUDES = new Set([
  'manifest.chrome.json',
]);

function copyDir(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath  = path.join(srcDir,  entry.name);
    const destPath = path.join(destDir, entry.name);
    const rel      = path.relative(SRC, srcPath).replace(/\\/g, '/');
    if (GLOBAL_EXCLUDES.has(rel)) continue;
    if (entry.isDirectory()) copyDir(srcPath, destPath);
    else fs.copyFileSync(srcPath, destPath);
  }
}

function zip(sourceDir, outFile) {
  return new Promise((resolve, reject) => {
    const output  = fs.createWriteStream(outFile);
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', resolve);
    archive.on('error', reject);
    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

async function build(browser) {
  const outDir  = path.join(DIST, browser);
  const zipFile = path.join(DIST, `breadcrumbus-${browser}.zip`);

  fs.rmSync(outDir, { recursive: true, force: true });
  copyDir(SRC, outDir);

  const manifestSrc = browser === 'chrome' ? 'manifest.chrome.json' : 'manifest.json';
  const manifest = JSON.parse(fs.readFileSync(path.join(SRC, manifestSrc), 'utf8'));
  manifest.version = VERSION;
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  if (fs.existsSync(zipFile)) fs.unlinkSync(zipFile);
  await zip(outDir, zipFile);
  console.log(`✓ dist/breadcrumbus-${browser}.zip`);
}

async function main() {
  const args     = process.argv.slice(2);
  const targets  = args.filter(a => ['chrome', 'firefox'].includes(a));
  const browsers = targets.length ? targets : ['firefox', 'chrome'];

  fs.mkdirSync(DIST, { recursive: true });
  await Promise.all(browsers.map(build));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
