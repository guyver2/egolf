const DICE_DOTS = {
  1: [[50,50]], 2: [[35,35],[65,65]], 3: [[35,35],[50,50],[65,65]],
  4: [[35,35],[35,65],[65,35],[65,65]], 5: [[35,35],[35,65],[50,50],[65,35],[65,65]],
  6: [[35,35],[35,50],[35,65],[65,35],[65,50],[65,65]],
  7: [[35,35],[35,50],[35,65],[50,50],[65,35],[65,50],[65,65]],
  8: [[35,35],[35,50],[35,65],[50,35],[50,65],[65,35],[65,50],[65,65]]
};

const TILE_COLORS = { g: 'grass', f: 'fairway', s: 'sand', t: 'tree', w: 'water' };

function getCornerRadii(map, row, col, tile, width, height) {
  const corners = { tl: 0, tr: 0, bl: 0, br: 0 };
  const radius = 2;
  const hasTop = row > 0 && map[row - 1][col] === tile;
  const hasBottom = row < height - 1 && map[row + 1][col] === tile;
  const hasLeft = col > 0 && map[row][col - 1] === tile;
  const hasRight = col < width - 1 && map[row][col + 1] === tile;
  if (!hasTop && !hasLeft) corners.tl = radius;
  if (!hasTop && !hasRight) corners.tr = radius;
  if (!hasBottom && !hasLeft) corners.bl = radius;
  if (!hasBottom && !hasRight) corners.br = radius;
  return corners;
}

function tilePath({ tl, tr, bl, br }) {
  return `M ${0.5 + tl} 0.5 H ${9.5 - tr} A ${tr} ${tr} 0 0 1 9.5 ${0.5 + tr} V ${9.5 - br} A ${br} ${br} 0 0 1 ${9.5 - br} 9.5 H ${0.5 + bl} A ${bl} ${bl} 0 0 1 0.5 ${9.5 - bl} V ${0.5 + tl} A ${tl} ${tl} 0 0 1 ${0.5 + tl} 0.5`;
}

class Game {
  constructor(pageEl) {
    this.page = pageEl;
    const terrainRaw = pageEl.getAttribute('data-terrain') ?? pageEl.dataset.terrain ?? '{}';
    this.terrain = this.normalizeTerrain(JSON.parse(terrainRaw));
    this.holeId = parseInt(pageEl.dataset.holeId, 10);
    this.allowSave = pageEl.dataset.allowSave === 'true';
    this.userLoggedIn = pageEl.dataset.userLoggedIn === 'true';
    this.history = [];
    this.diceMax = 8;
    this.lastRoll = null;
    this.landing = [];
    this.noMoves = false;
    this.saved = false;
    this.phase = 'idle'; // idle | aiming | won
    this.bind();
    this.hideWin();
    this.bindMap();
    this.renderMap();
    this.renderDice(3);
    this.updateInfo();
  }

  normalizeTerrain(terrain) {
    terrain.ball_position = terrain.ball_position.map(Number);
    terrain.hole_position = terrain.hole_position.map(Number);
    terrain.start_position = terrain.start_position.map(Number);
    terrain.width = Number(terrain.width);
    terrain.height = Number(terrain.height);
    terrain.par = Number(terrain.par);
    return terrain;
  }

  tileCoords(tile) {
    return [
      parseInt(tile.getAttribute('data-col'), 10),
      parseInt(tile.getAttribute('data-row'), 10),
    ];
  }

  findTile(el) {
    while (el && el.id !== 'game-map-svg-host') {
      if (el.classList?.contains('tile') && el.hasAttribute('data-col')) return el;
      el = el.parentNode;
    }
    return null;
  }

