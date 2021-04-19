const version = 1;
let staticName = `pre-v${version}`;
let dynamicName = `dynamic-v${version}`;
let cacheSize = 65;
let staticList = ["/", "/index.html", "/pages/gifts.html", "/pages/register.html", "pages/forgotPwd.html", "/pages/people.html", "/pages/404.html", "/css/main.css", "/js/app.js", "/manifest.json", "/js/materialize.min.js", "/css/materialize.min.css", "https://fonts.googleapis.com/icon?family=Material+Icons", "https://fonts.gstatic.com/s/materialicons/v78/flUhRq6tzZclQEJ-Vdg-IuiaDsNcIhQ8tQ.woff2", "/img/offline.png", "/img/icons/icon-72x72.png", "/img/icons/icon-96x96.png", "/img/icons/icon-128x128.png", "/img/icons/icon-144x144.png", "/img/icons/icon-192x192.png", "/img/icons/icon-384x384.png", "/img/icons/icon-512x512.png"];
let dynamicList = [];
self.addEventListener("install", (ev) => {
  console.log("Service Worker has been installed", version, ev);
  ev.waitUntil(
    caches
      .open(staticName)
      .then((cache) => {
        return cache.addAll(staticList);
      })
      .then(
        () => {
          return self.skipWaiting();
        },
        (err) => {
          console.warn(`${err} - failed to update ${staticName}.`);
        }
      )
  );
});
self.addEventListener("activate", (ev) => {
  console.log("SW activated");
  ev.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((cacheName) => {
            if (cacheName != staticName && cacheName != dynamicName) {
              return true;
            }
          })
          .map((cacheName) => {
            return caches.delete(cacheName);
          })
      ).then((empties) => {
        console.log("Deleted successfully:", empties);
      });
    })
  );
});
self.addEventListener("fetch", (ev) => {
  ev.respondWith(
    fetch(ev.request)
      .then((fetchResponse) => {
        return caches.open(dynamicName).then((cache) => {
          if ((ev.request.method = "GET")) {
            cache.put(ev.request, fetchResponse.clone());
          }
          return fetchResponse;
        });
      })
      .catch(() => {
        return caches.match(ev.request).then((response) => {
          if (response === undefined) {
            return caches.match("/pages/404.html");
          }
          return response;
        });
      })
  );
});
self.addEventListener("message", ({ data }) => {
  console.log("Message received from page", data);
});
const sendMessage = async (msg) => {
  let allClients = await clients.matchAll({ includeUncontrolled: true });
  return Promise.all(
    allClients.map((client) => {
      let channel = new MessageChannel();
      channel.port1.onmessage = onMessage;
      return client.postMessage(msg, [channel.port2]);
    })
  );
};
const limitCacheSize = (cacheName, size) => {
  caches.open(cacheName).then((cache) => {
    cache.keys().then((keys) => {
      if (keys.length > size) {
        cache.delete(keys[0]).then(limitCacheSize(cacheName, size));
      }
    });
  });
};
