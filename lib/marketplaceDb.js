// /lib/marketplaceDb.js

// Fonction générique pour communiquer avec ton API existante github-db
async function callGitHubDB(action, payload = {}) {
  // Remplace par l'URL absolue de ton site si nécessaire, ou relative si exécutée côté client
  const baseUrl = typeof window !== "undefined" ? "" : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  
  const res = await fetch(`${baseUrl}/api/github-db`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload })
  });
  
  if (!res.ok) throw new Error(`Erreur github-db Action: ${action}`);
  return await res.json();
}

export async function getMarketplaceTasks() {
  const res = await fetch(`${typeof window !== "undefined" ? "" : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/github-db?action=get_tasks`);
  if (!res.ok) return [];
  return await res.json();
}

export async function saveMarketplaceTask(newTask) {
  return await callGitHubDB("save_task", { task: newTask });
}

export async function updateTaskStatus(taskId, status, extraData = {}) {
  return await callGitHubDB("update_task_status", { taskId, status, ...extraData });
}
