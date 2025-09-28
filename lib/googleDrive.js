// lib/googleDrive.js

import { google } from 'googleapis';

// Configure ton client Google API ici
const auth = new google.auth.GoogleAuth({
  credentials: {
    // Mets tes credentials ici
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/drive.file'],
});

const drive = google.drive({ version: 'v3', auth });

export async function getGoogleDrive() {
  return drive;
}