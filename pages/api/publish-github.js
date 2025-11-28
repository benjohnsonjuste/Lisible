// /app/api/publish-github/route.js
import { NextResponse } from "next/server";

// FIREBASE
import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

// Node global Buffer should be available in Next.js runtime.
// If your runtime is edge you will need to adapt (edge doesn't support Buffer or Firebase Admin).
// This implementation targets Node server runtime.

const {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  GITHUB_TOKEN,
  GITHUB_REPO,
  GITHUB_BRANCH = "main",
  GITHUB_FOLDER = "library",
} = process.env;

// Initialize Firebase (only once)
if (!getApps().length) {
  if (!FIREBASE_API_KEY || !FIREBASE_AUTH_DOMAIN || !FIREBASE_PROJECT_ID) {
    console.warn("Firebase env vars missing - Firestore writes will fail if not set.");
  } else {
    initializeApp({
      apiKey: FIREBASE_API_KEY,
      authDomain: FIREBASE_AUTH_DOMAIN,
      projectId: FIREBASE_PROJECT_ID,
    });
  }
}
let db;
try {
  db = getFirestore();
} catch (e) {
  // getFirestore can throw if Firebase wasn't initialized properly in some serverless runtimes.
  console.warn("Firestore not initialized:", e?.message || e);
  db = null;
}

// Helper: GitHub API helpers
async function githubGet(path) {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${encodeURIComponent(path)}?ref=${GITHUB_BRANCH}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "publish-github-endpoint",
    },
  });
  return res;
}

async function githubPut(path, base64Content, message, sha) {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${encodeURIComponent(path)}`;
  const body = {
    message,
    content: base64Content,
    branch: GITHUB_BRANCH,
  };
  if (sha) body.sha = sha;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "publish-github-endpoint",
    },
    body: JSON.stringify(body),
  });
  return res;
}

function parseDataUri(dataUri) {
  // example: data:image/png;base64,AAAA...
  const match = dataUri.match(/^data:(.+);base64,(.*)$/s);
  if (!match) return null;
  return { mime: match[1], base64: match[2] };
}

export async function POST(req) {
  try {
    if (!GITHUB_REPO || !GITHUB_TOKEN) {
      // still allow Firestore-only operation if Github not configured
      console.warn("GITHUB_REPO or GITHUB_TOKEN not set — GitHub sync will be skipped.");
    }

    const payload = await req.json();

    // Accept payload shape from client:
    // { title, content, authorName, authorEmail, imageBase64 (optional data URI), imageName (optional), createdAt (optional) }
    const {
      title,
      content,
      authorName,
      authorEmail,
      imageBase64,
      imageName,
      createdAt,
    } = payload || {};

    if (!title || !content) {
      return NextResponse.json({ error: "Le titre et le contenu sont requis." }, { status: 400 });
    }

    // ------- 1) Save to Firestore (if available) -------
    let firestoreId = null;
    try {
      if (!db) throw new Error("Firestore non initialisé");
      const docRef = await addDoc(collection(db, "library"), {
        title,
        content,
        author: authorName || "Anonyme",
        authorEmail: authorEmail || "",
        imageName: imageName || null,
        hasImage: !!imageBase64,
        createdAt: serverTimestamp(),
        clientCreatedAt: createdAt || new Date().toISOString(),
      });
      firestoreId = docRef.id;
    } catch (e) {
      // Log but continue — we can still push to GitHub
      console.error("Erreur Firestore:", e?.message || e);
    }

    // ------- 2) Push image (optional) and markdown to GitHub -------
    const results = { github: { image: null, markdown: null } };

    if (GITHUB_REPO && GITHUB_TOKEN) {
      // Ensure folders: GITHUB_FOLDER/images/...
      // Build file names
      const safeTitle = (title || "post").replace(/[^\w\- ]+/g, "").slice(0, 60).replace(/\s+/g, "-");
      const ts = Date.now();
      const mdFileName = `${ts}-${safeTitle}${firestoreId ? "-" + firestoreId : ""}.md`;
      let mdPath = `${GITHUB_FOLDER}/${mdFileName}`;

      // If there's an image data URI, push it as a separate file
      let imagePath = null;
      if (imageBase64) {
        const parsed = parseDataUri(imageBase64);
        if (!parsed) {
          console.warn("Image Base64 non reconnue comme data URI; skipping image upload.");
        } else {
          // Build image filename
          const ext = parsed.mime.split("/")[1] || "png";
          const imgName = (imageName || `img-${ts}`).replace(/\s+/g, "_");
          const imageFileName = `${ts}-${imgName}.${ext}`;
          imagePath = `${GITHUB_FOLDER}/images/${imageFileName}`;

          // Prepare base64 content (must be raw base64 without data: prefix)
          const imageBase64Content = parsed.base64;

          // Check if file exists to get sha (we'll attempt to PUT directly; GitHub will create it if not exists)
          try {
            const getRes = await githubGet(imagePath);
            let sha = undefined;
            if (getRes.ok) {
              const j = await getRes.json();
              sha = j.sha;
            }
            const putRes = await githubPut(
              imagePath,
              imageBase64Content,
              `Add image for post ${safeTitle}`,
              sha
            );
            const putJson = await putRes.json();
            if (putRes.ok) {
              results.github.image = { path: imagePath, response: putJson };
            } else {
              console.error("GitHub image upload failed:", putJson);
            }
          } catch (e) {
            console.error("Erreur upload image GitHub:", e?.message || e);
          }
        }
      }

      // Build markdown content. Reference image relatively if uploaded
      const mdLines = [];
      mdLines.push(`# ${title}`);
      mdLines.push("");
      mdLines.push(`**Auteur :** ${authorName || "Anonyme"}`);
      if (authorEmail) mdLines.push(`**Email :** ${authorEmail}`);
      if (firestoreId) mdLines.push(`**ID Firestore :** ${firestoreId}`);
      mdLines.push("");
      mdLines.push("---");
      mdLines.push("");
      mdLines.push(content);
      mdLines.push("");
      mdLines.push("---");
      mdLines.push("");
      if (imagePath) {
        // relative link to images folder in repo
        const imageFileNameInMd = `./images/${imagePath.split("/").pop()}`;
        mdLines.push(`![illustration](${imageFileNameInMd})`);
      } else {
        mdLines.push("_Aucune image fournie_");
      }
      mdLines.push("");
      const mdContent = mdLines.join("\n");

      const mdBase64 = Buffer.from(mdContent, "utf-8").toString("base64");

      try {
        // check existing md file sha (unlikely) and commit
        const getMdRes = await githubGet(mdPath);
        let mdSha = undefined;
        if (getMdRes.ok) {
          const j = await getMdRes.json();
          mdSha = j.sha;
        }
        const putMdRes = await githubPut(mdPath, mdBase64, `Publish post: ${title}`, mdSha);
        const putMdJson = await putMdRes.json();
        if (putMdRes.ok) {
          results.github.markdown = { path: mdPath, response: putMdJson };
        } else {
          console.error("GitHub markdown upload failed:", putMdJson);
        }
      } catch (e) {
        console.error("Erreur commit markdown sur GitHub:", e?.message || e);
      }
    } else {
      // GitHub not configured — skip push
    }

    // ------- 3) Return success + infos -------
    return NextResponse.json({
      ok: true,
      firestoreId,
      github: results.github,
      message: "Publication traitée (Firestore et/ou GitHub).",
    });
  } catch (error) {
    console.error("PUBLISH ERROR:", error?.message || error);
    return NextResponse.json({ error: "Erreur lors de la publication." }, { status: 500 });
  }
}