  bindMap() {
    const host = document.getElementById('game-map-svg-host');
    if (!host || host._egolfMapBound) return;
    host._egolfMapBound = true;
    host.addEventListener('pointerup', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      const tile = this.findTile(e.target);
      if (!tile) return;
      const [col, row] = this.tileCoords(tile);
      this.moveTo(col, row);
    });
  }

  bind() {
    const onRoll = (e) => {
      if (e.type === 'pointerup' && e.pointerType === 'mouse' && e.button !== 0) return;
      e.preventDefault();
      this.roll();
    };
    const onPutt = (e) => {
      if (e.type === 'pointerup' && e.pointerType === 'mouse' && e.button !== 0) return;
      e.preventDefault();
      this.putt();
    };
    const dice = document.getElementById('dice');
    const putt = document.getElementById('putt-btn');
    dice?.addEventListener('pointerup', onRoll);
    putt?.addEventListener('pointerup', onPutt);
    dice?.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.roll();
      }
    });
    document.getElementById('btn-random')?.addEventListener('click', () => this.randomSeed());
    document.getElementById('btn-retry')?.addEventListener('click', () => this.retry());
    document.getElementById('btn-save-hole')?.addEventListener('click', () => this.saveHole());
    document.getElementById('save-play-btn')?.addEventListener('click', () => this.savePlay());
    document.getElementById('game-more-toggle')?.addEventListener('click', () => {
      const panel = document.getElementById('hole-info-panel');
      const toggle = document.getElementById('game-more-toggle');
      if (!panel || !toggle) return;
      const open = panel.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  getLandingPositions(roll) {
    const dirs = [[-0.707,-0.707],[0,-1],[0.707,-0.707],[-1,0],[1,0],[-0.707,0.707],[0,1],[0.707,0.707]];
    const [sx, sy] = this.terrain.ball_position;
    const valid = [];
    for (const [dx, dy] of dirs) {
      const ox = dx > 0 ? Math.ceil(dx * roll) : Math.floor(dx * roll);
      const oy = dy > 0 ? Math.ceil(dy * roll) : Math.floor(dy * roll);
      const tx = sx + ox, ty = sy + oy;
      if (tx >= 0 && tx < this.terrain.width && ty >= 0 && ty < this.terrain.height) {
        const t = this.terrain.map[ty][tx];
        if (t !== 't' && t !== 'w') valid.push([tx, ty]);
      }
    }
    return valid;
  }

  roll() {
    if (this.phase !== 'idle') return;
    this.noMoves = false;
    document.getElementById('no-moves').hidden = true;
    const result = Math.floor(Math.random() * this.diceMax) + 1;
    this.lastRoll = result;
    this.phase = 'aiming';
    this.syncControls();
    this.renderDice(result);
    this.handleRoll(result);
  }

  putt() {
    if (this.phase !== 'idle') return;
    this.noMoves = false;
    document.getElementById('no-moves').hidden = true;
    this.lastRoll = 1;
    this.phase = 'aiming';
    this.syncControls();
    this.renderDice(1);
    this.handleRoll(1);
  }

  handleRoll(roll) {
    const positions = this.getLandingPositions(roll);
    if (positions.length === 0) {
      this.history.push([...this.terrain.ball_position]);
      this.noMoves = true;
      document.getElementById('no-moves').hidden = false;
      this.lastRoll = null;
      this.landing = [];
      this.phase = 'idle';
      this.updateInfo();
      this.highlightLanding();
      this.renderDice(roll);
      this.syncControls();
      return;
    }
    this.landing = positions;
    this.highlightLanding();
    this.renderDice(roll);
  }

  finishAiming() {
    this.lastRoll = null;
    this.landing = [];
    this.noMoves = false;
    document.getElementById('no-moves').hidden = true;
    this.phase = 'idle';
    this.renderDice(3);
    this.highlightLanding();
    this.syncControls();
  }

  moveTo(col, row) {
    if (this.phase !== 'aiming' || !this.lastRoll) return;
    const colN = Number(col);
    const rowN = Number(row);
    if (!Number.isFinite(colN) || !Number.isFinite(rowN)) return;
    const valid = this.getLandingPositions(this.lastRoll);
    if (!valid.some(([x, y]) => x === colN && y === rowN)) return;

    const rollUsed = this.lastRoll;
    this.history.push([...this.terrain.ball_position]);
    this.terrain.ball_position = [colN, rowN];

    const tile = this.terrain.map[rowN][colN];
    if (tile === 's') this.diceMax = 2;
    else if (tile === 'f') this.diceMax = 8;
    else this.diceMax = 6;
    this.renderMap();
    this.updateInfo();
    this.updateDiceClass();
    document.activeElement?.blur?.();

    if (this.isFinished()) {
      this.showWin(rollUsed);
      return;
    }
    this.finishAiming();
  }

  showWin(rollUsed) {
    if (this.phase === 'won') return;
    this.phase = 'won';
    this.lastRoll = null;
    this.landing = [];
    document.getElementById('game-map')?.classList.add('finished');
    const overlay = document.getElementById('win-overlay');
    if (overlay) {
      overlay.removeAttribute('hidden');
      overlay.classList.add('visible');
      overlay.setAttribute('aria-hidden', 'false');
    }
    const strokeEl = document.getElementById('stroke-count');
    if (strokeEl) {
      strokeEl.textContent = `${this.history.length} strokes (par ${this.terrain.par})`;
    }
    this.renderDice(rollUsed);
    this.highlightLanding();
    this.syncControls();
  }

  hideWin() {
    this.phase = 'idle';
    document.getElementById('game-map')?.classList.remove('finished');
    const overlay = document.getElementById('win-overlay');
    if (overlay) {
      overlay.classList.remove('visible');
      overlay.setAttribute('hidden', '');
      overlay.setAttribute('aria-hidden', 'true');
    }
    this.syncControls();
  }

  isFinished() {
    const b = this.terrain.ball_position;
    const h = this.terrain.hole_position;
    return b[0] === h[0] && b[1] === h[1];
  }

  distanceToHole() {
    const b = this.terrain.ball_position;
    const h = this.terrain.hole_position;
    return Math.abs(b[0] - h[0]) + Math.abs(b[1] - h[1]);
  }

  highlightLanding() {
    document.querySelectorAll('#game-map-svg-host .tile').forEach(tile => {
      const [col, row] = this.tileCoords(tile);
      const isLanding = this.landing.some(([x, y]) => x === col && y === row);
      tile.classList.toggle('landing', isLanding);
      const terrainPath = tile.querySelector('path:not(.landing-overlay)');
      let overlay = tile.querySelector('.landing-overlay');
      if (isLanding && terrainPath) {
        if (!overlay) {
          overlay = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          overlay.setAttribute('class', 'landing-overlay');
          tile.appendChild(overlay);
        }
        overlay.setAttribute('d', terrainPath.getAttribute('d'));
      } else if (overlay) {
        overlay.remove();
      }
    });
  }

  renderDice(n) {
    const dots = document.getElementById('dice-dots');
    if (!dots) return;
    dots.innerHTML = '';
    (DICE_DOTS[n] || []).forEach(([cx, cy]) => {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', cx); c.setAttribute('cy', cy); c.setAttribute('r', 5); c.setAttribute('fill', 'white');
      dots.appendChild(c);
    });
    this.syncControls();
  }

  syncControls() {
    const locked = this.phase !== 'idle';
    const dice = document.getElementById('dice');
    const putt = document.getElementById('putt-btn');
    if (dice) dice.classList.toggle('locked', locked);
    if (putt) putt.classList.toggle('locked', locked);
  }

  updateDiceClass() {
    const rect = document.getElementById('dice-rect');
    if (rect) rect.setAttribute('class', `D${this.diceMax}`);
  }

  updateInfo() {
    const dist = this.distanceToHole();
    document.getElementById('info-strokes').textContent = this.history.length;
    document.getElementById('info-dist').textContent = dist;
    document.getElementById('info-par').textContent = this.terrain.par;
    const seed = this.terrain.seed;
    document.getElementById('seed-display').textContent = seed.slice(0, 4) + '-' + seed.slice(4, 8);
  }

  async loadTerrain(seed, width, height) {
    const res = await fetch(`/terrain/json?seed=${encodeURIComponent(seed)}&width=${width}&height=${height}`);
    this.terrain = this.normalizeTerrain(await res.json());
    this.history = [];
    this.diceMax = 8;
    this.lastRoll = null;
    this.landing = [];
    this.saved = false;
    this.clearSaveMessages();
    this.hideWin();
    this.phase = 'idle';
    this.renderMap();
    this.updateInfo();
    this.updateDiceClass();
    this.renderDice(3);
  }

  randomSeed() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let s = '';
    for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
    this.holeId = -1;
    this.loadTerrain(s, this.terrain.width, this.terrain.height);
  }

  retry() {
    this.loadTerrain(this.terrain.seed, this.terrain.width, this.terrain.height);
  }

  renderMap() {
    const host = document.getElementById('game-map-svg-host');
    if (!host) return;
    const w = this.terrain.width;
    const h = this.terrain.height;
    const map = this.terrain.map;
    let svg = `<svg class="map" id="game-map" viewBox="0 0 ${w * 10} ${h * 10}" preserveAspectRatio="xMidYMid meet">`;
    for (let row = 0; row < h; row++) {
      for (let col = 0; col < w; col++) {
        const tile = map[row][col];
        const isBall = this.terrain.ball_position[0] === col && this.terrain.ball_position[1] === row;
        const isHole = this.terrain.hole_position[0] === col && this.terrain.hole_position[1] === row;
        const isStart = this.terrain.start_position[0] === col && this.terrain.start_position[1] === row;
        let cls = `tile ${TILE_COLORS[tile] || 'grass'}`;
        if (isHole) cls += ' hole';
        if (isStart) cls += ' start';
        const pathD = tilePath(getCornerRadii(map, row, col, tile, w, h));
        svg += `<g transform="translate(${col * 10} ${row * 10})" class="${cls}" data-col="${col}" data-row="${row}">`;
        svg += `<rect x="0" y="0" width="10" height="10" fill="#272727"/>`;
        svg += `<path d="${pathD}"/>`;
        if (isBall) svg += `<circle cx="5" cy="5" r="2.5" class="ball"/>`;
        svg += '</g>';
      }
    }
    svg += '</svg>';
    host.innerHTML = svg;
    this.highlightLanding();
  }

  holeFormData() {
    return new URLSearchParams({
      name: 'Hole ' + this.terrain.seed,
      seed: this.terrain.seed,
      width: String(this.terrain.width),
      height: String(this.terrain.height),
    });
  }

  holePayload() {
    return {
      name: 'Hole ' + this.terrain.seed,
      seed: this.terrain.seed,
      width: this.terrain.width,
      height: this.terrain.height,
    };
  }

  async saveHole() {
    if (!this.userLoggedIn) return false;
    try {
      const res = await fetch('/game/save-hole', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: this.holeFormData(),
        credentials: 'same-origin',
      });
      if (!res.ok) return false;
      const data = await res.json();
      const id = Number(data.id);
      if (!Number.isFinite(id) || id <= 0) return false;
      this.holeId = id;
      return true;
    } catch {
      return false;
    }
  }

  showSaveError(message) {
    const el = document.getElementById('save-error');
    if (!el) return;
    el.textContent = message;
    el.hidden = false;
  }

  clearSaveMessages() {
    const errEl = document.getElementById('save-error');
    const savedMsg = document.getElementById('saved-msg');
    if (errEl) errEl.hidden = true;
    if (savedMsg) savedMsg.hidden = true;
  }

  async savePlay() {
    if (!this.userLoggedIn || this.saved) return;
    const btn = document.getElementById('save-play-btn');
    this.clearSaveMessages();
    if (btn) btn.disabled = true;

    let holeId = Number(this.holeId);
    if (!Number.isFinite(holeId) || holeId < 1) {
      const saved = await this.saveHole();
      holeId = Number(this.holeId);
      if (!saved || !Number.isFinite(holeId) || holeId < 1) {
        this.showSaveError('Could not save hole. Please try again.');
        if (btn) btn.disabled = false;
        return;
      }
    }

    const positions = [...this.history, this.terrain.ball_position];
    const moves = [];
    for (let i = 0; i < positions.length - 1; i++) {
      moves.push({
        from_x: positions[i][0],
        from_y: positions[i][1],
        to_x: positions[i + 1][0],
        to_y: positions[i + 1][1],
      });
    }
    if (moves.length === 0) {
      this.showSaveError('No moves to save.');
      if (btn) btn.disabled = false;
      return;
    }

    try {
      const res = await fetch('/game/save-play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          hole_id: holeId,
          hole: this.holePayload(),
          moves,
        }),
      });
      if (!res.ok) {
        this.showSaveError('Could not save play. Please try again.');
        if (btn) btn.disabled = false;
        return;
      }
      const data = await res.json();
      if (data.hole_id) this.holeId = Number(data.hole_id);
      this.saved = true;
      if (btn) btn.hidden = true;
      const savedMsg = document.getElementById('saved-msg');
      if (savedMsg) savedMsg.hidden = false;
    } catch {
      this.showSaveError('Could not save play. Please try again.');
      if (btn) btn.disabled = false;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const page = document.getElementById('game-page');
  if (page) new Game(page);
});
