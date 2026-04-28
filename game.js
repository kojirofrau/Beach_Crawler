const canvas = document.querySelector("#dungeonView");
const ctx = canvas.getContext("2d");

const ui = {
  floorLabel: document.querySelector("#floorLabel"),
  turnChip: document.querySelector("#turnChip"),
  statusLine: document.querySelector("#statusLine"),
  hpText: document.querySelector("#hpText"),
  hpBar: document.querySelector("#hpBar"),
  xpText: document.querySelector("#xpText"),
  xpBar: document.querySelector("#xpBar"),
  levelText: document.querySelector("#levelText"),
  attackText: document.querySelector("#attackText"),
  shellText: document.querySelector("#shellText"),
  facingText: document.querySelector("#facingText"),
  inventoryList: document.querySelector("#inventoryList"),
  seedText: document.querySelector("#seedText"),
  positionText: document.querySelector("#positionText"),
  entityText: document.querySelector("#entityText"),
  fpsText: document.querySelector("#fpsText"),
  eventLog: document.querySelector("#eventLog"),
};

const DIRS = [
  { name: "N", x: 0, y: -1 },
  { name: "E", x: 1, y: 0 },
  { name: "S", x: 0, y: 1 },
  { name: "W", x: -1, y: 0 },
];

const THEMES = [
  { name: "Sunken Boardwalk", wall: "#b9744d", floor: "#d9a552", accent: "#49b7c4" },
  { name: "Coral Gallery", wall: "#d85f57", floor: "#e6bd71", accent: "#2a9d8f" },
  { name: "Tide-Pool Ruins", wall: "#7bb8b0", floor: "#caa66a", accent: "#f4a261" },
  { name: "Shellgate Reef", wall: "#e3c17b", floor: "#c98d58", accent: "#5fb3a8" },
];

let game;
let lastFrame = performance.now();
let frames = 0;
let fps = 0;

