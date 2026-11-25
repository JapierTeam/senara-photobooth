# SENARA Photobooth

Kiosk photobooth web app (Vite + React + TypeScript) for Vercel. Guests take photos on an iPad/laptop, the app composes them into a SENARA frame, uploads the result to Vercel Blob and shows a QR code. Guests scan it with their phone camera to save the photo.

## Frames

Defined as data in `src/frames/*.ts` (`FrameDef`): canvas size, photo slots, stickers and text. To add a frame, add a file and register it in `src/frames/index.ts`.

| id | size | shots |
|---|---|---|
| strip4 | 1200x3600 (2x6in @600dpi) | 4 |
| strip3 | 1200x3600 | 3 |
| grid2x2 | 1200x1800 (4R @300dpi) | 4 |
| single45 | 1080x1350 | 1 |
| story916 | 1080x1920 | 1 |

## Assets

Stickers were extracted from `cetakins.pdf` with `design/tools/extract.py` (split the vector pages into transparent PNGs) and `design/tools/finalize.py` (name, rotate letters, add the white die-cut backing). The app uses `public/stickers/*.webp`; full-resolution PNGs are in `design/assets-hires/`.

## Shooting flow

Home (pick frame) -> **Ready** (live camera, pick an effect) -> trigger -> 3-2-1 countdown for every photo, 2 s between shots -> Result.

Triggers in the Ready state:
- On-screen shutter button
- Keyboard or presentation clicker: Space, Enter, PageDown/PageUp, arrow keys, `b`, `.` (Esc cancels). Phone camera Bluetooth remotes send Volume Up, which browsers on iOS cannot read.
- Hand gesture: open palm held for 1 s (MediaPipe Gesture Recognizer, runs on-device). The wasm and model are self-hosted in `public/mediapipe/` and only load after Mulai is tapped. It can be switched off on screen; the choice is kept in localStorage.

The Ready screen returns to Home after 60 s without activity. Effects are applied per pixel to the final photo (`src/lib/effects.ts`) and previewed live with CSS filters.

## Language

English (default) and Bahasa Indonesia, switchable with the EN/ID toggle on the home screen and on the guest download page. The choice is saved in localStorage per device. Strings live in `src/lib/i18n.tsx`; the date printed on the frames follows the selected language.

## Delivering photos to phones

1. The kiosk POSTs the JPEG to `api/upload.ts`, which stores it with `put()` (OIDC via `BLOB_STORE_ID`, or `BLOB_READ_WRITE_TOKEN`). Blobs expire after 30 days (`ttlDays`).
2. A QR code points to `/p/<store>/<file>.jpg`.
3. On that page, **Simpan Foto** opens the native share sheet (`navigator.share` with the file). On iOS, "Save Image" saves to Photos; on Android, pick Photos/Gallery. A plain download and a WhatsApp link are fallbacks.

## Development

```bash
npm install
npm run dev        # http://localhost:5173 (camera works on localhost)
npm run dev:https  # self-signed HTTPS, for testing from an iPad/phone on the LAN
vercel dev         # also runs /api/upload (needs BLOB_READ_WRITE_TOKEN in .env.local)
```

## Deploy

1. `vercel` (or import the repo in the Vercel dashboard). Framework: Vite.
2. Dashboard > Storage > Create **Blob** store (public access) and connect it to the project. This adds `BLOB_STORE_ID` (OIDC).
3. Redeploy. Open the site on the kiosk, allow the camera, and use Add to Home Screen or full screen.
