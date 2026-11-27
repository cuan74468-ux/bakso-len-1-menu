import {parseCatalog} from './core.js';
// The file contains only approved public menu/contact fields. It is not live stock.
export function snapshotCatalog(raw,now=new Date()){
 const v=parseCatalog(raw);
 const minute=s=>{if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(s))throw Error('Jam katalog tidak valid');return Number(s.slice(0,2))*60+Number(s.slice(3));};
 if(v.source!=='sheet_snapshot'||typeof v.store.enabled!=='boolean'||v.store.timezone!=='Asia/Jakarta')throw Error('Salinan katalog tidak valid');
 const expires=Date.parse(v.valid_until),created=Date.parse(v.generated_at);
 if(!Number.isFinite(expires)||expires<=created||expires-created>8*86400000||now.getTime()<created||now.getTime()>=expires)throw Error('Salinan katalog perlu diperbarui');
 const t=minute(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Jakarta',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(now));
 const start=minute(v.store.jam_buka),end=minute(v.store.jam_tutup);
 if(start>=end)throw Error('Jam katalog tidak valid');
 return {...v,store:{...v.store,open:v.store.enabled&&t>=start&&t<end}};
}
export function markSnapshotMessage(msg){return '*PERMINTAAN PESANAN — MENUNGGU KONFIRMASI*\n'+msg+'\n\nHarga dan stok berdasarkan katalog terakhir. Mohon kurir cek ketersediaan dan harga aktual serta konfirmasi kepada pelanggan sebelum membeli.';}
