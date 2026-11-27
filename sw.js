// Preview cache migration. Retire legacy shell worker; never intercept navigation or release assets.
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys()){if(key.startsWith('bakso-len-shell-'))await caches.delete(key);}await self.registration.unregister();await self.clients.claim();})()));
