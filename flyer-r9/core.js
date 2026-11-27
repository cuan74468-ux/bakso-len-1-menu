export const categories=['Bakso','Mie & Bakar','Topping','Minuman'];
export const rupiah=n=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n);
export const clean=(s,max=300)=>String(s??'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,max);
export function phone(s){const raw=String(s??'').trim();if(!/^\+?[\d\s()-]+$/.test(raw))return '';let n=raw.replace(/\D/g,'');if(n.startsWith('0'))n='62'+n.slice(1);return /^628\d{7,11}$/.test(n)?n:'';}
export function price(m,v){if(!['porsi','satuan'].includes(v))return null;const n=m?.['harga_'+v];return Number.isSafeInteger(n)&&n>0?n:null;}
export function parseCatalog(v){if(v?.ok!==true||v.schema!==1||!Array.isArray(v.menu)||!Array.isArray(v.kurir)||typeof v.store?.open!=='boolean'||!Number.isFinite(Date.parse(v.generated_at)))throw Error('API tidak valid');const ids=new Set();for(const m of v.menu){if(typeof m.id_menu!=='string'||!m.id_menu||ids.has(m.id_menu)||!categories.includes(m.kategori)||typeof m.nama_menu!=='string'||!['READY','HABIS'].includes(m.status)||(!price(m,'porsi')&&!price(m,'satuan')))throw Error('Menu tidak valid');ids.add(m.id_menu);}const couriers=new Set();for(const c of v.kurir){if(!c.id_kurir||couriers.has(c.id_kurir)||!phone(c.whatsapp)||typeof c.nama_kurir!=='string')throw Error('Kurir tidak valid');couriers.add(c.id_kurir);}return v;}
export function reviewCart(cart,menu){const list=new Map(menu.map(m=>[m.id_menu,m]));const changes=[];let total=0;for(const l of cart){const m=list.get(l.id);const p=price(m,l.variant);if(!m||m.status!=='READY'||p===null){changes.push(l.name+': tidak tersedia');continue;}if(p!==l.price||m.nama_menu!==l.name)changes.push(l.name+': menu/harga berubah');if(!Number.isInteger(l.qty)||l.qty<1||l.qty>99)changes.push('Jumlah tidak valid');else total+=p*l.qty;}return {changes,total};}
export function message(cart,buyer,total,courier){
 const contact=phone(buyer.phone);
 return ['*PESANAN BAKSO LEN 1*',courier?'Untuk: '+clean(courier.nama_kurir,100):'','',
 '*DATA PELANGGAN*','Nama: '+clean(buyer.name,80),'WhatsApp: '+(contact?'+'+contact:'-'),'Alamat: '+clean(buyer.address,400),'Patokan: '+(clean(buyer.landmark,160)||'-'),'',
 '*RINCIAN PESANAN*',...cart.flatMap((l,i)=>[(i+1)+'. '+l.qty+'x '+clean(l.name,100)+' ('+l.variant+')','   Harga: '+rupiah(l.price)+' x '+l.qty+' = '+rupiah(l.qty*l.price),...(l.note?['   Catatan/pilihan: '+clean(l.note,400)]:[])]),'',
 'Jumlah item: '+cart.reduce((sum,l)=>sum+l.qty,0),'*Estimasi belanja: '+rupiah(total)+'*','Ongkir belum termasuk; disepakati langsung dengan kurir.','',
 'Mohon kurir segera konfirmasi pesanan ini kepada pelanggan melalui nomor WhatsApp '+(contact?'+'+contact:'yang tertera di atas')+(contact?' (https://wa.me/'+contact+')':'')+'. Pastikan rincian pesanan, ketersediaan, alamat dan ongkos kirim sebelum membeli makanan di Bakso Len 1.'].join('\n');
}
export function whatsappUrl(n,msg){const p=phone(n);if(!p)throw Error('Nomor kurir tidak valid');return 'https://wa.me/'+p+'?text='+encodeURIComponent(msg);}
