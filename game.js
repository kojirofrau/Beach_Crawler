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

const ENVIRONMENT_ASSETS = {
  floor: loadImage("assets/environment/sand_floor_tile_80s_anime.png"),
  wall: loadImage("assets/environment/coral_wall_tile_80s_anime.png"),
  stairs: loadImage("assets/environment/downward_stairs_80s_anime.png"),
};

const OBJECT_ASSETS = {
  coconutPotion: loadImage("assets/objects/coconut_potion_pickup_80s_anime.png"),
  pearlCache: loadImage("assets/objects/pearl_cache_pickup_80s_anime.png"),
};

const ENEMY_TYPES = [
  { id: "swordswoman", name: "Swordswoman", range: 1 },
  { id: "shooter", name: "Shooter", range: 3, minRange: 2 },
  { id: "fighter", name: "Fighter", range: 1 },
];

const ENEMY_ASSETS = Object.fromEntries(
  ENEMY_TYPES.map((type) => [
    type.id,
    {
      standby: loadEnemyFrames(type.id, "standby"),
      attack: loadEnemyFrames(type.id, "attack"),
      death: loadEnemyFrames(type.id, "death"),
    },
  ]),
);

const ATTACK_ASSETS = {
  waterPistolSplash: [
    loadImage("assets/attacks/water_pistol_splash_01.png"),
    loadImage("assets/attacks/water_pistol_splash_02.png"),
    loadImage("assets/attacks/water_pistol_splash_03.png"),
  ],
};

const EFFECT_ASSETS = {
  potionBubbles: [
    loadImage("assets/effects/potion/potion_bubbles_01.png"),
    loadImage("assets/effects/potion/potion_bubbles_02.png"),
    loadImage("assets/effects/potion/potion_bubbles_03.png"),
  ],
};

const WEAPON_ASSETS = {
  waterPistol: loadImage("assets/weapons/water_pistol_first_person.png"),
};

let game;
let lastFrame = performance.now();
let frames = 0;
let fps = 0;
let attackAnimation = null;
let potionAnimation = null;

function loadImage(src) {
  const image = new Image();
  image.src = src;
  return image;
}

function loadEnemyFrames(enemy, action) {
  return [1, 2, 3].map((frame) => loadImage(`assets/enemies/${enemy}/${enemy}_${action}_${String(frame).padStart(2, "0")}.png`));
}

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
  run.player.dir = startDirection(run);
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
        type: ENEMY_TYPES[index % ENEMY_TYPES.length].id,
        x: cell.x,
        y: cell.y,
        name: ENEMY_TYPES[index % ENEMY_TYPES.length].name,
        hp: 7 + run.floor * 3,
        maxHp: 7 + run.floor * 3,
        attack: 3 + Math.floor(run.floor / 2),
        xp: 5 + run.floor * 2,
        state: "standby",
        attackStartedAt: 0,
        diedAt: 0,
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
  logEvent(run, `Generated ${width}x${height} floor with ${run.monsters.length} enemies.`);
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

function startDirection(run) {
  return Math.max(
    0,
    DIRS.findIndex((dir) => !isWall(run, run.player.x + dir.x, run.player.y + dir.y)),
  );
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
  resolveRangedEnemyAttacks();
  updateUi();
}

