const localCache = new Map();
const CACHE_TTL = 0;

const GITHUB_CONFIG = {
  owner: "benjohnsonjuste",
  repo: "Lisible",
  token: process.env.GITHUB_TOKEN
};

async function getFile(path) {
  const now = Date.now();
  const cached = localCache.get(path);

  if (
    cached &&
    now - cached.timestamp < CACHE_TTL
  ) {
    return cached.data;
  }

  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_CONFIG.token}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "Lisible-App"
        },
        cache: "no-store"
      }
    );

    if (res.status === 404) return null;
    if (!res.ok) return null;

    const data = await res.json();

    if (Array.isArray(data)) {
      return {
        content: data,
        isDir: true
      };
    }

    if (!data.content) return null;

    const b64 = data.content.replace(/\s/g, "");
    const binString = atob(b64);

    const bytes = Uint8Array.from(
      binString,
      m => m.codePointAt(0)
    );

    const decodedContent =
      new TextDecoder().decode(bytes);

    const result = {
      content: JSON.parse(decodedContent),
      sha: data.sha
    };

    if (CACHE_TTL > 0) {
      localCache.set(path, {
        data: result,
        timestamp: now
      });
    }

    return result;
  } catch (err) {
    console.error(
      `Fetch error [${path}]:`,
      err.message
    );

    return null;
  }
}

async function updateFile(
  path,
  content,
  sha,
  message
) {
  localCache.delete(path);

  const jsonString = JSON.stringify(
    content,
    null,
    2
  );

  const bytes =
    new TextEncoder().encode(jsonString);

  const binString = Array.from(
    bytes,
    byte => String.fromCodePoint(byte)
  ).join("");

  const encodedContent = btoa(binString);

  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${GITHUB_CONFIG.token}`,
          "Content-Type": "application/json",
          "User-Agent": "Lisible-App"
        },
        body: JSON.stringify({
          message: `[DATA] ${message} [skip ci]`,
          content: encodedContent,
          sha: sha || undefined
        })
      }
    );

    return res.ok;
  } catch (err) {
    console.error(
      `Update error [${path}]:`,
      err.message
    );

    return false;
  }
}

export async function getMarketplaceTasks() {
  const file = await getFile(
    "data/tasks.json"
  );

  return file &&
    Array.isArray(file.content)
    ? file.content
    : [];
}

export async function saveMarketplaceTask(
  newTask
) {
  const file = await getFile(
    "data/tasks.json"
  );

  const tasks =
    file &&
    Array.isArray(file.content)
      ? file.content
      : [];

  tasks.unshift(newTask);

  return await updateFile(
    "data/tasks.json",
    tasks,
    file?.sha || null,
    "Add Marketplace Task"
  );
}

export async function updateTaskStatus(
  taskId,
  status,
  extraData = {}
) {
  const file = await getFile(
    "data/tasks.json"
  );

  if (
    !file ||
    !Array.isArray(file.content)
  ) {
    return false;
  }

  const tasks = file.content;

  const index = tasks.findIndex(
    t => t.id === taskId
  );

  if (index !== -1) {
    tasks[index] = {
      ...tasks[index],
      status,
      ...extraData
    };

    return await updateFile(
      "data/tasks.json",
      tasks,
      file.sha,
      `Update Task Status: ${taskId}`
    );
  }

  return false;
}