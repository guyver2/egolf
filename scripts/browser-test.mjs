import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const URL = process.env.GAME_URL || 'http://localhost:8088/';

async function getState(page) {
  return page.evaluate(() => {
    const g = window.game;
    const dice = document.getElementById('dice');
    const putt = document.getElementById('putt-btn');
    return {
      hasGame: !!g,
      phase: g?.phase,
      lastRoll: g?.lastRoll,
      strokes: g?.history?.length ?? -1,
      diceLocked: dice?.classList.contains('locked'),
      puttLocked: putt?.classList.contains('locked'),
      landingCount: document.querySelectorAll('.tile.landing').length,
      strokesDisplay: document.getElementById('info-strokes')?.textContent,
      gameJs: [...document.scripts].map((s) => s.src).find((s) => s.includes('game.js')),
    };
  });
}

async function main() {
  const logs = [];
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on('console', (msg) => logs.push(`[console] ${msg.text()}`));
  page.on('pageerror', (err) => logs.push(`[pageerror] ${err.message}`));

  await page.route('**/assets/game.js*', async (route) => {
    const response = await route.fetch();
    let body = await response.text();
    body = body.replace(
      'if (page) new Game(page);',
      'if (page) window.game = new Game(page);'
    );
    await route.fulfill({ response, body, headers: response.headers() });
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 20000 });

  console.log('=== INITIAL ===');
  console.log(await getState(page));

  let failures = [];

  for (let stroke = 1; stroke <= 3; stroke++) {
    console.log(`\n=== STROKE ${stroke}: ROLL (click dice) ===`);
    await page.locator('#dice').click({ timeout: 5000 });
    await page.waitForTimeout(500);
    const afterRoll = await getState(page);
    console.log(afterRoll);

    if (afterRoll.phase !== 'aiming') {
      failures.push(`stroke ${stroke}: expected phase aiming after roll, got ${afterRoll.phase}`);
    }
    if (afterRoll.landingCount === 0) {
      failures.push(`stroke ${stroke}: no landing tiles after roll`);
      break;
    }

    console.log(`=== STROKE ${stroke}: MOVE (click landing tile) ===`);
    await page.locator('.tile.landing').first().click({ timeout: 5000 });
    await page.waitForTimeout(500);
    const afterMove = await getState(page);
    console.log(afterMove);

    if (afterMove.phase !== 'idle') {
      failures.push(`stroke ${stroke}: expected phase idle after move, got ${afterMove.phase}`);
    }
    if (afterMove.diceLocked) {
      failures.push(`stroke ${stroke}: dice still locked after move`);
    }
    if (afterMove.strokes !== stroke) {
      failures.push(`stroke ${stroke}: expected ${stroke} strokes in history, got ${afterMove.strokes}`);
    }
  }

  console.log('\n=== TRY PUTT AFTER STROKES ===');
  await page.locator('#putt-btn').click({ timeout: 5000 });
  await page.waitForTimeout(500);
  console.log(await getState(page));

  console.log('\n=== LOGS ===');
  logs.forEach((l) => console.log(l));

  const shot = await page.screenshot({ fullPage: true });
  writeFileSync('/tmp/egolf-test.png', shot);
  console.log('\nScreenshot saved: /tmp/egolf-test.png');

  await browser.close();

  if (failures.length) {
    console.log('\n=== FAILURES ===');
    failures.forEach((f) => console.log(' -', f));
    process.exit(1);
  }
  console.log('\n=== ALL STROKES PASSED ===');
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
