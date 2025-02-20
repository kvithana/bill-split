import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

export class FileUploader {
  constructor() {}

  async upload(request: Request) {
    const body = (await request.json()) as HandleUploadBody;
    return await handleUpload({
      body,
      request,

      onBeforeGenerateToken: async (
        pathname
        /* clientPayload */
      ) => {
        // Generate a client token for the browser to upload the file
        // ⚠️ Authenticate and authorize users before generating the token.
        // Otherwise, you're allowing anonymous uploads.

        return {
          allowedContentTypes: ["image/*"],
          maxSize: 1024 * 1024 * 10, // 10MB
          tokenPayload: JSON.stringify({
            // optional, sent to your server on upload completion
            // you could pass a user id from auth, or a value from clientPayload
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Get notified of client upload completion
        // ⚠️ This will not work on `localhost` websites,
        // Use ngrok or similar to get the full upload flow

        console.log("blob upload completed", blob, tokenPayload);
      },
    });
  }
}
