import { upload } from '@vercel/blob/client'
import { nanoid } from 'nanoid'

const BLOB_HOST = /^([a-z0-9]+)\.public\.blob\.vercel-storage\.com$/i
const FILE_RE = /^[A-Za-z0-9_-]+\.jpg$/

export interface UploadResult {
  blobUrl: string
  /** Short page on this site that guests open from the QR code. */
  shareUrl: string
}

/** Upload a composed photo to Vercel Blob and return the guest download page URL. */
export async function uploadPhoto(jpeg: Blob): Promise<UploadResult> {
  const blob = await upload(`photos/senara-${nanoid(10)}.jpg`, jpeg, {
    access: 'public',
    contentType: 'image/jpeg',
    handleUploadUrl: '/api/upload',
  })
  return { blobUrl: blob.url, shareUrl: shareUrlFor(blob.url) }
}

/** https://<store>.public.blob.vercel-storage.com/photos/<file> -> <origin>/p/<store>/<file> */
export function shareUrlFor(blobUrl: string) {
  const u = new URL(blobUrl)
  const m = BLOB_HOST.exec(u.hostname)
  const file = u.pathname.split('/').pop() ?? ''
  if (!m || !FILE_RE.test(file)) return blobUrl
  return `${location.origin}/p/${m[1]}/${file}`
}

/** Inverse of shareUrlFor, validated so the page can only show our own blobs. */
export function blobUrlFromPath(pathname: string): string | null {
  const m = /^\/p\/([a-z0-9]+)\/([^/]+)$/i.exec(pathname)
  if (!m || !FILE_RE.test(m[2])) return null
  return `https://${m[1]}.public.blob.vercel-storage.com/photos/${m[2]}`
}
