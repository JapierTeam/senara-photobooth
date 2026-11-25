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

## Delivering photos to phones

1. The kiosk uploads the JPEG to Vercel Blob through a client token from `api/upload.ts`. Blobs expire after 30 days (`ttlDays`).
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
2. Dashboard > Storage > Create **Blob** store (public access) and connect it to the project. This adds `BLOB_READ_WRITE_TOKEN`.
3. Redeploy. Open the site on the kiosk, allow the camera, and use Add to Home Screen or full screen.