function attackMonster(monster) {
  if (monster.state === "dying") return;
  const hit = game.player.attack + Math.floor(game.random() * 4);
  monster.hp -= hit;
  game.turn += 1;
  startWaterPistolAttack();
  if (monster.hp <= 0) {
    monster.hp = 0;
    monster.state = "dying";
    monster.diedAt = performance.now();
    gainXp(monster.xp);
    const message = `Defeated ${monster.name} for ${monster.xp} XP.`;
    game.lastMessage = message;
    logEvent(game, message);
  } else {
    const counter = monster.attack + Math.floor(game.random() * 3);
    startEnemyAttack(monster);
    game.player.hp = Math.max(0, game.player.hp - counter);
    const message = `Hit ${monster.name} for ${hit}. ${monster.name} strikes back for ${counter}.`;
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

function resolveRangedEnemyAttacks() {
  if (!game.player.alive) return;
  const shooters = game.monsters.filter((monster) => monster.type === "shooter" && monster.state !== "dying");
  const shooter = shooters.find((monster) => canShooterAttack(monster));
  if (!shooter) return;

  const damage = shooter.attack + Math.floor(game.random() * 3);
  startEnemyAttack(shooter);
  game.player.hp = Math.max(0, game.player.hp - damage);
  logEvent(game, `${shooter.name} sprays you from range for ${damage}.`);
  if (game.player.hp <= 0) {
    game.player.alive = false;
    game.lastMessage = "You collapse in the tide-warmed sand.";
    logEvent(game, "Run ended.");
  }
}

function canShooterAttack(monster) {
  const dx = game.player.x - monster.x;
  const dy = game.player.y - monster.y;
  const distance = Math.abs(dx) + Math.abs(dy);
  if (distance < 2 || distance > 3) return false;
  if (dx !== 0 && dy !== 0) return false;

  const stepX = Math.sign(dx);
  const stepY = Math.sign(dy);
  for (let i = 1; i < distance; i += 1) {
    if (isWall(game, monster.x + stepX * i, monster.y + stepY * i)) return false;
  }
  return true;
}

function startEnemyAttack(monster) {
  monster.state = "attack";
  monster.attackStartedAt = performance.now();
}

function startWaterPistolAttack() {
  attackAnimation = {
    startedAt: performance.now(),
    duration: 360,
  };
}

function startPotionAnimation() {
  potionAnimation = {
    startedAt: performance.now(),
    duration: 720,
  };
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
  startPotionAnimation();
  spendTurn("Coconut potion restored 12 HP.");
}

function isWall(run, x, y) {
  return y < 0 || x < 0 || y >= run.map.length || x >= run.map[0].length || run.map[y][x] === 1;
}

function monsterAt(run, x, y) {
  return run.monsters.find((monster) => monster.state !== "dying" && monster.x === x && monster.y === y);
}

function visibleMonsterAt(run, x, y) {
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
  const activeEnemies = game.monsters.filter((monster) => monster.state !== "dying").length;
  ui.entityText.textContent = `${activeEnemies} enemies / ${game.items.length} pickups`;
  ui.fpsText.textContent = fps.toString();
  ui.inventoryList.innerHTML = player.inventory.length
    ? player.inventory.map((item) => `<li>${item}</li>`).join("")
    : "<li>Empty</li>";
  ui.eventLog.innerHTML = game.events.map((event) => `<li>${event}</li>`).join("");
}

function render(now) {
  cleanupDyingEnemies(now);
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
  drawFloorTexture(width, height);

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
    drawWallTexture(ray, x, height / 2 - wallHeight / 2, sliceWidth, wallHeight, shade);
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
  drawAttackAnimation();
  drawHeldWeapon();
  drawPotionAnimation();
  drawCrosshair();
}

function cleanupDyingEnemies(now) {
  game.monsters = game.monsters.filter((monster) => monster.state !== "dying" || now - monster.diedAt < 2600);
}

function weaponLayout() {
  const size = Math.min(canvas.width * 0.69, canvas.height * 0.78);
  const x = canvas.width - size * 1.02;
  const y = canvas.height - size * 0.74;
  return {
    size,
    x,
    y,
    muzzleX: x + size * 0.28,
    muzzleY: y + size * 0.26,
  };
}

function drawAttackAnimation() {
  if (!attackAnimation) return;
  const elapsed = performance.now() - attackAnimation.startedAt;
  const progress = elapsed / attackAnimation.duration;
  if (progress >= 1) {
    attackAnimation = null;
    return;
  }

  const frames = ATTACK_ASSETS.waterPistolSplash;
  const frameIndex = Math.min(frames.length - 1, Math.floor(progress * frames.length));
  const image = frames[frameIndex];
  if (!image.complete || image.naturalWidth <= 0) return;

  const pulse = Math.sin(progress * Math.PI);
  const weapon = weaponLayout();
  const size = canvas.height * (0.27 + frameIndex * 0.105 + pulse * 0.09);
  const targetX = canvas.width * 0.46;
  const targetY = canvas.height * 0.43;
  const travel = 0.12 + progress * 0.5;
  const centerX = weapon.muzzleX + (targetX - weapon.muzzleX) * travel;
  const centerY = weapon.muzzleY + (targetY - weapon.muzzleY) * travel;

  ctx.save();
  ctx.globalAlpha = Math.max(0, 1 - progress * 0.35);
  ctx.drawImage(image, centerX - size / 2, centerY - size / 2, size, size);
  ctx.restore();
}

function drawHeldWeapon() {
  const image = WEAPON_ASSETS.waterPistol;
  if (!image.complete || image.naturalWidth <= 0) return;

  const { x, y, size } = weaponLayout();
  ctx.save();
  ctx.drawImage(image, x, y, size, size);
  ctx.restore();
}

function drawPotionAnimation() {
  if (!potionAnimation) return;
  const elapsed = performance.now() - potionAnimation.startedAt;
  const progress = elapsed / potionAnimation.duration;
  if (progress >= 1) {
    potionAnimation = null;
    return;
  }

  const frames = EFFECT_ASSETS.potionBubbles;
  const frameIndex = Math.min(frames.length - 1, Math.floor(progress * frames.length));
  const image = frames[frameIndex];
  if (!image.complete || image.naturalWidth <= 0) return;

  const pulse = Math.sin(progress * Math.PI);
  const size = Math.min(canvas.width * 1.16, canvas.height * (0.93 + pulse * 0.12));
  const x = canvas.width / 2 - size / 2;
  const y = canvas.height * (0.7 - progress * 0.06) - size / 2;

  ctx.save();
  ctx.globalAlpha = Math.min(1, 1.18 - progress * 0.42);
  ctx.drawImage(image, x, y, size, size);
  ctx.restore();
}

function drawFloorTexture(width, height) {
  const image = ENVIRONMENT_ASSETS.floor;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, height * 0.5, width, height * 0.5);
  ctx.clip();

  if (image.complete && image.naturalWidth > 0) {
    const horizon = height * 0.5;
    const rows = 64;
    for (let i = 0; i < rows; i += 1) {
      const topRatio = i / rows;
      const bottomRatio = (i + 1) / rows;
      const y1 = horizon + Math.pow(topRatio, 1.65) * (height - horizon);
      const y2 = horizon + Math.pow(bottomRatio, 1.65) * (height - horizon);
      const rowHeight = Math.max(1, y2 - y1 + 1);
      const perspective = Math.pow(bottomRatio, 1.2);
      const sourceHeight = Math.max(1, Math.floor(image.naturalHeight * (0.012 + perspective * 0.028)));
      const sourceWidth = Math.min(image.naturalWidth, Math.floor(image.naturalWidth * (0.34 + perspective * 0.66)));
      const sourceX = Math.floor((game.player.x * 53 + i * 7) % Math.max(1, image.naturalWidth - sourceWidth + 1));
      const sourceY = Math.floor(
        (game.player.y * 37 + i * 18 + game.turn * 0.35) % Math.max(1, image.naturalHeight - sourceHeight + 1),
      );
      const drawWidth = width * (0.55 + perspective * 1.55);
      const drawX = width / 2 - drawWidth / 2;

      ctx.globalAlpha = 0.32 + perspective * 0.48;
      ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, drawX, y1, drawWidth, rowHeight);
    }
    ctx.globalAlpha = 0.24;
    ctx.fillStyle = "#f7d987";
    ctx.fillRect(0, horizon, width, height - horizon);
  } else {
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = "#fff6dc";
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
  }
  ctx.restore();
}

