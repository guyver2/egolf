const DICE_DOTS = {
  1: [[50,50]], 2: [[35,35],[65,65]], 3: [[35,35],[50,50],[65,65]],
  4: [[35,35],[35,65],[65,35],[65,65]], 5: [[35,35],[35,65],[50,50],[65,35],[65,65]],
  6: [[35,35],[35,50],[35,65],[65,35],[65,50],[65,65]],
  7: [[35,35],[35,50],[35,65],[50,50],[65,35],[65,50],[65,65]],
  8: [[35,35],[35,50],[35,65],[50,35],[50,65],[65,35],[65,50],[65,65]]
};

class Game {
  constructor(pageEl) {
    this.page = pageEl;
    this.terrain = JSON.parse(pageEl.dataset.terrain);
    this.holeId = parseInt(pageEl.dataset.holeId, 10);
    this.allowSave = pageEl.dataset.allowSave === 'true';
    this.userLoggedIn = pageEl.dataset.userLoggedIn === 'true';
    this.history = [];
    this.diceMax = 8;
    this.diceLocked = false;
    this.lastRoll = null;
    this.landing = [];
    this.noMoves = false;
    this.finished = false;
    this.saved = false;
    this.bind();
    this.renderDice(3);
    this.updateInfo();
  }

  bind() {
    document.getElementById('dice')?.addEventListener('click', () => this.roll());
    document.getElementById('dice')?.addEventListener('keydown', e => { if (e.key === 'Enter') this.roll(); });
    document.getElementById('putt-btn')?.addEventListener('click', () => this.putt());
    document.getElementById('btn-random')?.addEventListener('click', () => this.randomSeed());
    document.getElementById('btn-retry')?.addEventListener('click', () => this.retry());
    document.getElementById('btn-save-hole')?.addEventListener('click', () => this.saveHole());
    document.getElementById('save-play-btn')?.addEventListener('click', () => this.savePlay());
    document.querySelectorAll('.tile').forEach(tile => {
      tile.addEventListener('click', () => this.moveTo(parseInt(tile.dataset.col, 10), parseInt(tile.dataset.row, 10)));
      tile.addEventListener('keydown', e => { if (e.key === 'Enter') this.moveTo(parseInt(tile.dataset.col, 10), parseInt(tile.dataset.row, 10)); });
    });
    document.getElementById('menu-toggle')?.addEventListener('click', () => {
      const menu = document.getElementById('mobile-menu');
      menu.hidden = !menu.hidden;
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

  async roll() {
    if (this.diceLocked || this.finished) return;
    this.noMoves = false;
    document.getElementById('no-moves').hidden = true;
    const dice = document.getElementById('dice');
    dice.classList.add('rolling');
    for (let i = 0; i < 10; i++) {
      this.renderDice(Math.floor(Math.random() * this.diceMax) + 1);
      await new Promise(r => setTimeout(r, 80));
    }
    const result = Math.floor(Math.random() * this.diceMax) + 1;
    this.lastRoll = result;
    this.diceLocked = true;
    this.renderDice(result);
    dice.classList.remove('rolling');
    this.handleRoll(result);
  }

  putt() {
    if (this.diceLocked || this.finished) return;
    this.noMoves = false;
    document.getElementById('no-moves').hidden = true;
    this.lastRoll = 1;
    this.diceLocked = true;
    this.renderDice(1);
    this.handleRoll(1);
  }

  handleRoll(roll) {
    const positions = this.getLandingPositions(roll);
    if (positions.length === 0) {
      this.history.push([...this.terrain.ball_position]);
      this.noMoves = true;
      document.getElementById('no-moves').hidden = false;
      this.diceLocked = false;
      this.landing = [];
      this.updateInfo();
      this.highlightLanding();
      return;
    }
    this.landing = positions;
    this.highlightLanding();
  }

  moveTo(col, row) {
    if (!this.lastRoll || this.finished) return;
    const valid = this.getLandingPositions(this.lastRoll);
    if (!valid.some(([x, y]) => x === col && y === row)) return;
    this.history.push([...this.terrain.ball_position]);
    this.terrain.ball_position = [col, row];
    this.diceLocked = false;
    this.lastRoll = null;
    this.landing = [];
    const tile = this.terrain.map[row][col];
    if (tile === 's') this.diceMax = 2;
    else if (tile === 'f') this.diceMax = 8;
    else this.diceMax = 6;
    this.renderMap();
    this.updateInfo();
    this.updateDiceClass();
    if (this.isFinished()) {
      this.finished = true;
      this.diceLocked = true;
      document.getElementById('game-map').classList.add('finished');
      const overlay = document.getElementById('win-overlay');
      overlay.hidden = false;
      document.getElementById('stroke-count').textContent = `${this.history.length} strokes (par ${this.terrain.par})`;
    }
  }

  isFinished() {
    const b = this.terrain.ball_position, h = this.terrain.hole_position;
    return b[0] === h[0] && b[1] === h[1];
  }

  highlightLanding() {
    document.querySelectorAll('.tile').forEach(tile => {
      const col = parseInt(tile.dataset.col, 10), row = parseInt(tile.dataset.row, 10);
      tile.classList.toggle('landing', this.landing.some(([x,y]) => x === col && y === row));
    });
  }

  renderDice(n) {
    const rect = document.getElementById('dice-rect');
    const dots = document.getElementById('dice-dots');
    if (!dots) return;
    dots.innerHTML = '';
    (DICE_DOTS[n] || []).forEach(([cx, cy]) => {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', cx); c.setAttribute('cy', cy); c.setAttribute('r', 5); c.setAttribute('fill', 'white');
      dots.appendChild(c);
    });
    const dice = document.getElementById('dice');
    dice?.classList.toggle('locked', this.diceLocked);
    document.getElementById('putt-btn')?.classList.toggle('locked', this.diceLocked);
  }

  updateDiceClass() {
    const rect = document.getElementById('dice-rect');
    if (rect) rect.className = `D${this.diceMax}`;
  }

  updateInfo() {
    const b = this.terrain.ball_position, h = this.terrain.hole_position;
    const dist = Math.abs(b[0]-h[0]) + Math.abs(b[1]-h[1]);
    document.getElementById('info-strokes').textContent = this.history.length;
    document.getElementById('info-dist').textContent = dist;
    document.getElementById('info-par').textContent = this.terrain.par;
    const seed = this.terrain.seed;
    document.getElementById('seed-display').textContent = seed.slice(0,4) + '-' + seed.slice(4,8);
  }

  async loadTerrain(seed, width, height) {
    const res = await fetch(`/terrain/json?seed=${encodeURIComponent(seed)}&width=${width}&height=${height}`);
    this.terrain = await res.json();
    this.history = [];
    this.diceMax = 8;
    this.diceLocked = false;
    this.lastRoll = null;
    this.landing = [];
    this.finished = false;
    this.saved = false;
    document.getElementById('win-overlay').hidden = true;
    document.getElementById('game-map').classList.remove('finished');
    this.renderMap();
    this.updateInfo();
    this.updateDiceClass();
    this.renderDice(3);
  }

  randomSeed() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let s = '';
    for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
    this.loadTerrain(s, this.terrain.width, this.terrain.height);
  }

  retry() {
    this.loadTerrain(this.terrain.seed, this.terrain.width, this.terrain.height);
  }

  renderMap() {
    const container = document.getElementById('game-map-container');
    const w = this.terrain.width, h = this.terrain.height;
    let svg = `<svg class="map" id="game-map" viewBox="0 0 ${w*10} ${h*10}" preserveAspectRatio="xMidYMid meet">`;
    const colors = { g:'grass', f:'fairway', s:'sand', t:'tree', w:'water' };
    for (let row = 0; row < h; row++) {
      for (let col = 0; col < w; col++) {
        const tile = this.terrain.map[row][col];
        const isBall = this.terrain.ball_position[0]===col && this.terrain.ball_position[1]===row;
        const isHole = this.terrain.hole_position[0]===col && this.terrain.hole_position[1]===row;
        const isStart = this.terrain.start_position[0]===col && this.terrain.start_position[1]===row;
        let cls = `tile ${colors[tile]||'grass'}`;
        if (isHole) cls += ' hole';
        if (isStart) cls += ' start';
        svg += `<g transform="translate(${col*10} ${row*10})" class="${cls}" data-col="${col}" data-row="${row}" role="button" tabindex="0">`;
        svg += `<rect x="0" y="0" width="10" height="10" fill="#272727"/>`;
        svg += `<path d="M 2.5 0.5 H 7.5 A 2 2 0 0 1 9.5 2.5 V 7.5 A 2 2 0 0 1 7.5 9.5 H 2.5 A 2 2 0 0 1 0.5 7.5 V 2.5 A 2 2 0 0 1 2.5 0.5"/>`;
        if (isBall) svg += `<circle cx="5" cy="5" r="2.5" class="ball" stroke="#666" stroke-width="0.5"/>`;
        svg += '</g>';
      }
    }
    svg += '</svg>';
    const overlay = document.getElementById('win-overlay');
    container.innerHTML = svg;
    if (overlay) container.appendChild(overlay);
    container.querySelectorAll('.tile').forEach(tile => {
      tile.addEventListener('click', () => this.moveTo(parseInt(tile.dataset.col,10), parseInt(tile.dataset.row,10)));
    });
  }

  async saveHole() {
    if (!this.userLoggedIn) return;
    const fd = new FormData();
    fd.append('name', 'Hole ' + this.terrain.seed);
    fd.append('seed', this.terrain.seed);
    fd.append('width', this.terrain.width);
    fd.append('height', this.terrain.height);
    const res = await fetch('/game/save-hole', { method: 'POST', body: fd });
    if (res.ok) {
      const data = await res.json();
      this.holeId = data.id;
    }
  }

  async savePlay() {
    if (!this.userLoggedIn || this.saved) return;
    let holeId = this.holeId;
    if (holeId < 0) {
      await this.saveHole();
      holeId = this.holeId;
    }
    const positions = [...this.history, this.terrain.ball_position];
    const moves = [];
    for (let i = 0; i < positions.length - 1; i++) {
      moves.push({ from_x: positions[i][0], from_y: positions[i][1], to_x: positions[i+1][0], to_y: positions[i+1][1] });
    }
    const res = await fetch('/game/save-play', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hole_id: holeId, moves })
    });
    if (res.ok) {
      this.saved = true;
      document.getElementById('save-play-btn').hidden = true;
      document.getElementById('saved-msg').hidden = false;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const page = document.getElementById('game-page');
  if (page) new Game(page);
});
