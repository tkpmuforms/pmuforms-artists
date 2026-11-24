/** longest side kept: plenty to read print, far smaller than a phone photo */
export const SCAN_MAX_SIDE = 2000;

/**
 * Shrinks a photo to a JPEG the API accepts. Phone photos are often 4-12 MB;
 * this brings them to a few hundred KB. HEIC that the browser can't open
 * throws, so the caller can say so.
 */
export async function compressImage(
  file: Blob,
  maxSide = SCAN_MAX_SIDE,
  quality = 0.85,
): Promise<Blob> {
  const bitmap = await loadImage(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser can't prepare the photo");
  // white behind transparent PNGs, so text stays readable as JPEG
  context.fillStyle = "#fff";
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap.source, 0, 0, width, height);
  bitmap.close();

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Couldn't prepare the photo")),
      "image/jpeg",
      quality,
    ),
  );
}

interface Loaded {
  source: CanvasImageSource;
  width: number;
  height: number;
  close: () => void;
}

async function loadImage(file: Blob): Promise<Loaded> {
  if (typeof createImageBitmap === "function") {
    try {
      // honours the photo's rotation, so sideways phone photos come out upright
      const bitmap = await createImageBitmap(file, {
        imageOrientation: "from-image",
      });
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () => bitmap.close(),
      };
    } catch {
      // fall through to <img>, which some browsers decode more formats with
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () =>
        reject(
          new Error(
            "This photo can't be opened here. Take the photo with your camera, or use a JPG or PNG.",
          ),
        );
      img.src = url;
    });
    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      close: () => undefined,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}
