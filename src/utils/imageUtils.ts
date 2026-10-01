export async function optimizeImageBlob(blob: Blob): Promise<string> {
  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(1, 512 / bitmap.width, 768 / bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext('2d');
  if (!context) {
    bitmap.close();
    throw new Error('画像を処理できませんでした。');
  }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const optimizedBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(result => result ? resolve(result) : reject(new Error('画像を圧縮できませんでした。')), 'image/webp', 0.82);
  });
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('画像を読み込めませんでした。'));
    reader.readAsDataURL(optimizedBlob);
  });
}

export async function downloadAndOptimizeImage(url: string, timeoutMs = 30000): Promise<string> {
  if (!url.startsWith('http:') && !url.startsWith('https:') && !url.startsWith('data:')) {
    try {
      const bytes = Uint8Array.from(atob(url), character => character.charCodeAt(0));
      return await optimizeImageBlob(new Blob([bytes], { type: 'image/png' }));
    } catch {
      throw new Error('生成画像の形式を認識できません。');
    }
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`画像の取得に失敗しました（HTTP ${response.status}）。`);
    const blob = await response.blob();
    if (controller.signal.aborted) throw new Error('画像取得がタイムアウトしました。');
    return await optimizeImageBlob(blob);
  } catch (error) {
    if (controller.signal.aborted) throw new Error('画像取得がタイムアウトしました。CORS非対応の可能性もあります。', { cause: error });
    if (error instanceof TypeError) throw new Error('画像を取得できませんでした。プロバイダーがCORSに対応していない可能性があります。', { cause: error });
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}