import {API_URL} from './config.js';import {seedMenu} from './seed.js';import {categories,rupiah,clean,phone,price,parseCatalog,reviewCart,message,whatsappUrl} from './core.js';
const $=id=>document.getElementById(id);const node=(tag,t='',cls='')=>{const e=document.createElement(tag);e.textContent=t;if(cls)e.className=cls;return e};
let menu=seedMenu,live=null,cart=[],category='Semua',chosen=null,checking=false,requestSeq=0;const buyer=$('buyer');
function notify(t){$('notice').textContent=t;}
function canOrder(){return live?.store.open===true&&live.kurir.length>0;}
function renderMenu(){
 const q=$('search').value.toLowerCase().trim(),root=$('menus');
 root.replaceChildren();
 for(const cat of categories){
  if(category!=='Semua'&&category!==cat)continue;
  const ms=menu.filter(m=>m.kategori===cat&&(m.nama_menu+' '+m.deskripsi).toLowerCase().includes(q));
  if(!ms.length)continue;
  const section=node('section','','menu-section'),heading=node('h3',cat,'category'),grid=node('div','','menu-grid');
  section.append(heading,grid);
  for(const m of ms){
   const b=node('button','','menu-card');b.type='button';
   const ready=canOrder()&&m.status==='READY';b.disabled=!ready;
   if(m.foto_url){try{const u=new URL(m.foto_url,location.href);if(u.protocol==='https:'||(u.origin===location.origin&&u.protocol==='http:')){const img=document.createElement('img');img.alt='';img.loading='lazy';img.referrerPolicy='no-referrer';img.src=u.href;img.addEventListener('error',()=>img.remove());b.append(img);}}catch{}}
   const info=node('div','','menu-info'),name=node('strong',m.nama_menu);
   info.append(name);
   if(m.badge==='Best'||m.badge==='New')info.append(node('span',m.badge==='Best'?'Favorit':'Baru','badge'));
   if(m.deskripsi)info.append(node('span',m.deskripsi,'description'));
   if(live&&m.status==='HABIS')info.append(node('span','Habis','stock'));
   const prices=node('div','','prices');
   for(const v of ['porsi','satuan'])if(price(m,v)){const line=node('div','','price-line');line.append(node('span',rupiah(price(m,v))),node('small',v));prices.append(line);}
   if(ready){const plus=node('span','+','add-mark');plus.setAttribute('aria-hidden','true');prices.append(plus);}
   b.append(info,prices);b.addEventListener('click',()=>openItem(m));grid.append(b);
  }
  root.append(section);
 }
 if(!root.children.length)root.append(node('p','Menu tidak ditemukan.'));
}
function renderFilters(){ $('filters').replaceChildren();for(const cat of ['Semua',...categories]){const b=node('button',cat);b.type='button';b.setAttribute('aria-pressed',String(cat===category));b.onclick=()=>{category=cat;renderFilters();renderMenu()};$('filters').append(b);}}
function openItem(m){chosen=m;$('item-title').textContent=m.nama_menu;$('item-desc').textContent=m.deskripsi;$('variant').replaceChildren();for(const v of ['porsi','satuan'])if(price(m,v)){const opt=node('option',(v==='porsi'?'Porsian':'Satuan')+' — '+rupiah(price(m,v)));opt.value=v;$('variant').append(opt);}$('qty').value=1;$('note').value='';$('item').showModal();}
$('close').onclick=()=>$('item').close();$('item-form').onsubmit=e=>{e.preventDefault();if(!chosen||!canOrder())return;const v=$('variant').value,qty=Number($('qty').value),note=clean($('note').value,180),p=price(chosen,v);if(!p||!Number.isInteger(qty)||qty<1||qty>99)return;const existing=cart.find(l=>l.id===chosen.id_menu&&l.variant===v&&l.note===note&&l.price===p);if(existing&&existing.qty+qty>99){notify('Maksimal 99 per item.');return;}if(existing)existing.qty+=qty;else cart.push({id:chosen.id_menu,name:chosen.nama_menu,variant:v,qty,price:p,note});$('item').close();renderCart();notify('Ditambahkan ke troli.');};
function total(){return cart.reduce((a,l)=>a+l.price*l.qty,0)}function formData(){return Object.fromEntries(new FormData(buyer))}
function renderCart(){const count=cart.reduce((a,l)=>a+l.qty,0);$('count').textContent=count;$('total').textContent=rupiah(total());$('cart').replaceChildren();if(!cart.length)$('cart').append(node('p','Troli masih kosong.','muted'));for(const [i,l] of cart.entries()){const row=node('div','','line'),left=node('div');left.append(node('strong',l.name),node('p',l.variant+' · '+rupiah(l.price)+(l.note?' · '+l.note:'')));const right=node('div');for(const [t,d] of [['−',-1],['+',1]]){const b=node('button',t);b.type='button';b.setAttribute('aria-label',(d>0?'Tambah':'Kurangi')+' '+l.name);b.disabled=checking||(d>0&&l.qty>=99);b.onclick=()=>{l.qty+=d;if(l.qty===0)cart.splice(i,1);renderCart()};right.append(b);if(d<0)right.append(node('span',String(l.qty)));}row.append(left,right);$('cart').append(row);}if(cart.length){const s=node('div','','summary');s.append(node('span','Estimasi belanja'),node('span',rupiah(total())));$('cart').append(s);}$('checkout').hidden=!cart.length;buyer.querySelector('button[type=submit]').disabled=!canOrder()||checking;$('copy').disabled=checking||!canOrder();updatePreview();}
function updatePreview(){$('preview').textContent=cart.length?message(cart,formData(),total()):'';}
function renderCouriers(){const select=buyer.elements.courier,prior=select.value;select.replaceChildren();const blank=node('option','Pilih kurir');blank.value='';select.append(blank);$('couriers').replaceChildren();for(const c of live?.kurir??[]){const opt=node('option',c.nama_kurir+(c.area_layanan?' — '+c.area_layanan:''));opt.value=c.id_kurir;select.append(opt);const el=node('div','','line');el.append(node('strong',c.nama_kurir),node('span',c.area_layanan||''));$('couriers').append(el);}if([...select.options].some(o=>o.value===prior))select.value=prior;if(!live?.kurir?.length)$('couriers').append(node('p','Belum ada kurir aktif terverifikasi.','muted'));}
function applyCatalog(v){live=v;menu=v?.menu??seedMenu;$('store').textContent=v?(v.store.open?'BUKA':'TUTUP')+' · '+v.store.jam_buka+'–'+v.store.jam_tutup+' WIB'+(v.store.open&&!v.kurir.length?' · Kurir belum tersedia':''):'Daftar menu referensi · pemesanan belum tersedia';renderMenu();renderCouriers();renderCart();}
async function refresh(){const seq=++requestSeq;try{if(!API_URL)throw Error('API belum dikonfigurasi');const url=new URL(API_URL);if(url.protocol!=='https:'||url.hostname!=='script.google.com')throw Error('API URL tidak valid');url.searchParams.set('_',String(Date.now()));const res=await fetch(url,{cache:'no-store',credentials:'omit',redirect:'follow',signal:AbortSignal.timeout(10000)});if(!res.ok)throw Error('API gagal');const v=parseCatalog(await res.json());if(seq!==requestSeq)throw Error('Data sudah berubah. Coba lagi.');applyCatalog(v);return v;}catch(e){if(seq===requestSeq)applyCatalog(null);throw e;}}
function page(p){for(const n of ['menu','cart','courier'])$(n+'-page').hidden=n!==p;document.querySelectorAll('[data-page]').forEach(b=>{if(b.dataset.page===p)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});window.scrollTo(0,0);}
for(const b of document.querySelectorAll('[data-page]'))b.onclick=()=>page(b.dataset.page);$('search').addEventListener('input',renderMenu);buyer.addEventListener('input',updatePreview);
async function validatedMessage(){const data=formData();if(!phone(data.phone)||!clean(data.name)||!clean(data.address)||!clean(data.landmark)||!data.courier)throw Error('Lengkapi nama, nomor WA Indonesia, alamat, patokan, dan kurir.');const snapshot=cart.map(x=>({...x}));const v=await refresh();const r=reviewCart(snapshot,v.menu);const c=v.kurir.find(x=>x.id_kurir===data.courier);if(!v.store.open||!c)throw Error('Toko tutup atau kurir tidak tersedia.');if(r.changes.length)throw Error(r.changes.join('; ')+'. Hapus item terkait dari troli dan pilih ulang.');if(JSON.stringify(snapshot)!==JSON.stringify(cart)||JSON.stringify(data)!==JSON.stringify(formData()))throw Error('Pesanan berubah. Periksa kembali.');return {msg:message(snapshot,data,r.total),courier:c};}
async function finish(copy){if(checking||!cart.length)return;checking=true;renderCart();try{const {msg,courier}=await validatedMessage();if(copy){await navigator.clipboard.writeText(msg);notify('Pesan disalin. Konfirmasikan pesanan dengan kurir.');}else location.assign(whatsappUrl(courier.whatsapp,msg));}catch(err){notify('Pesanan belum dikirim. '+(err.message||'Tidak dapat memeriksa data terbaru.'));}finally{checking=false;renderCart();}}
$('copy').onclick=()=>finish(true);buyer.onsubmit=e=>{e.preventDefault();finish(false);};
renderFilters();applyCatalog(null);refresh().catch(()=>{});window.addEventListener('online',()=>refresh().catch(()=>{}));window.addEventListener('offline',()=>{requestSeq++;applyCatalog(null)});document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&!checking)refresh().catch(()=>{})});setInterval(()=>{if(document.visibilityState==='visible'&&!checking)refresh().catch(()=>{})},60000);if('serviceWorker'in navigator&&location.protocol==='https:')navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(r=>r.update()).catch(()=>{});
