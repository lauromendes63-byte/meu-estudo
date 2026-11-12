import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright-core';

const CANDIDATE_BROWSERS = [
  process.env.BROWSER_PATH,
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
].filter(Boolean);

function findBrowserExecutable() {
  for (const candidate of CANDIDATE_BROWSERS) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error(
    `No Chromium/Edge executable found. Checked: ${CANDIDATE_BROWSERS.join(', ')}`
  );
}

function assert(condition, message) {
  if (!condition) throw new Error(`ASSERTION FAILED: ${message}`);
}

async function waitForServer(url, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // Wait and retry
    }
    await new Promise((r) => setTimeout(r, 180));
  }
  throw new Error(`Preview server did not become ready at ${url} within ${timeoutMs}ms`);
}

function getIsoDateOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function run() {
  const executablePath = findBrowserExecutable();
  const viteBin = path.join(process.cwd(), 'node_modules', 'vite', 'bin', 'vite.js');
  const BASE_URL = 'http://127.0.0.1:4173/';

  const preview = spawn(
    process.execPath,
    [viteBin, 'preview', '--port', '4173', '--strictPort', '--host', '127.0.0.1'],
    { cwd: process.cwd(), stdio: 'pipe' }
  );

  let serverLogs = '';
  preview.stdout.on('data', (chunk) => { serverLogs += chunk.toString(); });
  preview.stderr.on('data', (chunk) => { serverLogs += chunk.toString(); });

  let browser;
  try {
    await waitForServer(BASE_URL);

    // 0. Core HTTP & PWA assets verification
    for (const ep of [
      '',
      'manifest.json',
      'version.json',
      'icon.svg',
      'icon-192.png',
      'icon-512.png',
      'icon-maskable-192.png',
      'icon-maskable-512.png',
      'apple-touch-icon.png',
      'sw.js'
    ]) {
      const res = await fetch(`${BASE_URL}${ep}`);
      assert(res.status === 200, `Endpoint /${ep} returned HTTP ${res.status}`);
      if (ep.endsWith('.png')) {
        assert(
          res.headers.get('content-type')?.includes('image/png'),
          `Endpoint /${ep} wrong content-type: ${res.headers.get('content-type')}`
        );
      }
    }
    const manifestJson = await (await fetch(`${BASE_URL}manifest.json`)).json();
    assert(manifestJson.icons.length === 4, `Expected 4 PNG icons in manifest.json, got ${manifestJson.icons.length}`);
    assert(manifestJson.icons.every((i) => i.type === 'image/png'), 'manifest.json must declare only PNG icons for Android WebAPK');
    assert(manifestJson.start_url === './' && manifestJson.id === './', 'manifest.json must use root ./ start_url and id');
    const versionJson = await (await fetch(`${BASE_URL}version.json`)).json();
    assert(versionJson.version === '3.0.0', `Expected version.json 3.0.0, got ${versionJson.version}`);

    // 0b. Persistent WebAPK installability check via CDP
    const auditProfileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'meu-estudo-pwa-'));
    try {
      const persistentCtx = await chromium.launchPersistentContext(auditProfileDir, {
        executablePath,
        headless: true
      });
      const auditPage = persistentCtx.pages()[0] || (await persistentCtx.newPage());
      await auditPage.addInitScript(() => {
        window.addEventListener('beforeinstallprompt', (e) => {
          e.preventDefault();
          window.__e2eBipFired = true;
        });
      });
      const cdp = await persistentCtx.newCDPSession(auditPage);
      await auditPage.goto(BASE_URL, { waitUntil: 'networkidle' });
      await auditPage.waitForTimeout(1000);
      const cdpManifest = await cdp.send('Page.getAppManifest');
      const cdpInstall = await cdp.send('Page.getInstallabilityErrors');
      const bipFired = await auditPage.evaluate(() => !!window.__e2eBipFired);
      const swReady = await auditPage.evaluate(async () => {
        const reg = await navigator.serviceWorker.getRegistration();
        return Boolean(reg && reg.active && reg.active.state === 'activated');
      });
      assert(cdpManifest.errors.length === 0, `CDP manifest errors: ${JSON.stringify(cdpManifest.errors)}`);
      assert(
        cdpInstall.installabilityErrors.length === 0,
        `CDP installabilityErrors: ${JSON.stringify(cdpInstall.installabilityErrors)}`
      );
      assert(swReady, 'Service Worker did not activate promptly on first load');
      assert(bipFired, 'beforeinstallprompt did not fire on clean browser context');
      await persistentCtx.close();
    } finally {
      fs.rmSync(auditProfileDir, { recursive: true, force: true });
    }

    browser = await chromium.launch({ executablePath, headless: true });

    const context = await browser.newContext({
      viewport: { width: 412, height: 915 },
      deviceScaleFactor: 2.625,
      isMobile: true,
      hasTouch: true,
      locale: 'pt-BR'
    });

    const todayStr = getIsoDateOffset(0);
    const seedPayload = {
      modules: [
        { id: 'm-reuma', name: 'Reumatologia', iconKey: 'joint', colorKey: 'slate' },
        { id: 'm-clin', name: 'Clínica Médica', iconKey: 'general', colorKey: 'blue' },
        { id: 'm-psiq', name: 'Psiquiatria', iconKey: 'brain', colorKey: 'purple' }
      ],
      lessons: [
        {
          id: 'l-1',
          moduleId: 'm-reuma',
          number: 1,
          title: 'Artrite Reumatoide',
          notes:
            '[Alerta: FR negativo não exclui]\n[Padrão-Ouro: Anti-CCP]\n• **Sinovite** simétrica <script>window.__xss=1</script>',
          examId: 'e-1',
          isStudied: true,
          studiedDate: getIsoDateOffset(-1),
          reviews: {
            d1: { dueDate: todayStr, done: false },
            d7: { dueDate: getIsoDateOffset(6), done: false },
            d30: { dueDate: getIsoDateOffset(29), done: false }
          }
        },
        {
          id: 'l-2',
          moduleId: 'm-clin',
          number: 1,
          title: 'Insuficiência Cardíaca',
          notes: '[Conduta: IECA + Betabloqueador]',
          examId: null,
          isStudied: false,
          studiedDate: null,
          reviews: { d1: null, d7: null, d30: null }
        }
      ],
      exams: [
        {
          id: 'e-1',
          moduleId: 'm-reuma',
          name: 'P1 Reumatologia',
          date: getIsoDateOffset(3),
          lessonIds: ['l-1']
        }
      ]
    };

    await context.addInitScript((payloadStr) => {
      if (!localStorage.getItem('__e2e_seeded')) {
        localStorage.setItem('__e2e_seeded', '1');
        localStorage.setItem('meu_estudo_data_v1', payloadStr);
      }
    }, JSON.stringify(seedPayload));

    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    const failedResponses = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => pageErrors.push(err.message));
    page.on('response', (res) => {
      if (res.status() >= 400) failedResponses.push(`${res.status()} ${res.url()}`);
    });

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);

    // 1. Typography, zero emojis, zero overflow, migrated schema
    const bootAudit = await page.evaluate(() => {
      const fontsLoaded = document.fonts.status === 'loaded';
      const headerFont = getComputedStyle(document.querySelector('.header-title')).fontFamily;
      const bodyFont = getComputedStyle(document.body).fontFamily;
      const stored = JSON.parse(localStorage.getItem('meu_estudo_data_v1'));
      const overflow = document.documentElement.scrollWidth > window.innerWidth;
      const emojiMatch = document.body.innerText.match(/[\u{1F300}-\u{1FAFF}]/u);
      return {
        fontsLoaded,
        headerFont,
        bodyFont,
        iconKeys: stored.modules.map((m) => m.iconKey),
        overflow,
        emojiMatch: emojiMatch ? emojiMatch[0] : null,
        headerStatus: document.getElementById('header-date')?.textContent,
        badgeProvas: document.getElementById('nav-provas-badge')?.textContent,
        badgeProvasHidden: document.getElementById('nav-provas-badge')?.hidden,
        revDotHidden: document.getElementById('nav-rev-dot')?.hidden
      };
    });

    assert(bootAudit.fontsLoaded, 'Bundled fonts failed to finish loading');
    assert(bootAudit.headerFont.includes('Plus Jakarta Sans'), `Header font mismatch: ${bootAudit.headerFont}`);
    assert(bootAudit.bodyFont.includes('Plus Jakarta Sans'), `Body font mismatch: ${bootAudit.bodyFont}`);
    assert(
      JSON.stringify(bootAudit.iconKeys) === JSON.stringify(['reuma', 'stethoscope', 'psiq']),
      `Legacy icon migration failed: ${JSON.stringify(bootAudit.iconKeys)}`
    );
    assert(!bootAudit.overflow, 'Horizontal overflow detected on tab-modulos');
    assert(!bootAudit.emojiMatch, `Unexpected emoji in DOM: ${bootAudit.emojiMatch}`);
    assert(bootAudit.headerStatus === '1 revisão para hoje', `Unexpected headerStatus: ${bootAudit.headerStatus}`);
    assert(!bootAudit.badgeProvasHidden && bootAudit.badgeProvas === '1', 'Provas badge should show 1');
    assert(!bootAudit.revDotHidden, 'Estudo review dot should be visible');

    // 2. View switcher Grid / List
    await page.click('#btn-view-grid');
    assert((await page.locator('#modulos-list.modules-grid').count()) === 1, 'Grid view did not activate');
    await page.click('#btn-view-list');
    assert((await page.locator('#modulos-list.modules-list').count()) === 1, 'List view did not restore');

    // 3. Master -> Detail navigation + filters + XSS-safe Viewer + Light-Dismiss
    await page.locator('#modulos-list .module-card', { hasText: 'Reumatologia' }).click();
    await page.waitForSelector('#tab-modulo-detail:not([hidden])');
    assert((await page.locator('#btn-add-lesson-in-module').count()) === 1, 'Single add lesson button missing');

    await page.locator('#module-detail-filters .filter-chip', { hasText: 'Estudadas' }).click();
    assert((await page.locator('#module-lessons-list .lesson-card').count()) === 1, 'Estudadas filter broken');

    await page.locator('#module-detail-filters .filter-chip', { hasText: 'A Estudar' }).click();
    assert((await page.locator('#module-lessons-list .empty-card').count()) === 1, 'Empty filter state missing');

    await page.locator('#module-detail-filters .filter-chip', { hasText: 'Todas' }).click();
    await page.locator('#module-lessons-list .lesson-card', { hasText: 'Artrite Reumatoide' }).click();
    await page.waitForSelector('#modal-view-lesson[open]');

    const viewerCheck = await page.evaluate(() => {
      const notesEl = document.getElementById('view-lesson-notes-content');
      return {
        xssGlobal: window.__xss || null,
        scriptNodes: notesEl.querySelectorAll('script').length,
        redTag: notesEl.querySelector('.clinical-tag--red')?.textContent || '',
        goldTag: notesEl.querySelector('.clinical-tag--green')?.textContent || '',
        boldTag: notesEl.querySelector('strong')?.textContent || '',
        rawText: notesEl.textContent
      };
    });
    assert(!viewerCheck.xssGlobal && viewerCheck.scriptNodes === 0, 'XSS script executed or injected');
    assert(viewerCheck.redTag.includes('Alerta:'), 'Red clinical marker missing');
    assert(viewerCheck.goldTag.includes('Padrão-Ouro:'), 'Gold clinical marker missing');
    assert(viewerCheck.boldTag === 'Sinovite', 'Bold formatting missing');
    assert(viewerCheck.rawText.includes('<script>window.__xss=1</script>'), 'Escaped literal text missing');

    // Light-dismiss backdrop tap + history state verification
    await page.mouse.click(10, 10);
    await page.waitForSelector('#modal-view-lesson:not([open])');
    await page.waitForTimeout(160);
    const histAfterLightDismiss = await page.evaluate(() => window.history.state?.meuEstudoView);
    assert(
      histAfterLightDismiss === 'detail',
      `History state after light-dismiss should be 'detail', got ${histAfterLightDismiss}`
    );

    // Back to modules list
    await page.click('#btn-back-to-modules');
    await page.waitForSelector('#tab-modulos:not([hidden])');

    // 4. Create Module + Smart Auto-Match
    await page.click('#btn-open-create-module');
    await page.waitForSelector('#modal-module[open]');
    await page.fill('#module-name-input', 'Gastroenterologia');
    const hintText = await page.textContent('#module-automatch-hint');
    assert(hintText?.includes('Gastro'), `Smart Auto-Match failed: ${hintText}`);
    await page.click('#form-module button[type="submit"]');
    await page.waitForSelector('#modal-module:not([open])');
    assert(
      (await page.locator('#modulos-list .module-card', { hasText: 'Gastroenterologia' }).count()) === 1,
      'New module missing'
    );

    // 5. Lesson Sheet + Salvar e +1 + Clinical Pill
    await page.locator('button[aria-label="Nova aula em Clínica Médica"]').click();
    await page.waitForSelector('#sheet-lesson.sheet-open');
    assert((await page.inputValue('#lesson-number-input')) === '2', 'Next lesson number should be 2');
    await page.locator('.btn-insert-tag[data-tag="gold"]').click();
    const notesValAfterPill = await page.inputValue('#lesson-notes-input');
    assert(notesValAfterPill.includes('[Padrão-Ouro: ]'), `Pill insert failed: ${notesValAfterPill}`);
    await page.fill('#lesson-title-input', 'Sepse e Choque Séptico');
    await page.click('#btn-save-and-next-lesson');
    await page.waitForTimeout(100);
    assert((await page.locator('#sheet-lesson.sheet-open').count()) === 1, 'Sheet closed during Salvar e +1');
    assert((await page.inputValue('#lesson-number-input')) === '3', 'Next lesson number did not advance to 3');

    await page.fill('#lesson-title-input', 'Pneumonia Adquirida');
    await page.click('#btn-save-lesson');
    await page.waitForSelector('#sheet-lesson:not(.sheet-open)');

    // 6. Estudo & Revisões -> SwipeableList initialization, no auto-commit, complete + Undo
    await page.click('.nav-tab-btn[data-tab="tab-estudo"]');
    await page.waitForSelector('#tab-estudo:not([hidden])');
    await page.waitForTimeout(200);

    const revInit = await page.locator('#estudo-revisoes-list .SwipeableList-item.is-initialized').count();
    assert(revInit === 1, `Expected 1 initialized review item without auto-commit, got ${revInit}`);

    await page.click('#btn-subtab-estudar');
    await page.waitForTimeout(200);
    const pendingInit = await page.locator('#estudo-pendentes-list .SwipeableList-item.is-initialized').count();
    assert(pendingInit === 3, `Expected 3 initialized study items without auto-commit, got ${pendingInit}`);

    await page.click('#btn-subtab-revisar');
    await page.waitForTimeout(150);
    await page.locator('#estudo-revisoes-list .SwipeableList-action').first().click();
    await page.waitForSelector('#toast-container.is-visible');
    await page.waitForTimeout(380);
    assert((await page.textContent('#subtab-count-revisar')) === '0', 'Review count should drop to 0');
    assert((await page.locator('#toast-undo-btn:not([hidden])').count()) === 1, 'Undo button missing');

    // Verify no nested interactive button inside role=button anywhere
    const nestedButtons = await page.locator('[role="button"] button, button button').count();
    assert(nestedButtons === 0, `Found ${nestedButtons} nested interactive buttons`);

    await page.click('#toast-undo-btn');
    await page.waitForTimeout(160);
    assert((await page.textContent('#subtab-count-revisar')) === '1', 'Undo did not restore review count');

    // 7. Provas Tab + checklist + Multi-module Exam Modal with Date Presets
    await page.click('.nav-tab-btn[data-tab="tab-provas"]');
    await page.waitForSelector('#tab-provas:not([hidden])');
    await page.locator('#provas-list details.exam-details summary').first().click();
    assert(
      (await page.locator('#provas-list .exam-lesson-row', { hasText: 'Artrite Reumatoide' }).count()) === 1,
      'Exam checklist missing linked lesson'
    );

    await page.click('#btn-open-create-exam');
    await page.waitForSelector('#modal-exam[open]');
    assert(
      (await page.locator('#exam-date-presets .exam-date-preset-btn[data-offset="14"].is-active').count()) === 1,
      'Default +14d date preset should be active'
    );
    await page.click('#exam-date-presets .exam-date-preset-btn[data-offset="7"]');
    assert(
      (await page.inputValue('#exam-date-input')) === getIsoDateOffset(7),
      'Quick +7 dias preset did not update exam date'
    );
    await page.fill('#exam-name-input', 'Simulado Multidisciplinar');
    await page.locator('#exam-modules-selector .module-select-chip', { hasText: 'Clínica Médica' }).click();
    assert(
      (await page.locator('#exam-lessons-checklist .exam-checklist-group').count()) === 2,
      'Multi-module exam checklist should render groups for both selected modules'
    );
    assert(
      (await page.locator('#exam-lessons-checklist input[type="checkbox"]:checked').count()) === 0,
      'Lessons must stay unchecked until manually selected'
    );
    await page.locator('#exam-lessons-checklist label', { hasText: 'Artrite Reumatoide' }).click();
    await page.locator('#exam-lessons-checklist label', { hasText: 'Insuficiência Cardíaca' }).click();
    assert((await page.textContent('#exam-selected-count')) === '2 aulas', 'Selected exam lesson count mismatch');
    await page.click('#form-exam button[type="submit"]');
    await page.waitForSelector('#modal-exam:not([open])');

    const multiExamCard = page.locator('#provas-list .exam-card', { hasText: 'Simulado Multidisciplinar' });
    assert((await multiExamCard.count()) === 1, 'Multi-module exam card not rendered');
    assert((await multiExamCard.locator('.exam-squircle-stack .exam-squircle-btn').count()) === 2, 'Expected 2 stacked squircles on multi-module exam card');
    assert((await multiExamCard.locator('.exam-modules-row button', { hasText: 'Reumatologia' }).count()) === 1, 'Missing Reumatologia badge on multi-module exam card');
    assert((await multiExamCard.locator('.exam-modules-row button', { hasText: 'Clínica Médica' }).count()) === 1, 'Missing Clínica Médica badge on multi-module exam card');
    await multiExamCard.locator('details.exam-details summary').click();
    assert((await multiExamCard.locator('.exam-lesson-row').count()) === 2, 'Expected 2 lessons in multi-module exam edital');
    const provasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assert(!provasOverflow, 'Horizontal overflow detected on tab-provas');

    // 7b. Horizontal Touch Swipe Navigation across Módulos <-> Estudo <-> Provas
    const touchCdp = await page.context().newCDPSession(page);
    async function dispatchTouchSwipe(fromX, fromY, toX, toY, steps = 8) {
      await touchCdp.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: fromX, y: fromY, id: 1 }]
      });
      for (let i = 1; i <= steps; i++) {
        const x = fromX + ((toX - fromX) * i) / steps;
        const y = fromY + ((toY - fromY) * i) / steps;
        await touchCdp.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [{ x, y, id: 1 }]
        });
        await page.waitForTimeout(14);
      }
      await touchCdp.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: []
      });
    }

    await page.click('.nav-tab-btn[data-tab="tab-modulos"]');
    await page.waitForSelector('#tab-modulos:not([hidden])');
    await page.waitForTimeout(160);

    // Swipe right-to-left: Módulos -> Estudo
    await dispatchTouchSwipe(330, 118, 85, 118);
    await page.waitForSelector('#tab-estudo:not([hidden])');
    assert(
      (await page.getAttribute('#app-dock', 'data-active-index')) === '1',
      'Swipe left from Módulos did not navigate to Estudo'
    );
    await page.waitForTimeout(180);

    // Swiping slightly inside .SwipeableList-item must NOT trigger whole-tab switch
    const swipeItemBox = await page.locator('#estudo-revisoes-list .SwipeableList-content').first().boundingBox();
    assert(swipeItemBox, 'Expected review swipe item bounding box');
    await dispatchTouchSwipe(
      swipeItemBox.x + swipeItemBox.width * 0.72,
      swipeItemBox.y + swipeItemBox.height / 2,
      swipeItemBox.x + swipeItemBox.width * 0.56,
      swipeItemBox.y + swipeItemBox.height / 2,
      6
    );
    await page.waitForTimeout(140);
    assert(
      (await page.getAttribute('#app-dock', 'data-active-index')) === '1',
      'Horizontal swipe inside SwipeableList item wrongly switched main tab'
    );

    // Swipe right-to-left above list: Estudo -> Provas
    await dispatchTouchSwipe(330, 118, 85, 118);
    await page.waitForSelector('#tab-provas:not([hidden])');
    assert(
      (await page.getAttribute('#app-dock', 'data-active-index')) === '2',
      'Swipe left from Estudo did not navigate to Provas'
    );
    await page.waitForTimeout(180);

    // Swipe left-to-right: Provas -> Estudo
    await dispatchTouchSwipe(85, 118, 330, 118);
    await page.waitForSelector('#tab-estudo:not([hidden])');
    assert(
      (await page.getAttribute('#app-dock', 'data-active-index')) === '1',
      'Swipe right from Provas did not navigate back to Estudo'
    );
    await touchCdp.detach();

    // 8. Global Search Modal
    await page.click('#btn-open-search');
    await page.waitForSelector('#modal-search[open]');
    await page.fill('#global-search-input', 'Anti-CCP');
    assert(
      (await page.locator('#global-search-results .lesson-card', { hasText: 'Artrite Reumatoide' }).count()) === 1,
      'Global search failed on Anti-CCP'
    );
    await page.click('#btn-close-modal-search');
    await page.waitForSelector('#modal-search:not([open])');

    // 9. Settings Modal
    await page.click('#btn-open-settings');
    await page.waitForSelector('#modal-settings[open]');
    assert((await page.textContent('#settings-version-label')) === 'v3.0.0', 'Settings version mismatch');
    assert((await page.textContent('#stat-total-modules')) === '4', 'Settings modules metric mismatch');
    assert((await page.textContent('#stat-total-lessons')) === '4', 'Settings lessons metric mismatch');
    assert((await page.textContent('#stat-total-exams')) === '2', 'Settings exams metric mismatch');
    await page.click('#btn-close-modal-settings');
    await page.waitForSelector('#modal-settings:not([open])');

    // 10. Desktop viewport + reduced motion audit
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.click('.nav-tab-btn[data-tab="tab-modulos"]');
    await page.waitForTimeout(120);
    const desktopOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assert(!desktopOverflow, 'Desktop horizontal overflow detected');

    assert(consoleErrors.length === 0, `Console errors: ${consoleErrors.join('; ')}`);
    assert(pageErrors.length === 0, `Page errors: ${pageErrors.join('; ')}`);
    assert(failedResponses.length === 0, `Failed HTTP responses: ${failedResponses.join('; ')}`);

    console.log(
      'E2E_ALL_CHECKS_PASSED',
      JSON.stringify({
        mobileViewport: '412x915',
        desktopViewport: '1280x800',
        bundledFontsLoaded: bootAudit.fontsLoaded,
        headerFont: bootAudit.headerFont,
        migratedIcons: bootAudit.iconKeys,
        consoleErrors: 0,
        pageErrors: 0,
        failedResponses: 0
      })
    );
  } finally {
    if (browser) await browser.close();
    if (!preview.killed) preview.kill();
  }
}

run().catch((err) => {
  console.error('E2E_FAILED:', err);
  process.exit(1);
});
