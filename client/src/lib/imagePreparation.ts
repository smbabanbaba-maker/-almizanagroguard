const MAX_EDGE = 1600;
const MAX_DATA_URL_CHARS = 3_800_000;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the selected image."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not prepare the selected image."));
    image.src = dataUrl;
  });
}

/** Prepare a mobile upload for the serverless vision request without changing the preview. */
export async function prepareImageDataUrl(file: File): Promise<string> {
  const original = await readAsDataUrl(file);
  if (typeof window === "undefined" || file.type === "image/heic" || file.type === "image/heif") {
    return original;
  }

  try {
    const image = await loadImage(original);
    const longestEdge = Math.max(image.naturalWidth, image.naturalHeight);
    const scale = Math.min(1, MAX_EDGE / Math.max(1, longestEdge));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) return original;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    for (const quality of [0.82, 0.72, 0.62, 0.52]) {
      const compressed = canvas.toDataURL("image/jpeg", quality);
      if (compressed.length <= MAX_DATA_URL_CHARS || quality === 0.52) {
        return compressed.length < original.length ? compressed : original;
      }
    }
  } catch {
    return original;
  }

  return original;
}
