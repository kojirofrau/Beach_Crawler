# Beach Crawler

A no-build browser prototype for a turn-by-turn first-person dungeon crawler. Explore randomly generated sunny beach labyrinths, fight monsters, gather items, level up, and descend to deeper floors.

## Play

Open `index.html` in a browser.

- Arrow keys or `WASD`: move forward/back and turn
- On-screen arrows: same controls
- `Q` or Use Potion: heal with a coconut potion
- Reach the stair tile to generate the next floor

## Debug Telemetry

The right sidebar exposes the current seed, player position, entity counts, FPS, and a turn event log. A minimap is rendered over the dungeon view to make generation and entity placement easy to inspect during tuning.

## Generated Assets

The game runtime is procedural again and does not depend on generated concept backdrops or texture sheets. New beach-themed 80s anime assets are organized for future integration:

- `assets/environment/`: sand floor and coral wall texture sources
- `assets/characters/`: player character cutout and chroma-key source
- `assets/monsters/`: beach enemy cutouts and chroma-key sources
- `assets/objects/`: pickup sprite sheet cutout and chroma-key source
