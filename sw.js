/* Carolex Thailand 2026 - offline service worker */
var CACHE = 'carolex-v1';
var ASSETS = [
  './',
  'index.html',
  'Vandaag.html',
  'Thailand_Trip_Planner.html',
  'Kopen_en_Pakken.html',
  'Thailand_Financien.html',
  'Email_Overzicht_Thailand.html',
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
  'Thailand_Planning_Print.pdf',
  'Thailand_Boekingen_Bundel.pdf',
  'boekingen/tdac-alle-4.pdf',
  'boekingen/hotel-ascott-en.pdf',
  'boekingen/hotel-ascott-th.pdf',
  'boekingen/hotel-dheva-mantra.pdf',
  'boekingen/hotel-deva-beach.pdf',
  'boekingen/hotel-79-beach-club.pdf',
  'boekingen/hotel-long-bay.pdf',
  'boekingen/hotel-so-kohkoon.pdf',
  'boekingen/hotel-sora.pdf',
  'boekingen/vluchten-klm.pdf',
  'boekingen/vlucht-pg145.pdf',
  'boekingen/activiteit-co-van-kessel.pdf',
  'boekingen/activiteit-elephants-world.pdf',
  'boekingen/ferry-11-aug.pdf',
  'boekingen/angthong-ticket-1.pkpass',
  'boekingen/angthong-ticket-2.pkpass',
  'boekingen/angthong-ticket-3.pkpass',
  'boekingen/angthong-ticket-4-kind.pkpass'
];

/* Deze hosts zijn live data: altijd netwerk, nooit cachen (de app heeft eigen fallbacks) */
var LIVE_HOSTS = ['api.open-meteo.com', 'api.frankfurter.app'];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return Promise.all(ASSETS.map(function (url) {
        return cache.add(url).catch(function () { /* een missend bestand mag de rest niet blokkeren */ });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);

  if (LIVE_HOSTS.indexOf(url.hostname) !== -1) return; /* live data: gewoon netwerk */

  if (url.origin === self.location.origin) {
    /* eigen bestanden: cache eerst (offline!), op de achtergrond verversen */
    e.respondWith(
      caches.open(CACHE).then(function (cache) {
        return cache.match(req, { ignoreSearch: true }).then(function (cached) {
          var fresh = fetch(req).then(function (res) {
            if (res && res.ok) cache.put(req, res.clone());
            return res;
          }).catch(function () { return cached; });
          return cached || fresh;
        });
      })
    );
  } else {
    /* extern (fonts, hotelfoto's, kaart-tiles): cache wat eenmaal geladen is */
    e.respondWith(
      caches.open(CACHE + '-ext').then(function (cache) {
        return cache.match(req).then(function (cached) {
          if (cached) return cached;
          return fetch(req).then(function (res) {
            if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
            return res;
          }).catch(function () { return cached; });
        });
      })
    );
  }
});
