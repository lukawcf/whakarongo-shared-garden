# Shared Garden · Hauora Whānau

A gentle movement game for kaumātua aged 55+, designed with Rauawaawa Kaumātua Charitable Trust (Group 9, CSMAX570).
Move to a song, earn garden tokens, and decorate a summer or winter garden. No login, no scores, no ranking.

## Run it

Serve the folder and open it in a browser (the song and clip files need a web server, not `file://`):

```
python -m http.server 8570
```

Then open http://localhost:8570

On a tablet or phone, open the address in Chrome and choose **Add to Home screen** (or Install app):
the game then opens from its own flower icon, full screen. Fonts are bundled in `assets/fonts/`, so text
(including Māori macrons) looks the same without an internet connection.

## How it plays

1. **Home** → Play
2. **Choose a song** — each card shows its length and the tokens it earns (5 tokens per 15 s; +10 for the first song of the day)
3. **Move** — standing demonstrator on the left, seated on the right, doing the same movement. Each song has its own set and order of movements (3–5 of: Tūī, Kōwhai, Pīwakawaka, Ponga, Harakeke, Kererū). A te reo word label sits under each movement name. Pause → Continue or Finish.
   **Camera (optional):** asked once before the first song (Use camera / Just play), remembered after that, and switchable with the Camera button. A small mirrored window in the corner glows and shows ✓ Moving when it sees movement; every 5 s of moving grows a 🍃 leaf, shown next to the progress bar and on Ka pai ("Your garden grew 🍃🍃🍃"). After 20 s of stillness it offers "Rest if you need 💚". Tokens never depend on the camera. Nothing is recorded or sent. Browsers only open the camera on `https://` or `localhost` pages, so for a tablet demo host the game on https (e.g. GitHub Pages).
4. **Ka pai!** — tokens count up with a soft chime → Decorate garden
5. **Add to garden** — spend tokens to add items, including as many copies of the same item as you like. New plants begin as a seed and use three simple, untimed actions: **Plant → Water → Watch it Grow**. Once grown, a plant can still be watered for a gentle visual response; plants never die and watering costs nothing. Existing saved plants stay fully grown. The collection includes well-known native New Zealand plants, trees, birds, butterflies and insects, plus a snowman, snow angel, snowflake and snowballs for winter. Each item arrives at a natural default size and position, repeated items have gentle variation, and grounded items receive a soft contact shadow. Players can still **drag items anywhere** in the picture (finger or mouse; arrow keys also work), resize with − / + (or pinch), rotate or delete them; deleting returns the tokens. Tap empty garden space to hide the item controls. Matching items gently snap together when placed side by side. Positions, sizes, growth stages and rotations are remembered. Summer and winter are different gardens with different items.

## Design rules (for kaumātua 55+)

Simple screens · few words · large text and high contrast · one consistent button style · big buttons (≥ 48 px) ·
every screen fits without scrolling · few steps · pictures shown whole, never cropped.

## Files

- `index.html`, `styles.css`, `app.js` — the game
- `assets/audio/` — the four songs
- `assets/instructor/` — demonstrator illustrations; `clips/` holds smooth movement videos when available
- `assets/garden/` — summer and winter scenes; `items/` holds the unlockable garden items
- `kling-inputs/` — start frames, reference poses and prompts for generating the movement clips
- `tools/prepare_clip.py` — converts a downloaded clip into a small muted loop for `assets/instructor/clips/`
- `legacy-v2/`, `legacy-v3/` — earlier versions, kept for reference

## Movement clips

Each movement uses a looping video if `assets/instructor/clips/<move>-<standing|seated>.mp4` exists
(all 12 clips are in place), otherwise it cross-fades the illustrated poses.
Clips come from Kling, Dreamina, Hailuo and Vidu; their watermarks are kept. See `kling-inputs/README.md`.
