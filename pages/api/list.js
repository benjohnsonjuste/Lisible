import { getAllRows } from "@/lib/googleSheets";

export default async function handler(req, res) {
  try {
    const rows = await getAllRows();
    res.status(200).json(rows);
  } catch (e) {
    res.status(500).json({ error: "Impossible de charger les publications" });
  }
}