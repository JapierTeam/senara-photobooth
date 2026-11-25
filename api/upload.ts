import { put } from '@vercel/blob'
import { nanoid } from 'nanoid'

// Vercel Functions reject request bodies over 4.5MB.
const MAX_BYTES = 4_400_000

/**
 * Receives the composed JPEG from the kiosk and stores it in Vercel Blob.
 * Auth: OIDC (BLOB_STORE_ID, set when the Blob store is connected to the project)
 * or BLOB_READ_WRITE_TOKEN. Both are picked up automatically by `put`.
 */
export async function POST(request: Request): Promise<Response> {
  if (request.headers.get('content-type') !== 'image/jpeg')
    return Response.json({ error: 'Content-Type must be image/jpeg' }, { status: 415 })

  const data = Buffer.from(await request.arrayBuffer())
  if (data.byteLength > MAX_BYTES) return Response.json({ error: 'File too large' }, { status: 413 })
  // JPEG magic bytes FF D8 FF
  if (data[0] !== 0xff || data[1] !== 0xd8 || data[2] !== 0xff)
    return Response.json({ error: 'Not a JPEG' }, { status: 400 })

  try {
    const blob = await put(`photos/senara-${nanoid(10)}.jpg`, data, {
      access: 'public',
      contentType: 'image/jpeg',
      addRandomSuffix: false,
      // photos auto-delete after 30 days
      ttlDays: 30,
    })
    return Response.json({ url: blob.url })
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 })
  }
}
