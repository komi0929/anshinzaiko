// Utility: mailto URL generation (client-safe, no secrets)

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
