# Beach Crawler

A no-build browser prototype for a turn-by-turn first-person dungeon crawler set in sunny beach labyrinths. Explore procedural floors, fight animated enemies, collect shells and coconut potions, level up, and descend deeper through themed reef mazes.

## Play

Open `index.html` directly in a browser.

- Arrow keys or `WASD`: move forward/back and turn.
- `Q`, the potion slots, or `Use Potion`: drink a coconut potion.
- Reach the stair tile to complete the current floor.
- Press any key on the level-complete window to enter the next floor.
- Press `Esc` or the `Menu` button to open or close the run menu.
- Use the megaphone button in the upper-right corner to mute or unmute audio.
- After defeat, choose `New Run`, `Return to Menu`, or press any key to restart.

## Current Systems

- Procedural maze floors with rotating beach themes.
- First-person raycast-style corridor rendering with textured sand floors, coral walls, pickups, stairs, and weapon effects.
- Animated sky backdrop using six generated clear-sky cloud frames with subtle drift and crossfade.
- Three enemy types with standby, attack, death, and disintegration effects.
- Player HP, XP, level, shells, potion supply, floor stats, run stats, and session stats.
- Player HP fully replenishes at the start of each new floor.
- Coconut potion inventory is capped at three slots.
- Low-health warning fills the screen edges with heart sprites below 50% HP.
- Defeat fills the screen with hearts and opens a run summary window.
- Runtime music, stingers, low-health music, mute/unmute, and music volume settings.

## Menu And Settings

The game now includes a full run menu.

- `Start New Run` creates a new game and increments the session run count.
- `Continue` closes the menu and resumes the current run.
- Statistics show runs started, runs ended, best floor, current floor, defeated girls, shells collected, potions drunk, and turns taken for the current browser session.
- Runs started counts new games only; floor transitions do not increment it.
- Settings include a music volume slider and a minimap visibility toggle.

## HUD

- Bottom beach-themed HUD contains HP/XP bars, player level, animated hero portrait, current action text, potion slots, and the potion button.
- The hero portrait uses square `256x256` animation frames for waiting, turning left/right, taking damage, wet/exhausted idle, wet/exhausted turns, wet/exhausted damage, and dying with heart eyes.
- Current action/status text appears below the hero portrait.
- Potion inventory has three visual slots; filled slots show the coconut potion sprite.
- The enlarged minimap is rendered in the top-left of the game screen and can be hidden from settings.
- The layout is fixed to the browser viewport so the game fits without page scrolling.

## Level And Run Windows

- A floor title card appears at the start of each level for 5 seconds, then slides downward and disappears.
- Completing a floor opens a summary window showing girls defeated, precious shells collected, and potions used for that floor.
- Defeat opens a run-wide summary window and includes buttons for starting a new run or returning to the menu.

## Debug Management

Debug information is hidden during normal play.

- Press `1`, `2`, and `3` at the same time to open the debug window.
- Press `Esc` to hide the debug window or open the main menu, depending on the current state.
- The debug window shows floor, turn, attack, shells, facing, seed, position, entity counts, FPS, event log, and a New Run button.

## Project Structure

- `index.html`: DOM structure for the game canvas, HUD, menu, modals, and hidden debug window.
- `styles.css`: fixed viewport layout, beach HUD styling, menu styling, modal styling, and debug window styling.
- `game.js`: procedural generation, turn logic, rendering, HUD updates, animations, input, audio, menu state, floor transitions, debug toggles, and statistics.
- `Music/`: runtime soundtrack and stinger files used by the browser game. The audio loader checks `.mp3`, `.ogg`, `.wav`, and `.m4a` for each named cue.
- `assets/attacks/`: water pistol splash animation frames and chroma-key sources.
- `assets/characters/`: original player character concept/cutout assets.
- `assets/effects/hearts/`: transparent heart sprites plus the generated chroma-key source sheet.
- `assets/effects/potion/`: potion bubble use animation frames and sources.
- `assets/enemies/`: enemy sprites organized by enemy type and action.
- `assets/environment/`: sand floor, coral wall, stairs, and animated sky frames.
- `assets/objects/`: coconut potion and pearl cache pickup sprites plus sources.
- `assets/player/portrait/`: normalized `256x256` HUD portrait animation frames.
- `assets/player/portrait/sheets/`: generated source sheets for portrait animations.
- `assets/ui/`: generated HUD concept reference.
- `assets/weapons/`: first-person water pistol sprite and source.

## Art Pipeline Notes

Most raster assets are generated bitmap art, then normalized into project-ready PNGs. Chroma-key source images are kept beside final cutouts where useful. Player portrait frames are exported as consistent square `256x256` files to prevent HUD jitter. Sky animation frames are generated as a sheet, split into six equal PNGs, and crossfaded in the renderer.

## Credits

Beach Crawler was made using Codex + ChatGPT 5.5.
