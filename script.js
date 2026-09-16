const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const menu = document.getElementById("menu");
const pauseOverlay = document.getElementById("pause");
const gameoverOverlay = document.getElementById("gameover");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");

const W = 1000;
const H = 700;
const CELL = 25;
const GRID_W = W / CELL;
const GRID_H = H / CELL;
const FPS = 60;

const COLORS = {
  cream: "#1e1218",
  grid: "#563122",
  brown: "#fee2b6",
  white: "#fff7ed",
  black: "#1e1412",
  green: "#e8842b",
  greenLight: "#f7ae5c",
  panel: "#4d2730",
  accent: "#e0701f"
};

const FOOD_COLORS = {
  normal: "#cd7373",
  big: "#dcbf6e",
  gold: "#cda546",
  speed: "#87a5b4",
  slow: "#a58cb4",
  rainbow: "#da9196",
  poison: "#7d9b64"
};

let snake = [];
let prevSnake = [];
let direction = {x: 1, y: 0};
let nextDir = {x: 1, y: 0};
let food = null;
let foodType = "normal";

let score = 0;
let highScore = Number(localStorage.getItem("ularBaksoBest") || 0);

let moveTimer = 0;
const MOVE_TIME = 120;
let snakeSize = 22;
let targetSize = 22;
let sizeTimer = 0;
let speedTimer = 0;
let slowTimer = 0;
let rainbowMode = false;
let rainbowTimer = 0;
let particles = [];
let state = "MENU";
let lastTime = 0;

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function resetGame() {
  const x = Math.floor(GRID_W / 2);
  const y = Math.floor(GRID_H / 2);

  snake = [];
  for (let i = 0; i < 5; i++) snake.push({x: x - i, y});

  prevSnake = snake.map(p => ({...p}));
  direction = {x: 1, y: 0};
  nextDir = {x: 1, y: 0};

  score = 0;
  moveTimer = 0;
  snakeSize = targetSize = 22;
  sizeTimer = speedTimer = slowTimer = rainbowTimer = 0;
  rainbowMode = false;
  particles = [];
  spawnFood();
}

function spawnFood() {
  const available = [];
  for (let x = 2; x < GRID_W - 2; x++) {
    for (let y = 2; y < GRID_H - 2; y++) {
      if (!snake.some(s => s.x === x && s.y === y)) {
        available.push({x, y});
      }
    }
  }

  food = available.length ? available[Math.floor(Math.random() * available.length)] : null;

  const types = ["normal", "normal", "normal", "big", "gold", "speed", "slow", "rainbow", "poison"];
  foodType = types[Math.floor(Math.random() * types.length)];
}

function createParticles(x, y) {
  const color = FOOD_COLORS[foodType] || FOOD_COLORS.normal;

  for (let i = 0; i < 16; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 1 + Math.random() * 2;
    particles.push({
      x, y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: 20 + Math.floor(Math.random() * 16),
      color
    });
  }
}

function eatFood() {
  if (!food) return;

  createParticles(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2);

  const effects = {
    normal: [10, 1, 22, 0],
    big: [25, 2, 28, 300],
    gold: [50, 3, 30, 400],
    speed: [20, 0, 22, 0],
    slow: [20, 0, 22, 0],
    rainbow: [60, 4, 30, 450]
  };

  if (effects[foodType]) {
    const [pts, grow, size, time] = effects[foodType];
    score += pts;

    for (let i = 0; i < grow; i++) {
      snake.push({...snake[snake.length - 1]});
    }

    if (size > 22) {
      targetSize = size;
      sizeTimer = time;
    }

    if (foodType === "speed") speedTimer = 300;
    if (foodType === "slow") slowTimer = 300;
    if (foodType === "rainbow") {
      rainbowMode = true;
      rainbowTimer = 450;
    }
  } else if (foodType === "poison") {
    score = Math.max(0, score - 15);
    targetSize = 19;
    sizeTimer = 180;

    if (snake.length > 5) snake.splice(Math.max(0, snake.length - 2), 2);
  }

  highScore = Math.max(highScore, score);
  localStorage.setItem("ularBaksoBest", highScore);
  spawnFood();
}

function changeDir(d) {
  // Mencegah ular langsung berbalik arah.
  if (d.x + direction.x !== 0 || d.y + direction.y !== 0) {
    nextDir = d;
  }
}

function moveSnake() {
  direction = {...nextDir};
  prevSnake = snake.map(p => ({...p}));

  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y
  };

  snake.unshift(head);
  snake.pop();

  if (food && head.x === food.x && head.y === food.y) eatFood();

  const inside = head.x >= 0 && head.x < GRID_W && head.y >= 0 && head.y < GRID_H;
  const hitSelf = snake.slice(1).some(s => s.x === head.x && s.y === head.y);

  return inside && !hitSelf;
}

function roundRect(x, y, w, h, r, fill, stroke, lineWidth = 1) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

function drawPanel(x, y, w, h, color = COLORS.panel, radius = 22) {
  roundRect(x, y + 6, w, h, radius, "#d0c0aa");
  roundRect(x, y, w, h, radius, color, COLORS.grid, 2);
}