function drawWallTexture(ray, x, y, width, height, shade) {
  if (height <= 0) return;
  const image = ENVIRONMENT_ASSETS.wall;
  ctx.save();
  if (image.complete && image.naturalWidth > 0) {
    const hitOffset = ray.side === "x" ? ray.hitY : ray.hitX;
    const texturePosition = ((hitOffset % 1) + 1) % 1;
    const textureX = Math.min(image.naturalWidth - 1, Math.floor(texturePosition * image.naturalWidth));
    ctx.globalAlpha = 0.36 + shade * 0.48;
    ctx.drawImage(image, textureX, 0, 1, image.naturalHeight, x, y, width, height);
    ctx.globalAlpha = Math.max(0.08, 0.48 - shade * 0.24);
    ctx.fillStyle = "#102026";
    ctx.fillRect(x, y, width, height);
  } else {
    ctx.globalAlpha = 0.12 + shade * 0.14;
    ctx.fillStyle = "#fff6dc";
    const offset = (Math.floor(x) % 11) * 0.12;
    for (let band = y + offset * height; band < y + height; band += Math.max(10, height * 0.12)) {
      ctx.fillRect(x, band, width, Math.max(1, height * 0.015));
    }
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
      const hitY = py + dy * distance;
      side = Math.abs(hitX - Math.round(hitX)) < 0.08 ? "x" : "y";
      return { distance, side, hitX, hitY };
    }
  }
  return { distance: 16, side, hitX: px + dx * 16, hitY: py + dy * 16 };
}

