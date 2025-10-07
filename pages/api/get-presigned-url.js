// pages/api/get-presigned-url.js ... 
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const REGION = "auto"; // R2 uses "auto"
const BUCKET_NAME = process.env.R2_BUCKET_NAME;
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;

const s3Client = new S3Client({
  region: REGION,
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { contactId } = req.body;
  if (!contactId) {
    return res.status(400).json({ error: "Missing contactId" });
  }

  const objectKey = `reports/${contactId}/report.json`;

  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: objectKey,
      ContentType: "application/json",
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour
    res.status(200).json({ success: true, signedUrl, objectKey });
  } catch (err) {
    console.error("Error generating pre-signed URL:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}
