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
  playerPortrait: document.querySelector("#playerPortrait"),
  attackText: document.querySelector("#attackText"),
  shellText: document.querySelector("#shellText"),
  facingText: document.querySelector("#facingText"),
  potionSlots: Array.from(document.querySelectorAll("[data-potion-slot]")),
  levelStartCard: document.querySelector("#levelStartCard"),
  levelStartTitle: document.querySelector("#levelStartTitle"),
  levelCompleteCard: document.querySelector("#levelCompleteCard"),
  summaryDefeated: document.querySelector("#summaryDefeated"),
  summaryShells: document.querySelector("#summaryShells"),
  summaryPotions: document.querySelector("#summaryPotions"),
  defeatCard: document.querySelector("#defeatCard"),
  defeatSummaryDefeated: document.querySelector("#defeatSummaryDefeated"),
  defeatSummaryPotions: document.querySelector("#defeatSummaryPotions"),
  defeatSummaryShells: document.querySelector("#defeatSummaryShells"),
  debugWindow: document.querySelector("#debugWindow"),
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
  hearts: [1, 2, 3, 4, 5].map((index) => loadImage(`assets/effects/hearts/heart_${String(index).padStart(2, "0")}.png`)),
};

const WEAPON_ASSETS = {
  waterPistol: loadImage("assets/weapons/water_pistol_first_person.png"),
};

const MAX_POTIONS = 3;

const HEART_OVERLAY = {
  lowHealthThreshold: 0.5,
  edgeCount: 62,
  deathCount: 190,
};

const PLAYER_PORTRAIT_ASSETS = {
  smile: loadPlayerPortraitFrames("smile", 6),
  lookRight: loadPlayerPortraitFrames("look_right", 3),
  lookLeft: loadPlayerPortraitFrames("look_left", 3),
  pain: loadPlayerPortraitFrames("pain", 3),
  wet: loadPlayerPortraitFrames("wet", 6),
  death: loadPlayerPortraitFrames("death", 3),
};

const ENEMY_RENDERING = {
  maxDistance: 6.4,
  halfCellDepth: 0.42,
  visibleHeight: 1.34,
  deathHeight: 0.74,
  closeRange: 1,
  normalRange: 2.25,
  closeScale: 0.45,
};

const ENEMY_DEATH_DISSOLVE = {
  poseDuration: 960,
  dissolveDuration: 2200,
  columns: 14,
  rows: 12,
};

const ENEMY_SPRITE_BOUNDS = {
  "fighter_attack_01.png": { x: 12, y: 12, width: 160, height: 416 },
  "fighter_attack_02.png": { x: 12, y: 12, width: 170, height: 420 },
  "fighter_attack_03.png": { x: 12, y: 12, width: 300, height: 415 },
  "fighter_death_01.png": { x: 11, y: 11, width: 308, height: 345 },
  "fighter_death_02.png": { x: 12, y: 11, width: 302, height: 260 },
  "fighter_death_03.png": { x: 12, y: 12, width: 426, height: 110 },
  "fighter_standby_01.png": { x: 11, y: 12, width: 203, height: 410 },
  "fighter_standby_02.png": { x: 12, y: 12, width: 204, height: 413 },
  "fighter_standby_03.png": { x: 11, y: 10, width: 206, height: 418 },
  "shooter_attack_01.png": { x: 12, y: 12, width: 249, height: 389 },
  "shooter_attack_02.png": { x: 12, y: 11, width: 258, height: 390 },
  "shooter_attack_03.png": { x: 12, y: 12, width: 300, height: 388 },
  "shooter_death_01.png": { x: 12, y: 12, width: 302, height: 302 },
  "shooter_death_02.png": { x: 12, y: 12, width: 327, height: 256 },
  "shooter_death_03.png": { x: 12, y: 11, width: 384, height: 164 },
  "shooter_standby_01.png": { x: 12, y: 12, width: 181, height: 440 },
  "shooter_standby_02.png": { x: 12, y: 12, width: 191, height: 440 },
  "shooter_standby_03.png": { x: 11, y: 12, width: 138, height: 437 },
  "swordswoman_attack_01.png": { x: 12, y: 12, width: 307, height: 415 },
  "swordswoman_attack_02.png": { x: 12, y: 12, width: 319, height: 399 },
  "swordswoman_attack_03.png": { x: 12, y: 12, width: 384, height: 403 },
  "swordswoman_death_01.png": { x: 12, y: 12, width: 341, height: 316 },
  "swordswoman_death_02.png": { x: 12, y: 12, width: 358, height: 246 },
  "swordswoman_death_03.png": { x: 0, y: 12, width: 444, height: 169 },
  "swordswoman_standby_01.png": { x: 11, y: 12, width: 229, height: 422 },
  "swordswoman_standby_02.png": { x: 12, y: 11, width: 241, height: 423 },
  "swordswoman_standby_03.png": { x: 11, y: 12, width: 286, height: 424 },
};

