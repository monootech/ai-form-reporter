// pages/api/get-report.js
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const REGION = "auto";
const s3Client = new S3Client({
  region: REGION,
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ success: false, error: "Missing report ID" });
  }

  const objectKey = `reports/${id}/report.json`;

  try {
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: objectKey,
    });

    const data = await s3Client.send(command);
    const body = await streamToString(data.Body);
    const reportData = JSON.parse(body);


    // 🧹 Remove internal tracking tags before sending to client
  const {
    Goal_Tags,
    Obstacle_Tags,
    Emotional_Tags,
    Preference_Tags,
    Upsell_Ready_Tags,
    Budget_Tags,
    Sheets_Level_Tags,
    ...cleanReport
  } = reportData;

    
    res.status(200).json({ success: true, report: reportData });
  } catch (err) {
    console.error("Error fetching report from R2:", err);
    res.status(404).json({ success: false, error: "Report not found or access denied" });
  }
}

// helper function to convert ReadableStream to string
async function streamToString(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf-8");
}