function mulberry32(seed) {
  return function random() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createGame(seed = Date.now() % 1000000) {
  const run = {
    seed,
    random: mulberry32(seed),
    floor: 1,
    turn: 0,
    player: {
      x: 1,
      y: 1,
      dir: 1,
      hp: 24,
      maxHp: 24,
      level: 1,
      xp: 0,
      nextXp: 12,
      attack: 5,
      shells: 0,
      inventory: ["Coconut potion"],
      alive: true,
    },
    map: [],
    monsters: [],
    items: [],
    stairs: { x: 1, y: 1 },
    events: [],
    lastMessage: "The sun is high. The maze is waiting.",
  };
  buildFloor(run);
  logEvent(run, "New run started.");
  return run;
}

function buildFloor(run) {
  const size = 15 + Math.min(8, run.floor * 2);
  const width = size % 2 === 0 ? size + 1 : size;
  const height = width;
  run.map = Array.from({ length: height }, () => Array(width).fill(1));
  carveMaze(run, 1, 1);
  addLoops(run, Math.floor(width * height * 0.05));
  const open = getOpenCells(run);
  const far = [...open].sort((a, b) => b.dist - a.dist)[0];
  run.player.x = 1;
  run.player.y = 1;
  run.player.dir = 1;
  run.stairs = { x: far.x, y: far.y };
  run.monsters = [];
  run.items = [];

  const monsterCount = Math.min(6 + run.floor, 14);
  const itemCount = 4 + Math.floor(run.floor / 2);
  shuffle(open, run.random)
    .filter((cell) => cell.dist > 5 && !(cell.x === far.x && cell.y === far.y))
    .slice(0, monsterCount)
    .forEach((cell, index) => {
      run.monsters.push({
        id: `m${run.floor}-${index}`,
        x: cell.x,
        y: cell.y,
        name: index % 3 === 0 ? "Crab guard" : index % 3 === 1 ? "Kelp shade" : "Glass gull",
        hp: 7 + run.floor * 3,
        maxHp: 7 + run.floor * 3,
        attack: 2 + Math.floor(run.floor / 2),
        xp: 5 + run.floor * 2,
      });
    });

  shuffle(open, run.random)
    .filter((cell) => cell.dist > 3 && !monsterAt(run, cell.x, cell.y))
    .slice(0, itemCount)
    .forEach((cell, index) => {
      const type = index % 2 === 0 ? "Coconut potion" : "Pearl cache";
      run.items.push({ id: `i${run.floor}-${index}`, x: cell.x, y: cell.y, type });
    });

  run.lastMessage = `Floor ${run.floor}: ${theme(run).name}`;
  logEvent(run, `Generated ${width}x${height} floor with ${run.monsters.length} monsters.`);
}

function carveMaze(run, x, y) {
  run.map[y][x] = 0;
  const dirs = shuffle(
    [
      [2, 0],
      [-2, 0],
      [0, 2],
      [0, -2],
    ],
    run.random,
  );
  for (const [dx, dy] of dirs) {
    const nx = x + dx;
    const ny = y + dy;
    if (ny <= 0 || nx <= 0 || ny >= run.map.length - 1 || nx >= run.map[0].length - 1) continue;
    if (run.map[ny][nx] === 1) {
      run.map[y + dy / 2][x + dx / 2] = 0;
      carveMaze(run, nx, ny);
    }
  }
}

function addLoops(run, count) {
  for (let i = 0; i < count; i += 1) {
    const x = 2 + Math.floor(run.random() * (run.map[0].length - 4));
    const y = 2 + Math.floor(run.random() * (run.map.length - 4));
    if (x % 2 !== y % 2) run.map[y][x] = 0;
  }
}

function getOpenCells(run) {
  const cells = [];
  for (let y = 1; y < run.map.length - 1; y += 1) {
    for (let x = 1; x < run.map[0].length - 1; x += 1) {
      if (run.map[y][x] === 0) cells.push({ x, y, dist: Math.abs(x - 1) + Math.abs(y - 1) });
    }
  }
  return cells;
}

function shuffle(list, random) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function theme(run) {
  return THEMES[(run.floor - 1) % THEMES.length];
}

function act(action) {
  if (!game.player.alive) {
    logEvent(game, "Start a new run to continue.");
    updateUi();
    return;
  }

  if (action === "left" || action === "right") {
    game.player.dir = (game.player.dir + (action === "left" ? 3 : 1)) % 4;
    spendTurn(`Turned ${action}.`);
    return;
  }

  const dir = DIRS[game.player.dir];
  const step = action === "back" ? -1 : 1;
  const nx = game.player.x + dir.x * step;
  const ny = game.player.y + dir.y * step;
  if (isWall(game, nx, ny)) {
    spendTurn("Bumped into warm coral-stone.");
    return;
  }

  const monster = monsterAt(game, nx, ny);
  if (monster) {
    attackMonster(monster);
    return;
  }

  game.player.x = nx;
  game.player.y = ny;
  const item = itemAt(game, nx, ny);
  if (item) pickUp(item);
  if (game.stairs.x === nx && game.stairs.y === ny) nextFloor();
  else spendTurn("Moved through the sandy passage.");
}

function spendTurn(message) {
  game.turn += 1;
  game.lastMessage = message;
  logEvent(game, message);
  updateUi();
}

function attackMonster(monster) {
  const hit = game.player.attack + Math.floor(game.random() * 4);
  monster.hp -= hit;
  game.turn += 1;
  if (monster.hp <= 0) {
    game.monsters = game.monsters.filter((enemy) => enemy.id !== monster.id);
    game.player.x = monster.x;
    game.player.y = monster.y;
    gainXp(monster.xp);
    const message = `Defeated ${monster.name} for ${monster.xp} XP.`;
    game.lastMessage = message;
    logEvent(game, message);
  } else {
    const counter = monster.attack + Math.floor(game.random() * 3);
    game.player.hp = Math.max(0, game.player.hp - counter);
    const message = `Hit ${monster.name} for ${hit}. It bites back for ${counter}.`;
    game.lastMessage = message;
    logEvent(game, message);
    if (game.player.hp <= 0) {
      game.player.alive = false;
      game.lastMessage = "You collapse in the tide-warmed sand.";
      logEvent(game, "Run ended.");
    }
  }
  updateUi();
}

function gainXp(amount) {
  game.player.xp += amount;
  while (game.player.xp >= game.player.nextXp) {
    game.player.xp -= game.player.nextXp;
    game.player.level += 1;
    game.player.nextXp += 8;
    game.player.maxHp += 6;
    game.player.hp = game.player.maxHp;
    game.player.attack += 2;
    logEvent(game, `Leveled up to ${game.player.level}.`);
  }
}

function pickUp(item) {
  game.items = game.items.filter((entry) => entry.id !== item.id);
  if (item.type === "Pearl cache") {
    const shells = 3 + Math.floor(game.random() * 6);
    game.player.shells += shells;
    logEvent(game, `Collected ${shells} shells.`);
  } else {
    game.player.inventory.push(item.type);
    logEvent(game, `Picked up ${item.type}.`);
  }
}

function nextFloor() {
  game.floor += 1;
  game.player.hp = Math.min(game.player.maxHp, game.player.hp + 7);
  buildFloor(game);
  spendTurn("Descended to the next beach labyrinth.");
}

function usePotion() {
  const index = game.player.inventory.indexOf("Coconut potion");
  if (index === -1 || !game.player.alive) {
    logEvent(game, "No potion ready.");
    updateUi();
    return;
  }
  game.player.inventory.splice(index, 1);
  game.player.hp = Math.min(game.player.maxHp, game.player.hp + 12);
  spendTurn("Coconut potion restored 12 HP.");
}

function isWall(run, x, y) {
  return y < 0 || x < 0 || y >= run.map.length || x >= run.map[0].length || run.map[y][x] === 1;
}

function monsterAt(run, x, y) {
  return run.monsters.find((monster) => monster.x === x && monster.y === y);
}

function itemAt(run, x, y) {
  return run.items.find((item) => item.x === x && item.y === y);
}

function logEvent(run, message) {
  run.events.unshift(`[${run.turn}] ${message}`);
  run.events = run.events.slice(0, 24);
}

function updateUi() {
  const player = game.player;
  const hpPercent = Math.max(0, (player.hp / player.maxHp) * 100);
  const xpPercent = Math.max(0, (player.xp / player.nextXp) * 100);
  ui.floorLabel.textContent = `Floor ${game.floor} - ${theme(game).name}`;
  ui.turnChip.textContent = `Turn ${game.turn}`;
  ui.statusLine.textContent = game.lastMessage;
  ui.hpText.textContent = `${player.hp}/${player.maxHp}`;
  ui.hpBar.style.width = `${hpPercent}%`;
  ui.xpText.textContent = `${player.xp}/${player.nextXp}`;
  ui.xpBar.style.width = `${xpPercent}%`;
  ui.levelText.textContent = player.level;
  ui.attackText.textContent = player.attack;
  ui.shellText.textContent = player.shells;
  ui.facingText.textContent = DIRS[player.dir].name;
  ui.seedText.textContent = game.seed;
  ui.positionText.textContent = `${player.x}, ${player.y}`;
  ui.entityText.textContent = `${game.monsters.length} monsters / ${game.items.length} pickups`;
  ui.fpsText.textContent = fps.toString();
  ui.inventoryList.innerHTML = player.inventory.length
    ? player.inventory.map((item) => `<li>${item}</li>`).join("")
    : "<li>Empty</li>";
  ui.eventLog.innerHTML = game.events.map((event) => `<li>${event}</li>`).join("");
}

function render(now) {
  resizeCanvas();
  drawScene();
  drawMinimap();
  frames += 1;
  if (now - lastFrame > 500) {
    fps = Math.round((frames * 1000) / (now - lastFrame));
    frames = 0;
    lastFrame = now;
    updateUi();
  }
  requestAnimationFrame(render);
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;
  const width = Math.floor(rect.width * scale);
  const height = Math.floor(rect.height * scale);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
}

function drawScene() {
  const t = theme(game);
  const themeIndex = (game.floor - 1) % THEMES.length;
  const width = canvas.width;
  const height = canvas.height;
  const sky = ctx.createLinearGradient(0, 0, 0, height * 0.5);
  sky.addColorStop(0, "#73d2de");
  sky.addColorStop(1, "#f7d987");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height * 0.5);
  const floor = ctx.createLinearGradient(0, height * 0.5, 0, height);
  floor.addColorStop(0, t.floor);
  floor.addColorStop(1, "#7a5630");
  ctx.fillStyle = floor;
  ctx.fillRect(0, height * 0.5, width, height * 0.5);
  drawFloorTexture(themeIndex, width, height);

  const rays = 180;
  const fov = Math.PI / 3;
  const baseAngle = (game.player.dir - 1) * (Math.PI / 2);
  for (let i = 0; i < rays; i += 1) {
    const angle = baseAngle - fov / 2 + (i / (rays - 1)) * fov;
    const ray = castRay(angle);
    const corrected = ray.distance * Math.cos(angle - baseAngle);
    const wallHeight = Math.min(height, height / (corrected * 0.68));
    const shade = Math.max(0.22, 1 - corrected / 11);
    const x = (i / rays) * width;
    const sliceWidth = Math.ceil(width / rays) + 1;
    ctx.fillStyle = shadeColor(t.wall, shade);
    ctx.fillRect(x, height / 2 - wallHeight / 2, sliceWidth, wallHeight);
    drawWallTexture(i, x, height / 2 - wallHeight / 2, sliceWidth, wallHeight, shade, themeIndex);
    if (ray.side === "x") {
      ctx.fillStyle = `rgba(16,32,38,${0.18 + (1 - shade) * 0.35})`;
      ctx.fillRect(x, height / 2 - wallHeight / 2, sliceWidth, wallHeight);
    }
    if (i % 8 === 0) {
      ctx.fillStyle = `rgba(255,246,220,${0.08 * shade})`;
      ctx.fillRect(x, height / 2 - wallHeight / 2, 2, wallHeight);
    }
  }

  drawForwardEntity();
  drawCrosshair();
}

