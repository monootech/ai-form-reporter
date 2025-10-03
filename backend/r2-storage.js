// Pipedream workflow: Cloudflare R2 Storage Utility
// Reusable component for all R2 operations

async function saveToR2(filePath, content, contentType) {
  const url = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${process.env.R2_BUCKET_NAME}/${filePath}`;
  
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${process.env.R2_ACCESS_KEY_ID}`,
      'Content-Type': contentType,
    },
    body: content
  });

  if (!response.ok) {
    throw new Error(`R2 upload failed: ${response.statusText}`);
  }

  return { success: true, path: filePath };
}

async function readFromR2(filePath) {
  const url = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${process.env.R2_BUCKET_NAME}/${filePath}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${process.env.R2_ACCESS_KEY_ID}`,
    }
  });

  if (!response.ok) {
    return null;
  }

  return await response.text();
}
