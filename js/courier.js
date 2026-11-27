import {clean,whatsappUrl} from './core.js';

export function profileInitial(name) {
  return clean(name, 80).split(/\s+/).filter(Boolean).slice(0, 2).map(word => Array.from(word)[0]).join('').toLocaleUpperCase('id-ID') || '?';
}

export function courierPhotoUrl(value, base) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  try {
    const u = new URL(raw, base);
    if (u.protocol !== 'https:' && !(u.protocol === 'http:' && u.origin === new URL(base).origin)) return '';
    if (u.username || u.password) return '';
    // Only explicit public HTTPS or local courier assets.
    if (!/^https:\/\//i.test(raw) && !/^assets\/couriers\/[a-z0-9_.-]+\.(?:jpe?g|png|webp)$/i.test(raw)) return '';
    return u.href;
  } catch { return ''; }
}

export function courierChatUrl(c) {
  return whatsappUrl(c.whatsapp, 'Halo ' + clean(c.nama_kurir, 80) + ', saya ingin menanyakan layanan pengantaran Bakso Len 1.');
}
