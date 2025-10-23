export async function uploadToVercelBlob(fileBuffer, filename) {
  const res = await fetch("https://blob.vercel-storage.com", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.VERCEL_BLOB_TOKEN}`,
      "x-vercel-file-name": filename,
    },
    body: fileBuffer,
  });

  if (!res.ok) throw new Error("Échec de l'upload Vercel Blob");

  const data = await res.json();
  return data; // { url, key }
}