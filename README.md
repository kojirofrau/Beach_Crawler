# Beach Crawler

A no-build browser prototype for a turn-by-turn first-person dungeon crawler set in sunny beach labyrinths. Explore procedural floors, fight animated enemies, collect shells and coconut potions, level up, and descend deeper through themed reef mazes.

## Play

Open `index.html` directly in a browser.

- Arrow keys or `WASD`: move forward/back and turn
- `Q` or `Use Potion`: drink a coconut potion
- Reach the stair tile to complete the current floor
- Press any key on the level-complete window to enter the next floor
- Press any key or button after defeat to restart the run

## Current Systems

- Procedural maze floors with rotating beach themes.
- First-person raycast-style corridor rendering with textured sand floors and coral walls.
- Three enemy types with standby, attack, death, and disintegration effects.
- Enemy death now plays the final death sprite before breaking into small drifting particles.
- Player HP, XP, level, shells, potion supply, and run/floor statistics are tracked.
- Player HP fully replenishes at the start of each new floor.
- Coconut potion inventory is capped at three slots.
- Low-health warning fills the screen edges with heart sprites below 50% HP.
- Defeat fills the screen with hearts and opens a restart summary window.

## HUD

The main browser view is intentionally clean: only the game canvas and bottom HUD are visible.

- Bottom beach-themed HUD contains HP/XP bars, player level, hero portrait, current action text, potion slots, and the potion button.
- The hero portrait is a square animated image with smile, left/right look, pain, wet/tense, and defeat states.
- Current action/status text appears below the hero portrait.
- Potion inventory has three visual slots; filled slots show the coconut potion sprite.
- The minimap is rendered in the top-left of the game screen.
- The layout is fixed to the browser viewport so the game fits without page scrolling.

## Level And Run Windows

- A floor title card appears at the start of each level for 5 seconds, then slides downward and disappears.
- Completing a floor opens a summary window showing girls defeated, precious shells collected, and potions used for that floor.
- Defeat opens a restart window showing run-wide girls defeated, potions drunk, and precious shells collected.

## Debug Management

Debug information is hidden during normal play.

- Press `1`, `2`, and `3` at the same time to open the debug window.
- Press `Esc` to hide the debug window.
- The debug window shows floor, turn, attack, shells, facing, seed, position, entity counts, FPS, event log, and a New Run button.

## Project Structure

- `index.html`: DOM structure for the game canvas, HUD, modals, and hidden debug window.
- `styles.css`: fixed viewport layout, beach HUD styling, modal styling, and debug window styling.
- `game.js`: procedural generation, turn logic, rendering, HUD updates, animations, input, floor transitions, debug toggles, and run statistics.
- `assets/attacks/`: water pistol splash animation frames and chroma-key sources.
- `assets/characters/`: original player character concept/cutout assets.
- `assets/effects/hearts/`: five transparent heart sprites plus the generated chroma-key source sheet.
- `assets/effects/potion/`: potion bubble use animation frames and sources.
- `assets/enemies/`: enemy sprites organized by enemy type and action.
- `assets/environment/`: sand floor, coral wall, and stair sprites.
- `assets/objects/`: coconut potion and pearl cache pickup sprites plus sources.
- `assets/player/portrait/`: normalized 256x256 HUD portrait animation frames.
- `assets/player/portrait/sheets/`: generated source sheets for the portrait animations.
- `assets/ui/`: generated HUD concept reference.
- `assets/weapons/`: first-person water pistol sprite and source.

## Art Pipeline Notes

Most raster assets are generated bitmap art, then normalized into project-ready PNGs. Chroma-key source images are kept beside final cutouts where useful. Player portrait frames are exported as consistent square `256x256` files to prevent HUD jitter. Heart overlay sprites are exported as transparent `128x128` PNGs.
