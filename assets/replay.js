document.addEventListener('DOMContentLoaded', () => {
  const controls = document.getElementById('replay-controls');
  if (!controls) return;

  const positions = JSON.parse(controls.dataset.positions || '[]');
  const total = positions.length > 0 ? positions.length - 1 : 0;
  let step = 0;
  let playing = false;
  let speed = 500;
  let timer = null;

  const ball = document.getElementById('replay-ball');
  const path = document.getElementById('replay-path');
  const stepEl = document.getElementById('replay-step');
  const finishedEl = document.getElementById('replay-finished');

  function render() {
    const [x, y] = positions[step] || [0, 0];
    ball.setAttribute('cx', x * 10 + 5);
    ball.setAttribute('cy', y * 10 + 5);
    if (path && step > 0) {
      let d = `M ${positions[0][0]*10+5} ${positions[0][1]*10+5}`;
      for (let i = 1; i <= step; i++) {
        d += ` L ${positions[i][0]*10+5} ${positions[i][1]*10+5}`;
      }
      path.setAttribute('d', d);
    }
    stepEl.textContent = step;
    finishedEl.hidden = step < total;
    document.getElementById('replay-back').disabled = step === 0;
    document.getElementById('replay-forward').disabled = step >= total;
  }

  function pause() {
    playing = false;
    if (timer) { clearInterval(timer); timer = null; }
    document.getElementById('replay-play').textContent = '▶';
  }

  function play() {
    if (step >= total) step = 0;
    playing = true;
    document.getElementById('replay-play').textContent = '⏸';
    timer = setInterval(() => {
      if (step < total) { step++; render(); }
      else pause();
    }, speed);
  }

  document.getElementById('replay-reset')?.addEventListener('click', () => { pause(); step = 0; render(); });
  document.getElementById('replay-back')?.addEventListener('click', () => { pause(); if (step > 0) { step--; render(); } });
  document.getElementById('replay-forward')?.addEventListener('click', () => { pause(); if (step < total) { step++; render(); } });
  document.getElementById('replay-play')?.addEventListener('click', () => { playing ? pause() : play(); });
  document.querySelectorAll('.speed-controls button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.speed-controls button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      speed = parseInt(btn.dataset.speed, 10);
      if (playing) { pause(); play(); }
    });
  });

  render();
});
