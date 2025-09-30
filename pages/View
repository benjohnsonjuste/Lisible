async function handleUpload(file) {
  const reader = new FileReader();
  reader.onloadend = async () => {
    const base64 = reader.result.split(",")[1]; // enlever le préfixe

    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        mimeType: file.type,
        base64,
      }),
    });

    const data = await res.json();
    console.log("✅ URL publique :", data.url);
  };
  reader.readAsDataURL(file);
}