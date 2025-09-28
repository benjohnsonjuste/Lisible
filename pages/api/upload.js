// pages/api/upload.js

import { getGoogleDrive } from '@/lib/googleDrive';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const drive = await getGoogleDrive();
      const { fileName, fileContent } = req.body;

      const response = await drive.files.create({
        requestBody: {
          name: fileName,
          mimeType: 'application/octet-stream',
        },
        media: {
          mimeType: 'application/octet-stream',
          body: Buffer.from(fileContent, 'base64'), // si contenu encodé en base64
        },
      });

      res.status(200).json({ success: true, fileId: response.data.id });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}