import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';

function readVersionMetadata() {
  const versionPath = path.resolve(process.cwd(), 'public/version.json');
  try {
    const raw = fs.readFileSync(versionPath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {
      version: '3.0.0',
      buildTime: new Date().toISOString(),
      buildLabel: 'dev'
    };
  }
}

function collectDistFiles(dir, baseDir = dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectDistFiles(fullPath, baseDir));
    } else {
      const rel = path.relative(baseDir, fullPath).replace(/\\/g, '/');
      if (rel === 'sw.js' || rel === 'version.json') continue;
      results.push(`./${rel}`);
    }
  }
  return results;
}

function meuEstudoSwPrecache(versionMeta) {
  return {
    name: 'meu-estudo-sw-precache',
    apply: 'build',
    closeBundle() {
      const distDir = path.resolve(process.cwd(), 'dist');
      const swPath = path.join(distDir, 'sw.js');
      if (!fs.existsSync(swPath)) return;

      const assets = Array.from(new Set(['./', ...collectDistFiles(distDir)]));
      const cacheVersion = `meu-estudo-v${versionMeta.version}-${Date.parse(versionMeta.buildTime) || '1'}`;

      let swCode = fs.readFileSync(swPath, 'utf-8');
      swCode = swCode.replace('__SW_CACHE_VERSION__', cacheVersion);
      swCode = swCode.replace(
        /\/\* __PRECACHE_MANIFEST__ \*\/ \[[^\]]*\]/,
        JSON.stringify(assets)
      );
      fs.writeFileSync(swPath, swCode, 'utf-8');
    }
  };
}

export default defineConfig(() => {
  const meta = readVersionMetadata();
  return {
    base: './',
    define: {
      __APP_VERSION__: JSON.stringify(meta.version),
      __BUILD_TIME__: JSON.stringify(meta.buildTime),
      __BUILD_LABEL__: JSON.stringify(meta.buildLabel)
    },
    plugins: [meuEstudoSwPrecache(meta)],
    test: {
      environment: 'jsdom',
      include: ['tests/unit/**/*.test.js']
    }
  };
});
