import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { imageBase64, uid, textId } = req.body;

  const fileName = `text_${textId}.jpg`;
  const path = `public/images/texts/${uid}/${fileName}`;

  const githubUrl = `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/${path}`;

  const content = imageBase64.replace(/^data:image\/\w+;base64,/, "");

  try {
    const response = await axios.put(
      githubUrl,
      {
        message: `Upload image for text ${textId}`,
        content,
        branch: process.env.GITHUB_BRANCH
      },
      {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json"
        }
      }
    );

    const imageUrl = response.data.content.download_url;
    res.status(200).json({ imageUrl });
  } catch (err) {
    res.status(500).json({ error: "GitHub upload failed" });
  }
}