let game;
let lastFrame = performance.now();
let frames = 0;
let fps = 0;
let attackAnimation = null;
let potionAnimation = null;
let playerPortraitCue = null;
let currentPortraitSrc = "";
let levelStartTimer = null;
let levelCompletionPending = false;
const debugKeyChord = new Set();

function loadImage(src) {
  const image = new Image();
  image.src = src;
  return image;
}

function loadEnemyFrames(enemy, action) {
  return [1, 2, 3].map((frame) => loadImage(`assets/enemies/${enemy}/${enemy}_${action}_${String(frame).padStart(2, "0")}.png`));
}

function loadPlayerPortraitFrames(action, count) {
  return Array.from({ length: count }, (_, index) => loadImage(`assets/player/portrait/${action}_${String(index + 1).padStart(2, "0")}.png`));
}

function createFloorStats() {
  return {
    defeatedGirls: 0,
    shellsCollected: 0,
    potionsUsed: 0,
  };
}

function createRunStats() {
  return {
    defeatedGirls: 0,
    shellsCollected: 0,
    potionsUsed: 0,
  };
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
    floorStats: createFloorStats(),
    runStats: createRunStats(),
    events: [],
    lastMessage: "The sun is high. The maze is waiting.",
  };
  buildFloor(run);
  logEvent(run, "New run started.");
  return run;
}

