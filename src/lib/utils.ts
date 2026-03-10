// Utility functions for affiliate URL building and mailto generation
// These are NOT server actions - they run on both client and server

export function buildAffiliateUrl(
  originalUrl: string,
  amazonTag: string,
  rakutenId: string
): string {
  if (!originalUrl) return "";

  try {
    const url = new URL(originalUrl);

    // Amazon
    if (url.hostname.includes("amazon")) {
      if (amazonTag) {
        url.searchParams.set("tag", amazonTag);
      }
      return url.toString();
    }

    // Rakuten
    if (url.hostname.includes("rakuten")) {
      if (rakutenId) {
        url.searchParams.set("af_id", rakutenId);
      }
      return url.toString();
    }

    return originalUrl;
  } catch {
    return originalUrl;
  }
}

export function buildMailtoUrl(
  email: string,
  storeName: string,
  materialName: string,
  quantity: number
): string {
  const subject = encodeURIComponent(`[${storeName}] 発注のお願い`);
  const body = encodeURIComponent(
    `いつもお世話になっております。\n${storeName}です。\n\n下記の通り発注をお願いいたします。\n\n品名: ${materialName}\n数量: ${quantity}個\n\nよろしくお願いいたします。`
  );
  return `mailto:${email}?subject=${subject}&body=${body}`;
}
