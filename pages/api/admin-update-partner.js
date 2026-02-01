import { getFile, updateFile } from "@/lib/github";

export default async function handler(req, res) {
  const path = "data/marketing/partners_config.json";

  // RÉCUPÉRER LA CONFIGURATION
  if (req.method === 'GET') {
    try {
      const file = await getFile(path);
      return res.status(200).json(file ? file.content : { ads: [], lastUpdate: null });
    } catch (e) {
      return res.status(500).json({ error: "Erreur de lecture" });
    }
  }

  // METTRE À JOUR LA CONFIGURATION
  if (req.method === 'POST') {
    const { ads, adminUser } = req.body;
    
    const newConfig = {
      ads: ads,
      _metadata: {
        lastUpdate: new Date().toISOString(),
        updatedBy: adminUser
      }
    };

    try {
      const file = await getFile(path);
      const success = await updateFile(
        path, 
        newConfig, 
        file ? file.sha : null, 
        `⚙️ Ads Update by ${adminUser}`
      );

      if (success) return res.status(200).json({ success: true });
      throw new Error("Échec GitHub");
    } catch (e) {
      return res.status(500).json({ error: "Erreur de sauvegarde" });
    }
  }
}
