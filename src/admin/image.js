const MAX_SIDE = 1600;

// Downscale an image in the browser and re-encode it as WebP, returned as base64.
export async function prepareImage(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const encode = type => new Promise(resolve => canvas.toBlob(resolve, type, 0.85));
  let blob = await encode('image/webp');
  // Browsers without WebP encoding fall back to PNG; use JPEG instead to keep files small.
  if (blob?.type !== 'image/webp') blob = await encode('image/jpeg');
  if (!blob) throw new Error('No se pudo procesar la imagen.');
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
  return { contentType: blob.type, data: dataUrl.split(',')[1] };
}
