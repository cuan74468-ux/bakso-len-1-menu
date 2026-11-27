import {API_URL} from './config.js';import {snapshotCatalog,markSnapshotMessage} from './snapshot.js';import {PROMO_VIDEO_URL,PROMO_VIDEO_WEBM_URL} from './media.js';import {readTestContacts,makeTestCatalog,markTestMessage} from './test-mode.js';import {seedMenu} from './seed.js';import {categories,rupiah,clean,phone,price,parseCatalog,reviewCart,message,whatsappUrl} from './core.js';
const $=id=>document.getElementById(id);const node=(tag,t='',cls='')=>{const e=document.createElement(tag);e.textContent=t;if(cls)e.className=cls;return e};
let menu=seedMenu,live=null,cart=[],category='Bakso',chosen=null,checking=false,requestSeq=0,menuPage=1;const PAGE_SIZE=6;let seenLive=false;const buyer=$('buyer');const testContacts=readTestContacts(location.hash);const testMode=Boolean(testContacts);const formatOrder=(cart,data,total,courier)=>{const msg=message(cart,data,total,courier);return testMode?markTestMessage(msg):live?.source==='sheet_snapshot'?markSnapshotMessage(msg):msg;};
let noticeTimer;function notify(t){$('notice').textContent=t;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>{$('notice').textContent='';},6500);}
function canOrder(){return live?.store.open===true&&live.kurir.length>0&&(live.source!=='sheet_snapshot'||Date.now()<Date.parse(live.valid_until));}
function publicMedia(value){try{const u=new URL(value,location.href);if(u.protocol==='https:'||u.origin===location.origin)return u.href;}catch{}return '';}
function imageFor(m){
 const wrap=node('span','','food-image'),im=document.createElement('img');im.alt='';im.loading='lazy';im.referrerPolicy='no-referrer';
 const key=m.kategori==='Bakso'?'bakso':m.kategori==='Topping'?'topping':m.kategori==='Mie & Bakar'?(/Ayam Sambal|Bebek/.test(m.nama_menu)?'bakar':'mie'):/Jeruk/.test(m.nama_menu)?'jeruk':/Oyen/.test(m.nama_menu)?'oyen':/Es Teh/.test(m.nama_menu)?'teh':'air';
 const fallback=new URL('../assets/menu-visuals/'+key+'.jpg',import.meta.url).href;
 const label=node('small','Ilustrasi AI','illustration-label');const src=m.foto_url&&publicMedia(m.foto_url);
 if(src){im.src=src;label.hidden=true;im.addEventListener('error',()=>{im.src=fallback;label.hidden=false;},{once:true});}else im.src=fallback;
 wrap.append(im,label);return wrap;
}
function renderMenu(){
 const q=$('search').value.toLowerCase().trim(),root=$('menus'),nav=$('pagination');root.replaceChildren();nav.replaceChildren();
 const list=menu.filter(m=>(q||category==='Semua'||m.kategori===category)&&(m.nama_menu+' '+m.deskripsi).toLowerCase().includes(q));
 const pages=Math.max(1,Math.ceil(list.length/PAGE_SIZE));menuPage=Math.min(Math.max(menuPage,1),pages);
 const selected=list.slice((menuPage-1)*PAGE_SIZE,menuPage*PAGE_SIZE);
 for(const cat of categories){
  const ms=selected.filter(m=>m.kategori===cat);if(!ms.length)continue;
  const section=node('section','','menu-section'),heading=node('h3',cat,'category'),grid=node('div','','menu-grid');section.append(heading,grid);
  for(const m of ms){
   const b=node('button','','menu-card');b.type='button';b.append(imageFor(m));const info=node('div','','menu-info');info.append(node('strong',m.nama_menu));
   if(m.badge==='Best'||m.badge==='New')info.append(node('span',m.badge==='Best'?'Favorit':'Baru','badge'));
   if(m.deskripsi)info.append(node('span',m.deskripsi,'description'));if(live&&m.status==='HABIS')info.append(node('span','Habis','stock'));
   const prices=node('div','','prices');for(const v of ['porsi','satuan'])if(price(m,v)){const line=node('div','','price-line');line.append(node('span',rupiah(price(m,v))),node('small',v));prices.append(line);}
   const plus=node('span','+','add-mark');plus.setAttribute('aria-hidden','true');prices.append(plus);
   b.append(info,prices);b.onclick=()=>openItem(m);grid.append(b);
  }root.append(section);
 }
 if(!selected.length)root.append(node('p','Menu tidak ditemukan.'));
 if(pages>1){for(const [label,delta] of [['Sebelumnya',-1],['Berikutnya',1]]){const b=node('button',label);b.type='button';b.disabled=delta<0?menuPage===1:menuPage===pages;b.onclick=()=>{menuPage+=delta;renderMenu();$('catalog-start').scrollIntoView({block:'start'});};nav.append(b);if(delta<0)nav.append(node('span',menuPage+' / '+pages));}}
 $('catalog-caption').textContent=list.length+' menu · Foto asli bila tersedia; ilustrasi AI merupakan gambaran menu.';
}
function renderFeatured(){
 const root=$('featured-items');root.replaceChildren();
 const picks=menu.filter(m=>m.badge==='Best'||m.id_menu==='MNU-01').sort((a,b)=>Number(a.urutan)-Number(b.urutan)).slice(0,4);
 for(const m of picks){const b=node('button','','feature-card');b.type='button';b.append(imageFor(m));const content=node('div','','feature-copy');content.append(node('span',m.badge==='New'?'Menu baru':'Favorit','feature-tag'),node('strong',m.nama_menu),node('span',rupiah(price(m,'porsi')||price(m,'satuan'))+(price(m,'porsi')?' / porsi':' / satuan'),'feature-price'));b.append(content);b.onclick=()=>openItem(m);root.append(b);}
 $('featured-title').closest('section').hidden=!picks.length;
}
$('browse').onclick=()=>{category='Semua';menuPage=1;$('search').value='';renderFilters();renderMenu();$('catalog-start').scrollIntoView({behavior:'smooth',block:'start'});};
const promo= PROMO_VIDEO_URL && publicMedia(PROMO_VIDEO_URL);const promoWebm=PROMO_VIDEO_WEBM_URL&&publicMedia(PROMO_VIDEO_WEBM_URL);
const video=$('promo-video'),play=$('play-promo');const mediaSources=[...(promoWebm&&video.canPlayType('video/webm; codecs="vp9,opus"')?[promoWebm]:[]),...(promo?[promo]:[])];let mediaIndex=0;
if(mediaSources.length){play.onclick=()=>{if(!video.hidden){video.pause();video.hidden=true;play.setAttribute('aria-expanded','false');$('video-status').textContent='Tonton video promosi · 15 detik';return;}if(!video.getAttribute('src')){mediaIndex=0;video.src=mediaSources[0];}video.hidden=false;play.setAttribute('aria-expanded','true');$('video-status').textContent='Ketuk untuk menutup video';video.play().catch(()=>{});};video.addEventListener('error',()=>{if(video.hidden)return;if(mediaIndex+1<mediaSources.length){video.src=mediaSources[++mediaIndex];video.play().catch(()=>{});return;}video.hidden=true;play.setAttribute('aria-expanded','false');$('video-status').textContent='Video belum dapat diputar. Coba lagi.';video.removeAttribute('src');});}else{play.disabled=true;$('video-status').textContent='Video promosi belum tersedia.';}
function renderFilters(){ $('filters').replaceChildren();for(const cat of ['Semua',...categories]){const b=node('button',cat);b.type='button';b.setAttribute('aria-pressed',String(cat===category));b.onclick=()=>{category=cat;menuPage=1;$('search').value='';renderFilters();renderMenu()};$('filters').append(b);}}
function variantChoices(m){
 const root=$('item-options');root.replaceChildren();let choices=[];
 if(m.id_menu==='MNU-09')choices=[['Bakso besar 1',['Cincang','Telur','Urat']],['Bakso besar 2',['Cincang','Telur','Urat']]];
 if(m.id_menu==='MNU-11')choices=[['Bakso besar',['Urat','Cincang','Telur']]];
 if(m.id_menu==='MNU-24')choices=[['Minuman',['Fruit Tea','Teh Botol','Air Mineral Prima']]];
 for(const [label,options] of choices){const l=node('label',label),select=document.createElement('select');select.required=true;select.dataset.option=label;for(const v of options){const o=node('option',v);o.value=v;select.append(o);}l.append(select);root.append(l);}
}
function updateItemTotal(){const p=price(chosen,$('variant').value)||0;const qty=Number($('qty').value);$('item-total').textContent='Subtotal: '+rupiah(p*(Number.isInteger(qty)&&qty>0?qty:0));}
function openItem(m){chosen=m;$('item-title').textContent=m.nama_menu;$('item-desc').textContent=m.deskripsi;$('item-photo').replaceChildren(imageFor(m));$('item-state').textContent=live&&m.status==='HABIS'?'Menu sedang habis.':canOrder()?'':'Susun troli dahulu. Pengiriman ke kurir belum tersedia.';$('add-item').disabled=Boolean(live&&m.status==='HABIS');$('variant').replaceChildren();for(const v of ['porsi','satuan'])if(price(m,v)){const opt=node('option',(v==='porsi'?'Porsian':'Satuan')+' — '+rupiah(price(m,v)));opt.value=v;$('variant').append(opt);}$('qty').value=1;$('note').value='';variantChoices(m);updateItemTotal();$('item').showModal();}
$('variant').onchange=updateItemTotal;$('qty').oninput=updateItemTotal;
$('close').onclick=()=>$('item').close();$('item-form').onsubmit=e=>{e.preventDefault();if(!chosen||checking)return;const current=menu.find(m=>m.id_menu===chosen.id_menu);if(!current||live&&current.status==='HABIS'){notify('Menu tidak tersedia.');$('item').close();return;}const v=$('variant').value,qty=Number($('qty').value),options=[...$('item-options').querySelectorAll('select')].map(s=>s.dataset.option+': '+s.value),note=clean([...options,clean($('note').value,180)].filter(Boolean).join('; '),400),p=price(chosen,v);if(!p||p!==price(current,v)||!Number.isInteger(qty)||qty<1||qty>99){notify('Harga berubah atau jumlah tidak valid. Pilih ulang.');$('item').close();return;}const existing=cart.find(l=>l.id===chosen.id_menu&&l.variant===v&&l.note===note&&l.price===p);if(existing&&existing.qty+qty>99){notify('Maksimal 99 per item.');return;}if(existing)existing.qty+=qty;else cart.push({id:chosen.id_menu,name:chosen.nama_menu,variant:v,qty,price:p,note});$('item').close();renderCart();notify('Ditambahkan ke troli.');};
$('continue-menu').onclick=()=>page('menu');
function total(){return cart.reduce((a,l)=>a+l.price*l.qty,0)}function formData(){return Object.fromEntries(new FormData(buyer))}
function renderCart(){const count=cart.reduce((a,l)=>a+l.qty,0);$('count').textContent=count;$('total').textContent=rupiah(total());$('cart').replaceChildren();if(!cart.length)$('cart').append(node('p','Troli masih kosong.','muted'));for(const [i,l] of cart.entries()){const row=node('div','','line'),left=node('div');left.append(node('strong',l.name),node('p',l.variant+' · '+rupiah(l.price)+(l.note?' · '+l.note:'')));const right=node('div');for(const [t,d] of [['−',-1],['+',1]]){const b=node('button',t);b.type='button';b.setAttribute('aria-label',(d>0?'Tambah':'Kurangi')+' '+l.name);b.disabled=checking||(d>0&&l.qty>=99);b.onclick=()=>{l.qty+=d;if(l.qty===0)cart.splice(i,1);renderCart()};right.append(b);if(d<0)right.append(node('span',String(l.qty)));}row.append(left,right);$('cart').append(row);}if(cart.length){const s=node('div','','summary');s.append(node('span','Estimasi belanja'),node('span',rupiah(total())));$('cart').append(s);}$('checkout').hidden=!cart.length;$('checkout-status').textContent=canOrder()?(testMode?'MODE UJI COBA — isi data contoh dan pilih nomor uji.':(live?.source==='sheet_snapshot'?'Pilih kurir. Harga, stok dan ongkir dikonfirmasi langsung.':'Pilih kurir dan isi alamat pengantaran.')):'Troli tersimpan sementara di halaman ini. Checkout belum tersedia karena toko atau kurir belum siap.';buyer.querySelector('button[type=submit]').disabled=!canOrder()||checking;$('copy').disabled=checking||!canOrder();updatePreview();}
function updatePreview(){const data=formData();$('preview').textContent=cart.length?formatOrder(cart,data,total(),live?.kurir.find(c=>c.id_kurir===data.courier)):'';}
function renderCouriers(){const select=buyer.elements.courier,prior=select.value;select.replaceChildren();const blank=node('option','Pilih kurir');blank.value='';select.append(blank);$('couriers').replaceChildren();for(const c of live?.kurir??[]){const opt=node('option',c.nama_kurir+(c.area_layanan?' — '+c.area_layanan:''));opt.value=c.id_kurir;select.append(opt);const el=node('div','','line');const info=node('div');info.append(node('strong',c.nama_kurir),node('p',c.area_layanan||'Kurir mitra'));const choose=node('button','Pilih');choose.type='button';choose.className='courier-select';choose.setAttribute('aria-label','Pilih '+c.nama_kurir);choose.onclick=()=>{select.value=c.id_kurir;updatePreview();page(cart.length?'cart':'menu');notify(cart.length?'Kurir dipilih: '+c.nama_kurir:'Kurir dipilih. Silakan tambah menu.');};el.append(info,choose);$('couriers').append(el);}if([...select.options].some(o=>o.value===prior))select.value=prior;if(!live?.kurir?.length)$('couriers').append(node('p',live?'Belum ada kurir aktif.':'Daftar kurir sedang tidak tersedia. Muat ulang halaman.','muted'));}
function applyCatalog(v){live=v;menu=v?.menu??seedMenu;$('store').textContent=testMode?'MODE UJI COBA · Bukan pesanan sungguhan':v?(v.store.open?'BUKA':'TUTUP')+' · '+v.store.jam_buka+'–'+v.store.jam_tutup+' WIB'+(v.source==='sheet_snapshot'?' · Konfirmasi ke kurir':v.store.open&&!v.kurir.length?' · Kurir belum tersedia':''):'Daftar menu referensi · pemesanan belum tersedia';renderMenu();renderFeatured();renderCouriers();renderCart();}
async function refresh(){
 const seq=++requestSeq;
 try{
  if(testMode){const v=parseCatalog(makeTestCatalog(seedMenu,testContacts));applyCatalog(v);return v;}
  if(!API_URL)throw Error('API belum dikonfigurasi');
  const url=new URL(API_URL);if(url.protocol!=='https:'||url.hostname!=='script.google.com')throw Error('API URL tidak valid');
  url.searchParams.set('_',String(Date.now()));
  let res=null, unavailable=false;
  try{res=await fetch(url,{cache:'no-store',credentials:'omit',redirect:'follow',signal:AbortSignal.timeout(3500)});}catch{unavailable=true;}
  if(res&&(!res.ok||!/application\/json/i.test(res.headers.get('content-type')||'')))unavailable=true;
  let v;
  if(unavailable){
   if(seenLive)throw Error('Koneksi katalog aktual terputus. Coba lagi.');
   const u=new URL('../data/public-catalog.json',import.meta.url);u.searchParams.set('_',String(Date.now()));
   const backup=await fetch(u,{cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(5000)});
   if(!backup.ok)throw Error('Katalog cadangan tidak tersedia');
   v=snapshotCatalog(await backup.json());
  }else{v=parseCatalog(await res.json());seenLive=true;}
  if(seq!==requestSeq)throw Error('Data sudah berubah. Coba lagi.');
  applyCatalog(v);return v;
 }catch(e){if(seq===requestSeq)applyCatalog(null);throw e;}
}
function page(p){for(const n of ['menu','cart','courier'])$(n+'-page').hidden=n!==p;document.querySelectorAll('[data-page]').forEach(b=>{if(b.dataset.page===p)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});window.scrollTo(0,0);}
for(const b of document.querySelectorAll('[data-page]'))b.onclick=()=>page(b.dataset.page);$('search').addEventListener('input',()=>{menuPage=1;renderMenu();});buyer.addEventListener('input',updatePreview);buyer.addEventListener('change',updatePreview);
async function validatedMessage(){if(!canOrder())throw Error('Pemesanan belum tersedia.');const data=formData();if(!phone(data.phone)||!clean(data.name)||!clean(data.address)||!clean(data.landmark)||!data.courier)throw Error('Lengkapi nama, nomor WA Indonesia, alamat, patokan, dan kurir.');const priorCourier=live.kurir.find(c=>c.id_kurir===data.courier);const snapshot=cart.map(x=>({...x}));const v=await refresh();const r=reviewCart(snapshot,v.menu);const c=v.kurir.find(x=>x.id_kurir===data.courier);if(!v.store.open||!c)throw Error('Toko tutup atau kurir tidak tersedia.');if(!priorCourier||phone(priorCourier.whatsapp)!==phone(c.whatsapp)||priorCourier.nama_kurir!==c.nama_kurir)throw Error('Kontak kurir berubah. Pilih ulang kurir.');if(r.changes.length)throw Error(r.changes.join('; ')+'. Hapus item terkait dari troli dan pilih ulang.');if(JSON.stringify(snapshot)!==JSON.stringify(cart)||JSON.stringify(data)!==JSON.stringify(formData()))throw Error('Pesanan berubah. Periksa kembali.');return {msg:formatOrder(snapshot,data,r.total,c),courier:c};}
async function finish(copy){if(checking||!cart.length)return;checking=true;renderCart();try{const {msg,courier}=await validatedMessage();if(copy){await navigator.clipboard.writeText(msg);notify('Pesan disalin. Konfirmasikan pesanan dengan kurir.');}else location.assign(whatsappUrl(courier.whatsapp,msg));}catch(err){notify('Pesanan belum dikirim. '+(err.message||'Tidak dapat memeriksa data terbaru.'));}finally{checking=false;renderCart();}}
$('copy').onclick=()=>finish(true);buyer.onsubmit=e=>{e.preventDefault();finish(false);};
if(testMode){$('uat-note').hidden=false;document.body.classList.add('uat-mode');buyer.querySelector('button[type=submit]').textContent='Uji checkout ke WhatsApp';}renderFilters();applyCatalog(null);refresh().catch(()=>{});window.addEventListener('online',()=>refresh().catch(()=>{}));window.addEventListener('offline',()=>{requestSeq++;if(!testMode)applyCatalog(null)});document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&!checking)refresh().catch(()=>{})});setInterval(()=>{if(document.visibilityState==='visible'&&!checking)refresh().catch(()=>{})},60000);