function drawGame(progress) {
  ctx.fillStyle = COLORS.cream;
  ctx.fillRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += CELL) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y <= H; y += CELL) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // Food
  if (food) {
    const fx = food.x * CELL + CELL / 2;
    const fy = food.y * CELL + CELL / 2;
    const r = 10 + Math.sin(performance.now() / 180) * 1.5;

    ctx.beginPath();
    ctx.arc(fx, fy, r, 0, Math.PI * 2);
    ctx.fillStyle = FOOD_COLORS[foodType] || FOOD_COLORS.normal;
    ctx.fill();
  }

  // Interpolated snake positions.
  const centers = [];
  snake.forEach((curr, i) => {
    const old = prevSnake[i] || curr;
    const cx = (old.x + (curr.x - old.x) * progress) * CELL + CELL / 2;
    const cy = (old.y + (curr.y - old.y) * progress) * CELL + CELL / 2;
    centers.push({x: cx, y: cy});
  });

  for (let i = centers.length - 1; i >= 0; i--) {
    const c = centers[i];
    const colorList = ["#968273", "#a5916e", "#829b78", "#7896a5", "#9b87a5"];
    const color = rainbowMode
      ? colorList[i % colorList.length]
      : (i === 0 ? COLORS.green : COLORS.greenLight);

    const size = Math.max(10, snakeSize - i * 0.18);

    ctx.beginPath();
    ctx.arc(c.x, c.y, size / 2, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  // Eyes
  if (centers.length) {
    const h = centers[0];
    const dx = direction.x;
    const dy = direction.y;

    const eyes = [
      {x: h.x + dx * 5 - dy * 5, y: h.y + dy * 5 + dx * 5},
      {x: h.x + dx * 5 + dy * 5, y: h.y + dy * 5 - dx * 5}
    ];

    eyes.forEach(e => {
      ctx.beginPath();
      ctx.arc(e.x, e.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.white;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(e.x, e.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.black;
      ctx.fill();
    });
  }

  // Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life--;

    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }

    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(2, p.life / 9), 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
  }

  // Score panel
  drawPanel(20, 18, 195, 70, COLORS.panel);
  ctx.fillStyle = COLORS.brown;
  ctx.font = "bold 24px Arial";
  ctx.fillText(`Score  ${score}`, 35, 51);
  ctx.font = "bold 17px Arial";
  ctx.fillText(`Best   ${highScore}`, 37, 79);
}

function setState(next) {
  state = next;
  menu.classList.toggle("hidden", state !== "MENU");
  pauseOverlay.classList.toggle("hidden", state !== "PAUSE");
  gameoverOverlay.classList.toggle("hidden", state !== "GAMEOVER");
}

function startGame() {
  resetGame();
  setState("PLAYING");
}

function gameLoop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  let dt = Math.min(timestamp - lastTime, 50);
  lastTime = timestamp;

  if (state === "PLAYING") {
    moveTimer += dt;

    if (sizeTimer > 0) {
      sizeTimer -= dt;
      if (sizeTimer <= 0) targetSize = 22;
    }

    speedTimer = Math.max(0, speedTimer - dt);
    slowTimer = Math.max(0, slowTimer - dt);

    if (rainbowTimer > 0) {
      rainbowTimer -= dt;
      if (rainbowTimer <= 0) rainbowMode = false;
    }

    snakeSize += (targetSize - snakeSize) * Math.min(1, dt / 100);

    const curSpeed = speedTimer > 0 ? 70 : (slowTimer > 0 ? 180 : MOVE_TIME);

    if (moveTimer >= curSpeed) {
      moveTimer -= curSpeed;
      if (!moveSnake()) setState("GAMEOVER");
    }

    drawGame(Math.min(1, moveTimer / curSpeed));
  } else {
    drawGame(1);
  }

  requestAnimationFrame(gameLoop);
}

const dirs = {
  ArrowUp: {x: 0, y: -1},
  w: {x: 0, y: -1},
  W: {x: 0, y: -1},
  ArrowDown: {x: 0, y: 1},
  s: {x: 0, y: 1},
  S: {x: 0, y: 1},
  ArrowLeft: {x: -1, y: 0},
  a: {x: -1, y: 0},
  A: {x: -1, y: 0},
  ArrowRight: {x: 1, y: 0},
  d: {x: 1, y: 0},
  D: {x: 1, y: 0}
};

window.addEventListener("keydown", e => {
  if (dirs[e.key]) {
    e.preventDefault();
    if (state === "PLAYING") changeDir(dirs[e.key]);
  } else if (e.key.toLowerCase() === "p" && (state === "PLAYING" || state === "PAUSE")) {
    setState(state === "PLAYING" ? "PAUSE" : "PLAYING");
  } else if (e.key === "Enter" && (state === "MENU" || state === "GAMEOVER")) {
    startGame();
  }
});

document.querySelectorAll("#controls button").forEach(btn => {
  const directionMap = {
    up: {x: 0, y: -1},
    down: {x: 0, y: 1},
    left: {x: -1, y: 0},
    right: {x: 1, y: 0}
  };

  const handle = e => {
    e.preventDefault();
    if (state === "PLAYING") changeDir(directionMap[btn.dataset.dir]);
  };

  btn.addEventListener("pointerdown", handle);
  btn.addEventListener("click", handle);
});

startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);

resetGame();
setState("MENU");
requestAnimationFrame(gameLoop);