function drawFloorTexture(themeIndex, width, height) {
  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.strokeStyle = themeIndex % 2 === 0 ? "#fff6dc" : "#49b7c4";
  ctx.lineWidth = 1;
  for (let y = height * 0.56; y < height; y += 18) {
    const drift = Math.sin(y * 0.035 + game.turn * 0.03) * 12;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= width; x += 36) {
      ctx.lineTo(x, y + Math.sin(x * 0.025 + y * 0.04) * 4 + drift);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawWallTexture(rayIndex, x, y, width, height, shade, themeIndex) {
  if (height <= 0) return;
  ctx.save();
  ctx.globalAlpha = 0.12 + shade * 0.14;
  ctx.fillStyle = themeIndex % 2 === 0 ? "#fff6dc" : "#102026";
  const offset = (rayIndex % 11) * 0.12;
  for (let band = y + offset * height; band < y + height; band += Math.max(10, height * 0.12)) {
    ctx.fillRect(x, band, width, Math.max(1, height * 0.015));
  }
  ctx.restore();
}

function castRay(angle) {
  const px = game.player.x + 0.5;
  const py = game.player.y + 0.5;
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  let distance = 0;
  let side = "x";
  while (distance < 16) {
    distance += 0.035;
    const x = Math.floor(px + dx * distance);
    const y = Math.floor(py + dy * distance);
    if (isWall(game, x, y)) {
      const hitX = px + dx * distance;
      side = Math.abs(hitX - Math.round(hitX)) < 0.08 ? "x" : "y";
      return { distance, side };
    }
  }
  return { distance: 16, side };
}

function drawForwardEntity() {
  const ahead = cellsAhead(6);
  for (let depth = ahead.length - 1; depth >= 0; depth -= 1) {
    const cell = ahead[depth];
    const monster = monsterAt(game, cell.x, cell.y);
    const item = itemAt(game, cell.x, cell.y);
    const stairs = game.stairs.x === cell.x && game.stairs.y === cell.y;
    if (!monster && !item && !stairs) continue;

    const scale = 1 / (depth + 1);
    const cx = canvas.width / 2;
    const cy = canvas.height * (0.58 + depth * 0.015);
    const size = canvas.height * 0.52 * scale;
    if (monster) drawMonster(cx, cy, size, monster);
    if (item) drawPickup(cx, cy, size * 0.42, item.type);
    if (stairs) drawStairs(cx, cy, size * 0.6);
    break;
  }
}

function cellsAhead(max) {
  const dir = DIRS[game.player.dir];
  const cells = [];
  for (let i = 1; i <= max; i += 1) {
    const x = game.player.x + dir.x * i;
    const y = game.player.y + dir.y * i;
    if (isWall(game, x, y)) break;
    cells.push({ x, y });
  }
  return cells;
}

function drawMonster(x, y, size, monster) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#e76f51";
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.38, size * 0.24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff6dc";
  ctx.beginPath();
  ctx.arc(-size * 0.13, -size * 0.1, size * 0.045, 0, Math.PI * 2);
  ctx.arc(size * 0.13, -size * 0.1, size * 0.045, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#f7d987";
  ctx.lineWidth = Math.max(2, size * 0.025);
  ctx.strokeRect(-size * 0.32, size * 0.28, size * 0.64 * (monster.hp / monster.maxHp), 5);
  ctx.restore();
}

function drawPickup(x, y, size, type) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = type === "Pearl cache" ? "#fff6dc" : "#2a9d8f";
  ctx.beginPath();
  ctx.arc(0, 0, size, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#102026";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
}

function drawStairs(x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#102026";
  for (let i = 0; i < 5; i += 1) {
    ctx.fillRect(-size / 2 + i * 8, i * 9, size - i * 16, 7);
  }
  ctx.restore();
}

function drawCrosshair() {
  const x = canvas.width / 2;
  const y = canvas.height / 2;
  ctx.strokeStyle = "rgba(255,246,220,0.45)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 12, y);
  ctx.lineTo(x + 12, y);
  ctx.moveTo(x, y - 12);
  ctx.lineTo(x, y + 12);
  ctx.stroke();
}

function drawMinimap() {
  const scale = Math.max(4, Math.min(7, Math.floor(canvas.width / 170)));
  const pad = 14;
  ctx.save();
  ctx.globalAlpha = 0.86;
  ctx.fillStyle = "rgba(16,32,38,0.86)";
  ctx.fillRect(pad - 6, pad - 6, game.map[0].length * scale + 12, game.map.length * scale + 12);
  for (let y = 0; y < game.map.length; y += 1) {
    for (let x = 0; x < game.map[0].length; x += 1) {
      ctx.fillStyle = game.map[y][x] ? "#7a5630" : "#f2c873";
      ctx.fillRect(pad + x * scale, pad + y * scale, scale - 1, scale - 1);
    }
  }
  ctx.fillStyle = "#e76f51";
  game.monsters.forEach((m) => ctx.fillRect(pad + m.x * scale, pad + m.y * scale, scale, scale));
  ctx.fillStyle = "#2a9d8f";
  game.items.forEach((item) => ctx.fillRect(pad + item.x * scale, pad + item.y * scale, scale, scale));
  ctx.fillStyle = "#fff6dc";
  ctx.fillRect(pad + game.stairs.x * scale, pad + game.stairs.y * scale, scale, scale);
  ctx.fillStyle = "#102026";
  ctx.fillRect(pad + game.player.x * scale, pad + game.player.y * scale, scale, scale);
  ctx.restore();
}

function shadeColor(hex, amount) {
  const value = Number.parseInt(hex.slice(1), 16);
  const r = Math.floor(((value >> 16) & 255) * amount);
  const g = Math.floor(((value >> 8) & 255) * amount);
  const b = Math.floor((value & 255) * amount);
  return `rgb(${r}, ${g}, ${b})`;
}

document.querySelectorAll("[data-action]").forEach((button) => {
  button.addEventListener("click", () => act(button.dataset.action));
});

document.querySelector("#usePotion").addEventListener("click", usePotion);
document.querySelector("#newRun").addEventListener("click", () => {
  game = createGame();
  updateUi();
});

window.addEventListener("keydown", (event) => {
  const keyMap = {
    ArrowUp: "forward",
    ArrowDown: "back",
    ArrowLeft: "left",
    ArrowRight: "right",
    w: "forward",
    s: "back",
    a: "left",
    d: "right",
  };
  if (keyMap[event.key]) {
    event.preventDefault();
    act(keyMap[event.key]);
  }
  if (event.key.toLowerCase() === "q") usePotion();
});

game = createGame();
updateUi();
requestAnimationFrame(render);