function buildFloor(run) {
  run.floorStats = createFloorStats();
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
  if (levelCompletionPending) return;

  if (!game.player.alive) {
    logEvent(game, "Start a new run to continue.");
    updateUi();
    return;
  }

  if (action === "left" || action === "right") {
    startPlayerPortraitCue(action === "left" ? "lookLeft" : "lookRight");
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
  if (game.stairs.x === nx && game.stairs.y === ny) completeLevel();
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
    monster.deathSeed = hashString(`${monster.id}-${game.turn}-${monster.x}-${monster.y}`);
    game.floorStats.defeatedGirls += 1;
    game.runStats.defeatedGirls += 1;
    gainXp(monster.xp);
    const message = `Defeated ${monster.name} for ${monster.xp} XP.`;
    game.lastMessage = message;
    logEvent(game, message);
  } else {
    const counter = monster.attack + Math.floor(game.random() * 3);
    startEnemyAttack(monster);
    damagePlayer(counter);
    const message = `Hit ${monster.name} for ${hit}. ${monster.name} strikes back for ${counter}.`;
    game.lastMessage = message;
    logEvent(game, message);
    if (game.player.hp <= 0) {
      defeatPlayer();
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
  damagePlayer(damage);
  logEvent(game, `${shooter.name} sprays you from range for ${damage}.`);
  if (game.player.hp <= 0) {
    defeatPlayer();
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

function startPlayerPortraitCue(action) {
  playerPortraitCue = {
    action,
    startedAt: performance.now(),
  };
}

function damagePlayer(amount) {
  game.player.hp = Math.max(0, game.player.hp - amount);
  startPlayerPortraitCue(game.player.hp <= 0 ? "death" : "pain");
}

function defeatPlayer() {
  if (!game.player.alive) return;
  game.player.alive = false;
  game.lastMessage = "You collapse in the tide-warmed sand.";
  logEvent(game, "Run ended.");
  showDefeatCard();
}

function potionCount() {
  return game.player.inventory.filter((item) => item === "Coconut potion").length;
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
  if (item.type === "Pearl cache") {
    game.items = game.items.filter((entry) => entry.id !== item.id);
    const shells = 3 + Math.floor(game.random() * 6);
    game.player.shells += shells;
    game.floorStats.shellsCollected += shells;
    game.runStats.shellsCollected += shells;
    logEvent(game, `Collected ${shells} shells.`);
  } else if (potionCount() < MAX_POTIONS) {
    game.items = game.items.filter((entry) => entry.id !== item.id);
    game.player.inventory.push(item.type);
    logEvent(game, `Picked up ${item.type}.`);
  } else {
    logEvent(game, "Potion rack is full.");
  }
}

function nextFloor(spendTransitionTurn = true) {
  game.floor += 1;
  game.player.hp = game.player.maxHp;
  buildFloor(game);
  showLevelStartCard();
  if (spendTransitionTurn) {
    spendTurn("Descended to the next beach labyrinth.");
  } else {
    game.lastMessage = "Descended to the next beach labyrinth.";
    logEvent(game, game.lastMessage);
    updateUi();
  }
}

function completeLevel() {
  if (levelCompletionPending) return;
  game.turn += 1;
  levelCompletionPending = true;
  game.lastMessage = "Level complete. Press any key to continue.";
  logEvent(game, "Level complete.");
  showLevelCompleteCard();
  updateUi();
}

function usePotion() {
  if (levelCompletionPending) return;

  const index = game.player.inventory.indexOf("Coconut potion");
  if (index === -1 || !game.player.alive) {
    logEvent(game, "No potion ready.");
    updateUi();
    return;
  }
  game.player.inventory.splice(index, 1);
  game.player.hp = Math.min(game.player.maxHp, game.player.hp + 12);
  game.floorStats.potionsUsed += 1;
  game.runStats.potionsUsed += 1;
  startPotionAnimation();
  spendTurn("Coconut potion restored 12 HP.");
}

function isWall(run, x, y) {
  return y < 0 || x < 0 || y >= run.map.length || x >= run.map[0].length || run.map[y][x] === 1;
}

function monsterAt(run, x, y) {
  return run.monsters.find((monster) => monster.state !== "dying" && monster.x === x && monster.y === y);
}

function itemAt(run, x, y) {
  return run.items.find((item) => item.x === x && item.y === y);
}

function logEvent(run, message) {
  run.events.unshift(`[${run.turn}] ${message}`);
  run.events = run.events.slice(0, 24);
}

function showLevelStartCard() {
  if (levelStartTimer) clearTimeout(levelStartTimer);
  ui.levelStartTitle.textContent = `Floor ${game.floor}: ${theme(game).name}`;
  ui.levelStartCard.classList.remove("visible");
  ui.levelStartCard.setAttribute("aria-hidden", "false");
  void ui.levelStartCard.offsetWidth;
  ui.levelStartCard.classList.add("visible");
  levelStartTimer = setTimeout(() => {
    ui.levelStartCard.classList.remove("visible");
    ui.levelStartCard.setAttribute("aria-hidden", "true");
    levelStartTimer = null;
  }, 5000);
}

function showLevelCompleteCard() {
  if (levelStartTimer) {
    clearTimeout(levelStartTimer);
    levelStartTimer = null;
  }
  ui.levelStartCard.classList.remove("visible");
  ui.levelStartCard.setAttribute("aria-hidden", "true");
  ui.summaryDefeated.textContent = game.floorStats.defeatedGirls;
  ui.summaryShells.textContent = game.floorStats.shellsCollected;
  ui.summaryPotions.textContent = game.floorStats.potionsUsed;
  ui.levelCompleteCard.classList.add("visible");
  ui.levelCompleteCard.setAttribute("aria-hidden", "false");
}

function hideLevelCompleteCard() {
  ui.levelCompleteCard.classList.remove("visible");
  ui.levelCompleteCard.setAttribute("aria-hidden", "true");
}

function showDefeatCard() {
  if (levelStartTimer) {
    clearTimeout(levelStartTimer);
    levelStartTimer = null;
  }
  levelCompletionPending = false;
  ui.levelStartCard.classList.remove("visible");
  ui.levelStartCard.setAttribute("aria-hidden", "true");
  hideLevelCompleteCard();
  ui.defeatSummaryDefeated.textContent = game.runStats.defeatedGirls;
  ui.defeatSummaryPotions.textContent = game.runStats.potionsUsed;
  ui.defeatSummaryShells.textContent = game.runStats.shellsCollected;
  ui.defeatCard.classList.add("visible");
  ui.defeatCard.setAttribute("aria-hidden", "false");
}

function hideDefeatCard() {
  ui.defeatCard.classList.remove("visible");
  ui.defeatCard.setAttribute("aria-hidden", "true");
}

function dismissLevelCompletion() {
  if (!levelCompletionPending) return false;
  levelCompletionPending = false;
  hideLevelCompleteCard();
  nextFloor(false);
  return true;
}

function restartGame() {
  game = createGame();
  levelCompletionPending = false;
  hideLevelCompleteCard();
  hideDefeatCard();
  playerPortraitCue = null;
  currentPortraitSrc = "";
  updateUi();
  updatePlayerPortrait(performance.now());
  showLevelStartCard();
}

function dismissDefeat() {
  if (game.player.alive) return false;
  restartGame();
  return true;
}

function setDebugWindowVisible(visible) {
  ui.debugWindow.classList.toggle("visible", visible);
  ui.debugWindow.setAttribute("aria-hidden", String(!visible));
}

function isDebugChordKey(key) {
  return key === "1" || key === "2" || key === "3";
}

function updateDebugChord(event, pressed) {
  if (!isDebugChordKey(event.key)) return false;
  if (pressed) debugKeyChord.add(event.key);
  else debugKeyChord.delete(event.key);
  if (debugKeyChord.has("1") && debugKeyChord.has("2") && debugKeyChord.has("3")) {
    setDebugWindowVisible(true);
    return true;
  }
  return false;
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
  updatePotionSlots();
  ui.eventLog.innerHTML = game.events.map((event) => `<li>${event}</li>`).join("");
}

function updatePotionSlots() {
  const count = potionCount();
  ui.potionSlots.forEach((slot, index) => {
    const filled = index < count;
    slot.classList.toggle("filled", filled);
    slot.disabled = !filled || !game.player.alive;
    slot.setAttribute("aria-label", filled ? `Use potion ${index + 1}` : `Empty potion slot ${index + 1}`);
  });
}

function updatePlayerPortrait(now) {
  const frame = playerPortraitFrame(now);
  if (!frame || frame.src === currentPortraitSrc) return;
  currentPortraitSrc = frame.src;
  ui.playerPortrait.src = frame.src;
}

function playerPortraitFrame(now) {
  if (!game.player.alive) {
    return cuePortraitFrame("death", now, true);
  }

  if (playerPortraitCue) {
    const frame = cuePortraitFrame(playerPortraitCue.action, now, playerPortraitCue.action === "death");
    if (frame) return frame;
    playerPortraitCue = null;
  }

  const lowHealth = game.player.hp / game.player.maxHp <= 0.35;
  const action = lowHealth ? "wet" : "smile";
  const frames = PLAYER_PORTRAIT_ASSETS[action];
  return frames[Math.floor(now / 220) % frames.length];
}

function cuePortraitFrame(action, now, holdLastFrame = false) {
  const frames = PLAYER_PORTRAIT_ASSETS[action];
  if (!frames) return null;
  const elapsed = now - (playerPortraitCue?.startedAt ?? now);
  const frameIndex = Math.floor(elapsed / 160);
  if (frameIndex >= frames.length) return holdLastFrame ? frames[frames.length - 1] : null;
  return frames[frameIndex];
}

function render(now) {
  updateEnemyAnimationStates(now);
  cleanupDyingEnemies(now);
  resizeCanvas();
  drawScene(now);
  drawMinimap();
  updatePlayerPortrait(now);
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

function drawScene(now) {
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

  const rays = Math.min(420, Math.max(240, Math.floor(width / 3)));
  const fov = Math.PI / 3;
  const baseAngle = (game.player.dir - 1) * (Math.PI / 2);
  for (let i = 0; i < rays; i += 1) {
    const angle = baseAngle - fov / 2 + (i / (rays - 1)) * fov;
    const ray = castRay(angle);
    const corrected = ray.distance * Math.cos(angle - baseAngle);
    const wallHeight = Math.min(height, height / (corrected * 0.68));
    const shade = Math.max(0.22, 1 - corrected / 11);
    const x = (i / rays) * width;
    const sliceWidth = width / rays + 1.35;
    ctx.fillStyle = shadeColor(t.wall, shade);
    ctx.fillRect(x, height / 2 - wallHeight / 2, sliceWidth, wallHeight);
    drawWallTexture(ray, x, height / 2 - wallHeight / 2, sliceWidth, wallHeight, shade);
    if (ray.side === "x") {
      ctx.fillStyle = `rgba(16,32,38,${0.18 + (1 - shade) * 0.35})`;
      ctx.fillRect(x, height / 2 - wallHeight / 2, sliceWidth, wallHeight);
    }
    if (i % 18 === 0) {
      ctx.fillStyle = `rgba(255,246,220,${0.025 * shade})`;
      ctx.fillRect(x, height / 2 - wallHeight / 2, 1.2, wallHeight);
    }
  }

  drawVisibleEntities(baseAngle, fov, now);
  drawAttackAnimation();
  drawHeldWeapon();
  drawPotionAnimation();
  drawCrosshair();
  drawHeartOverlay(now);
}

function updateEnemyAnimationStates(now) {
  game.monsters.forEach((monster) => {
    if (monster.state === "attack" && now - monster.attackStartedAt >= 540) {
      monster.state = "standby";
    }
  });
}

function cleanupDyingEnemies(now) {
  const totalDeathDuration = ENEMY_DEATH_DISSOLVE.poseDuration + ENEMY_DEATH_DISSOLVE.dissolveDuration;
  game.monsters = game.monsters.filter((monster) => monster.state !== "dying" || now - monster.diedAt < totalDeathDuration);
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
    const sourceWidth = Math.min(8, image.naturalWidth);
    const textureX = Math.min(
      image.naturalWidth - sourceWidth,
      Math.max(0, Math.floor(texturePosition * image.naturalWidth - sourceWidth / 2)),
    );
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.globalAlpha = 0.36 + shade * 0.48;
    ctx.drawImage(image, textureX, 0, sourceWidth, image.naturalHeight, x - 0.35, y, width + 0.7, height);
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

function drawVisibleEntities(baseAngle, fov, now) {
  const entities = collectVisibleEntities(baseAngle, fov);
  entities
    .sort((a, b) => b.distance - a.distance)
    .forEach((entity) => {
      if (entity.monster) drawMonster(entity.x, entity.groundY, entity.size, entity.monster, now);
      if (entity.item) drawPickup(entity.x, entity.groundY - entity.size * 0.18, entity.size * 0.42, entity.item.type);
      if (entity.stairs) drawStairs(entity.x, entity.groundY - entity.size * 0.12, entity.size * 0.6);
    });
}

function collectVisibleEntities(baseAngle, fov) {
  return entityCells()
    .map((cell) => projectEntity(cell, baseAngle, fov))
    .filter(Boolean);
}

function entityCells() {
  const cells = [];
  game.monsters.forEach((monster) => cells.push({ x: monster.x, y: monster.y, monster }));
  game.items.forEach((item) => cells.push({ x: item.x, y: item.y, item }));
  cells.push({ x: game.stairs.x, y: game.stairs.y, stairs: true });
  return cells;
}

function projectEntity(cell, baseAngle, fov) {
  const px = game.player.x + 0.5;
  const py = game.player.y + 0.5;
  const cx = cell.x + 0.5;
  const cy = cell.y + 0.5;
  const dx = cx - px;
  const dy = cy - py;
  const facingX = Math.cos(baseAngle);
  const facingY = Math.sin(baseAngle);
  const rightX = -facingY;
  const rightY = facingX;
  const forwardDistance = dx * facingX + dy * facingY;
  const lateralDistance = dx * rightX + dy * rightY;
  const distance = Math.hypot(dx, dy);
  if (forwardDistance <= 0.08 || distance > ENEMY_RENDERING.maxDistance) return null;

  const halfViewWidth = Math.tan(fov / 2);
  const screenRatio = lateralDistance / (forwardDistance * halfViewWidth);
  if (Math.abs(screenRatio) > 1.1) return null;

  const angle = Math.atan2(dy, dx);
  const ray = castRay(angle);
  if (ray.distance < distance - 0.18) return null;

  const scaleDistance = Math.max(0.55, forwardDistance - (cell.monster ? ENEMY_RENDERING.halfCellDepth : 0));
  const baseSize = Math.min(canvas.height * 1.24, Math.max(canvas.height * 0.08, canvas.height * 0.52 / scaleDistance));
  const closeProgress = cell.monster
    ? Math.min(
        1,
        Math.max(0, (forwardDistance - ENEMY_RENDERING.closeRange) / (ENEMY_RENDERING.normalRange - ENEMY_RENDERING.closeRange)),
      )
    : 1;
  const size = baseSize * (ENEMY_RENDERING.closeScale + (1 - ENEMY_RENDERING.closeScale) * closeProgress);
  const depth = Math.min((forwardDistance - 1) / 5, 1);
  const groundNear = canvas.height * 0.88;
  const groundFar = canvas.height * 0.54;

  return {
    ...cell,
    distance,
    x: canvas.width * (0.5 + screenRatio * 0.5),
    groundY: groundNear + (groundFar - groundNear) * Math.max(0, Math.pow(depth, 0.75)),
    size,
  };
}

function drawMonster(x, y, size, monster, now) {
  const { action, frameIndex } = enemyAnimationFrame(monster, now);
  const image = ENEMY_ASSETS[monster.type]?.[action]?.[frameIndex];
  if (image?.complete && image.naturalWidth > 0) {
    if (monster.state === "dying") drawEnemyDisintegration(x, y, size, image, monster, now);
    else drawEnemySprite(x, y, size, image, action);
    if (monster.state !== "dying") drawMonsterHealthBar(x, y, size, monster);
  }
}

function enemyAnimationFrame(monster, now) {
  if (monster.state === "dying") {
    const frameIndex = Math.min(2, Math.floor((now - monster.diedAt) / (ENEMY_DEATH_DISSOLVE.poseDuration / 3)));
    return { action: "death", frameIndex };
  }
  if (monster.state === "attack") {
    const elapsed = now - monster.attackStartedAt;
    if (elapsed < 540) return { action: "attack", frameIndex: Math.min(2, Math.floor(elapsed / 180)) };
  }
  return { action: "standby", frameIndex: Math.floor(now / 220) % 3 };
}

function drawEnemySprite(x, y, size, image, action) {
  const layout = enemySpriteLayout(x, y, size, image, action);
  ctx.save();
  ctx.drawImage(
    image,
    layout.bounds.x,
    layout.bounds.y,
    layout.bounds.width,
    layout.bounds.height,
    layout.left,
    layout.top,
    layout.width,
    layout.height,
  );
  ctx.restore();
}

function enemySpriteLayout(x, y, size, image, action) {
  const bounds = spriteAlphaBounds(image);
  const targetHeight = size * (action === "death" ? ENEMY_RENDERING.deathHeight : ENEMY_RENDERING.visibleHeight);
  const maxWidth = size * (action === "death" ? 1.7 : 1.4);
  const scale = Math.min(targetHeight / bounds.height, maxWidth / bounds.width);
  const drawWidth = bounds.width * scale;
  const drawHeight = bounds.height * scale;
  return {
    bounds,
    scale,
    width: drawWidth,
    height: drawHeight,
    left: x - drawWidth / 2,
    top: y - drawHeight,
  };
}

function drawEnemyDisintegration(x, y, size, image, monster, now) {
  const elapsed = now - monster.diedAt;
  const dissolveElapsed = elapsed - ENEMY_DEATH_DISSOLVE.poseDuration;
  const layout = enemySpriteLayout(x, y, size, image, "death");
  if (dissolveElapsed <= 0) {
    drawEnemySprite(x, y, size, image, "death");
    return;
  }

  const progress = Math.min(1, Math.max(0, dissolveElapsed / ENEMY_DEATH_DISSOLVE.dissolveDuration));
  const { bounds, scale } = layout;
  const cols = ENEMY_DEATH_DISSOLVE.columns;
  const rows = ENEMY_DEATH_DISSOLVE.rows;
  const seed = monster.deathSeed || hashString(monster.id || `${monster.x}-${monster.y}`);

  ctx.save();
  ctx.globalCompositeOperation = "source-over";

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const particleIndex = row * cols + col;
      const sourceLeft = bounds.x + Math.floor((col / cols) * bounds.width);
      const sourceRight = bounds.x + Math.floor(((col + 1) / cols) * bounds.width);
      const sourceTop = bounds.y + Math.floor((row / rows) * bounds.height);
      const sourceBottom = bounds.y + Math.floor(((row + 1) / rows) * bounds.height);
      const sourceWidth = Math.max(1, sourceRight - sourceLeft);
      const sourceHeight = Math.max(1, sourceBottom - sourceTop);
      const destLeft = layout.left + (sourceLeft - bounds.x) * scale;
      const destTop = layout.top + (sourceTop - bounds.y) * scale;
      const destWidth = sourceWidth * scale + 0.6;
      const destHeight = sourceHeight * scale + 0.6;
      const releaseAt = 0.08 + seededNoise(seed, particleIndex, 0) * 0.42 + (row / rows) * 0.22;
      const local = Math.max(0, (progress - releaseAt) / Math.max(0.01, 1 - releaseAt));

      if (local <= 0) {
        ctx.globalAlpha = Math.max(0, 1 - progress * 0.55);
        ctx.drawImage(image, sourceLeft, sourceTop, sourceWidth, sourceHeight, destLeft, destTop, destWidth, destHeight);
        continue;
      }

      const eased = 1 - Math.pow(1 - Math.min(1, local), 2);
      const drift = (seededNoise(seed, particleIndex, 1) - 0.5) * size * 0.9 * eased;
      const lift = (0.18 + seededNoise(seed, particleIndex, 2) * 0.85) * size * eased;
      const scatter = Math.sin((elapsed * 0.006 + particleIndex) * 1.7) * size * 0.025 * eased;
      const shrink = 1 - eased * 0.42;
      const particleWidth = destWidth * shrink;
      const particleHeight = destHeight * shrink;
      const particleX = destLeft + drift + scatter + (destWidth - particleWidth) / 2;
      const particleY = destTop - lift + (seededNoise(seed, particleIndex, 3) - 0.5) * size * 0.18 * eased + (destHeight - particleHeight) / 2;

      ctx.globalAlpha = Math.max(0, Math.pow(1 - local, 1.45));
      ctx.drawImage(image, sourceLeft, sourceTop, sourceWidth, sourceHeight, particleX, particleY, particleWidth, particleHeight);

      if (particleIndex % 3 === 0) {
        ctx.globalAlpha *= 0.58;
        ctx.fillStyle = seededNoise(seed, particleIndex, 4) > 0.45 ? "#fff6dc" : "#49b7c4";
        const sparkSize = Math.max(1.2, size * (0.012 + seededNoise(seed, particleIndex, 5) * 0.018));
        ctx.fillRect(particleX + particleWidth / 2, particleY + particleHeight / 2, sparkSize, sparkSize);
      }
    }
  }
  ctx.restore();
}

function hashString(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededNoise(seed, index, salt) {
  let value = seed ^ Math.imul(index + 1, 374761393) ^ Math.imul(salt + 1, 668265263);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}

function spriteAlphaBounds(image) {
  const filename = image.src.slice(image.src.lastIndexOf("/") + 1);
  return ENEMY_SPRITE_BOUNDS[filename] || { x: 0, y: 0, width: image.naturalWidth, height: image.naturalHeight };
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

function drawHeartOverlay(now) {
  if (!game || !game.player) return;
  const healthRatio = game.player.maxHp > 0 ? game.player.hp / game.player.maxHp : 0;
  if (game.player.alive && healthRatio >= HEART_OVERLAY.lowHealthThreshold) return;

  const danger = game.player.alive
    ? Math.min(1, (HEART_OVERLAY.lowHealthThreshold - healthRatio) / HEART_OVERLAY.lowHealthThreshold)
    : 1;
  const count = Math.round(game.player.alive ? 12 + danger * HEART_OVERLAY.edgeCount : HEART_OVERLAY.deathCount);
  const edgeBand = Math.min(canvas.width, canvas.height) * (0.12 + danger * 0.22);

  ctx.save();
  for (let i = 0; i < count; i += 1) {
    const heart = EFFECT_ASSETS.hearts[i % EFFECT_ASSETS.hearts.length];
    if (!heart.complete || heart.naturalWidth <= 0) continue;

    const placement = game.player.alive ? edgeHeartPlacement(i, edgeBand) : fullScreenHeartPlacement(i);
    const pulse = Math.sin(now * 0.004 + i * 1.7) * 0.12;
    const size = Math.max(12, canvas.height * placement.size * (1 + pulse));
    const alpha = game.player.alive ? 0.28 + danger * 0.5 + placement.alpha * 0.16 : 0.58 + placement.alpha * 0.34;

    ctx.globalAlpha = Math.min(0.94, alpha);
    ctx.translate(placement.x, placement.y);
    ctx.rotate(placement.rotation + Math.sin(now * 0.002 + i) * 0.1);
    ctx.drawImage(heart, -size / 2, -size / 2, size, size);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  ctx.restore();
}

function edgeHeartPlacement(index, edgeBand) {
  const side = index % 4;
  const a = seededNoise(9127, index, 0);
  const b = seededNoise(9127, index, 1);
  const inset = b * edgeBand;
  const width = canvas.width;
  const height = canvas.height;
  let x = a * width;
  let y = inset;

  if (side === 1) {
    x = width - inset;
    y = a * height;
  } else if (side === 2) {
    x = a * width;
    y = height - inset;
  } else if (side === 3) {
    x = inset;
    y = a * height;
  }

  return {
    x,
    y,
    size: 0.032 + seededNoise(9127, index, 2) * 0.032,
    rotation: (seededNoise(9127, index, 3) - 0.5) * 0.85,
    alpha: seededNoise(9127, index, 4),
  };
}

function fullScreenHeartPlacement(index) {
  return {
    x: seededNoise(3821, index, 0) * canvas.width,
    y: seededNoise(3821, index, 1) * canvas.height,
    size: 0.034 + seededNoise(3821, index, 2) * 0.044,
    rotation: (seededNoise(3821, index, 3) - 0.5) * 1.1,
    alpha: seededNoise(3821, index, 4),
  };
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
document.querySelectorAll("[data-potion-slot]").forEach((button) => {
  button.addEventListener("click", usePotion);
});
document.querySelector("#newRun").addEventListener("click", restartGame);

document.addEventListener("pointerdown", () => {
  dismissDefeat();
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setDebugWindowVisible(false);
    debugKeyChord.clear();
    event.preventDefault();
    return;
  }

  if (updateDebugChord(event, true)) {
    event.preventDefault();
    return;
  }

  if (dismissDefeat()) {
    event.preventDefault();
    return;
  }

  if (dismissLevelCompletion()) {
    event.preventDefault();
    return;
  }

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

window.addEventListener("keyup", (event) => {
  updateDebugChord(event, false);
});

game = createGame();
updateUi();
updatePlayerPortrait(performance.now());
showLevelStartCard();
requestAnimationFrame(render);