function drawForwardEntity() {
  const ahead = cellsAhead(6);
  for (let depth = 0; depth < ahead.length; depth += 1) {
    const cell = ahead[depth];
    const monster = visibleMonsterAt(game, cell.x, cell.y);
    const item = itemAt(game, cell.x, cell.y);
    const stairs = game.stairs.x === cell.x && game.stairs.y === cell.y;
    if (!monster && !item && !stairs) continue;

    const { x, groundY, size } = entityLayout(depth);
    if (monster) drawMonster(x, groundY, size, monster);
    if (item) drawPickup(x, groundY - size * 0.18, size * 0.42, item.type);
    if (stairs) drawStairs(x, groundY - size * 0.12, size * 0.6);
    break;
  }
}

function entityLayout(depth) {
  const distance = Math.min(depth / 5, 1);
  const perspective = 1 / (1 + depth * 0.58);
  const groundNear = canvas.height * 0.88;
  const groundFar = canvas.height * 0.54;
  return {
    x: canvas.width / 2,
    groundY: groundNear + (groundFar - groundNear) * Math.pow(distance, 0.75),
    size: Math.max(canvas.height * 0.18, canvas.height * 0.5 * perspective),
  };
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
  const { action, frameIndex } = enemyAnimationFrame(monster);
  const image = ENEMY_ASSETS[monster.type]?.[action]?.[frameIndex];
  if (image?.complete && image.naturalWidth > 0) {
    drawEnemySprite(x, y, size, image, action);
    if (monster.state !== "dying") drawMonsterHealthBar(x, y, size, monster);
  }
}

function enemyAnimationFrame(monster) {
  const now = performance.now();
  if (monster.state === "dying") {
    const frameIndex = Math.min(2, Math.floor((now - monster.diedAt) / 320));
    return { action: "death", frameIndex };
  }
  if (monster.state === "attack") {
    const elapsed = now - monster.attackStartedAt;
    if (elapsed < 540) return { action: "attack", frameIndex: Math.min(2, Math.floor(elapsed / 180)) };
    monster.state = "standby";
  }
  return { action: "standby", frameIndex: Math.floor(now / 220) % 3 };
}

function drawEnemySprite(x, y, size, image, action) {
  const scale =
    action === "death"
      ? Math.min((size * 0.62) / image.naturalHeight, (size * 1.42) / image.naturalWidth)
      : (size * 1.32) / image.naturalHeight;
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  const top = y - drawHeight;
  ctx.save();
  ctx.drawImage(image, x - drawWidth / 2, top, drawWidth, drawHeight);
  ctx.restore();
}

function drawMonsterHealthBar(x, y, size, monster) {
  const width = size * 0.72;
  const height = Math.max(6, size * 0.04);
  const filledWidth = width * (monster.hp / monster.maxHp);
  const left = x - width / 2;
  const top = y + size * 0.06;

  ctx.save();
  ctx.fillStyle = "rgba(16,32,38,0.72)";
  ctx.fillRect(left, top, width, height);
  ctx.fillStyle = "#d93434";
  ctx.fillRect(left, top, filledWidth, height);
  ctx.strokeStyle = "#fff6dc";
  ctx.lineWidth = Math.max(2, size * 0.02);
  ctx.strokeRect(left, top, width, height);
  ctx.restore();
}

function drawPickup(x, y, size, type) {
  const image = type === "Pearl cache" ? OBJECT_ASSETS.pearlCache : OBJECT_ASSETS.coconutPotion;
  if (image.complete && image.naturalWidth > 0) {
    const drawSize = size * 2.6;
    ctx.save();
    ctx.drawImage(image, x - drawSize / 2, y - drawSize / 2, drawSize, drawSize);
    ctx.restore();
    return;
  }

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
  const image = ENVIRONMENT_ASSETS.stairs;
  if (image.complete && image.naturalWidth > 0) {
    const drawSize = size * 1.8;
    ctx.save();
    ctx.drawImage(image, x - drawSize / 2, y - drawSize / 2, drawSize, drawSize);
    ctx.restore();
    return;
  }

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
  game.monsters
    .filter((monster) => monster.state !== "dying")
    .forEach((m) => ctx.fillRect(pad + m.x * scale, pad + m.y * scale, scale, scale));
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
