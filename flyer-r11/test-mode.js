import {phone,clean} from './core.js';
// Test contacts are supplied only by the URL fragment, not bundled or persisted.
// No writes, payment, or production availability overrides.
export function readTestContacts(hash){
 const params=new URLSearchParams(String(hash||'').replace(/^#/,''));
 if(params.get('mode')!=='uat')return null;
 const inputs=params.getAll('kurir');
 if(inputs.length!==2)return null;
 const contacts=inputs.map((s,i)=>{const at=s.indexOf(':');if(at<1)return null;const name=clean(s.slice(0,at),50),wa=phone(s.slice(at+1));return name&&wa?{id_kurir:'UAT-'+(i+1),nama_kurir:name,whatsapp:wa,area_layanan:'Nomor uji coba',urutan:i+1}:null;});
 if(contacts.some(c=>!c)||new Set(contacts.map(c=>c.whatsapp)).size!==2)return null;
 return contacts;
}
export function makeTestCatalog(seed,contacts){
 if(!contacts)throw Error('Link uji tidak valid');
 return {ok:true,schema:1,generated_at:new Date().toISOString(),store:{open:true,jam_buka:'09:00',jam_tutup:'19:30',timezone:'Asia/Jakarta'},menu:seed.map(m=>({...m,status:'READY'})),kurir:contacts.map(c=>({...c}))};
}
export function markTestMessage(msg){return '*UJI COBA — BUKAN PESANAN SUNGGUHAN*\n\n'+msg+'\n\nMohon abaikan sebagai transaksi sungguhan. Pesan ini hanya pengujian e-katalog.';}
