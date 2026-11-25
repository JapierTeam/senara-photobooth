import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'

/**
 * Issues short-lived client tokens so the kiosk browser can upload the
 * composed photo straight to Vercel Blob (bypasses the 4.5MB function body limit).
 * Requires BLOB_READ_WRITE_TOKEN (added automatically when a Blob store is connected).
 */
export async function POST(request: Request): Promise<Response> {
  const body = (await request.json()) as HandleUploadBody
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!/^photos\/[A-Za-z0-9_-]+\.jpg$/.test(pathname)) throw new Error('Invalid pathname')
        return {
          allowedContentTypes: ['image/jpeg'],
          maximumSizeInBytes: 15 * 1024 * 1024,
          addRandomSuffix: false,
          // photos auto-delete after 30 days
          ttlDays: 30,
        }
      },
    })
    return Response.json(result)
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 400 })
  }
}
