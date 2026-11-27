import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {API_URL} from '../js/config.js';
import {parseCatalog,price} from '../js/core.js';
import {seedMenu} from '../js/seed.js';

assert.ok(/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(API_URL),'Missing public /exec configuration');
const root=resolve('.'), types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
const server=createServer(async(req,res)=>{try{const path=resolve(root,'.'+new URL(req.url,'http://localhost').pathname);const file=path===root?resolve(root,'index.html'):path;if(!file.startsWith(root+sep))throw Error('path');res.setHeader('Content-Type',types[extname(file)]||'text/plain');res.end(await readFile(file));}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser;
try{
 // Anonymous, read-only request. Do not log response body or courier numbers.
 const u=new URL(API_URL);u.searchParams.set('_',String(Date.now()));
 const response=await fetch(u,{redirect:'follow',signal:AbortSignal.timeout(30000)});
 assert.ok(response.ok,'API HTTP '+response.status);
 assert.match(response.headers.get('content-type')||'',/application\/json/i,'API did not return JSON');
 const data=parseCatalog(await response.json());
 assert.ok(data.menu.length>0,'Empty menu');
 const byId=new Map(data.menu.map(m=>[m.id_menu,m]));
 const matched=seedMenu.filter(m=>{const actual=byId.get(m.id_menu);return actual&&actual.nama_menu===m.nama_menu&&price(actual,'porsi')===price(m,'porsi')&&price(actual,'satuan')===price(m,'satuan');}).length;
 console.log(JSON.stringify({status:'LIVE_API_OK',menu_count:data.menu.length,reference_price_matches:matched,reference_count:seedMenu.length,active_couriers:data.kurir.length,store_open:data.store.open}));
 browser=await chromium.launch({headless:true});
 const ctx=await browser.newContext({viewport:{width:360,height:740},serviceWorkers:'block'});
 const p=await ctx.newPage(), errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('https://wa.me/**',r=>r.abort());
 await p.goto('http://127.0.0.1:'+server.address().port);
 await p.waitForFunction(()=>/^(BUKA|TUTUP) · /.test(document.querySelector('#store')?.textContent||''),null,{timeout:30000});
 assert.ok(await p.locator('.menu-card').count()>0);
 assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow');
 const label=await p.locator('#store').textContent();
 if(label.startsWith('TUTUP')||label.includes('Kurir belum tersedia'))assert.equal(await p.locator('.menu-card:enabled').count(),0,'Closed store or no courier should block checkout');
 assert.deepEqual(errors,[]);
 console.log('LIVE_BROWSER_OK: real GAS response, CORS, rendering at 360px, no WhatsApp send');
 await ctx.close();
}finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
