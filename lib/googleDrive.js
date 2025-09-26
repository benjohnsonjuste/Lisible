// lib/googleDrive.js
import { google } from "googleapis";

export function getGoogleDrive() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

  const auth = new google.auth.JWT(
    credentials.client_email,
    null,
    credentials.private_key,
    ["https://www.googleapis.com/auth/drive.file"]
  );

  return google.drive({ version: "v3", auth });
}
