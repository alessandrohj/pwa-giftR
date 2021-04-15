//service worker for pwa4
//TODO: Add the code for all the events and make this work offline
const version = 1;
let staticName = `pre-v${version}`;
let dynamicName = `dynamic-v${version}`;
let cacheSize = 65;
let staticList = ["/", "/index.html", "/gifts.html", "/people.html", "/404.html", "/css/main.css", "/js/app.js", "/js/materialize.min.js", "/css/materialize.min.css", "https://fonts.googleapis.com/icon?family=Material+Icons", "https://fonts.gstatic.com/s/materialicons/v78/flUhRq6tzZclQEJ-Vdg-IuiaDsNcIhQ8tQ.woff2", "/img/icons/icon-72x72.png", "/img/icons/icon-96x96.png", "/img/icons/icon-128x128.png", "/img/icons/icon-144x144.png", "/img/icons/icon-192x192.png", "/img/icons/icon-384x384.png", "/img/icons/icon-512x512.png"];
let dynamicList = [];
let options = {
  ignoreSearch: false,
  ignoreMethod: false,
  ignoreVary: false,
};
self.addEventListener("install", (ev) => {
  //install event - browser has installed this version
  console.log("Service Worker has been installed", version, ev);
  //build cache
  ev.waitUntil(
    caches
      .open(staticName)
      .then((cache) => {
        return cache.addAll(staticList);
      })
      .then(
        () => {
          // return self.skipWaiting();
        },
        (err) => {
          console.warn(`${err} - failed to update ${staticName}.`);
        }
      )
  );
});

self.addEventListener("activate", (ev) => {
  //activate event - browser now using this version
  console.log("SW activated");
  // delete old versions of caches.
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
// self.addEventListener("fetch", (ev) => {
// ev.respondWith(
// caches.match(ev.request).then((cacheRes) => {
// return (
// cacheRes ||
// Promise.resolve()
// .then(() => {
// return fetch(ev.request.url).then((fetchResponse) => {
// if (fetchResponse.ok) {
// return handleFetchResponse(fetchResponse, ev.request);
// }
// });
// })
// .catch(() => {
// if (ev.request.url.indexOf(".html") > 0) {
// return caches.match("/404.html");
// }
// if (ev.request.url.indexOf(".jpg") || ev.request.url.indexOf(".png") > 0) {
// return caches.match("/img/default_img.jpg");
// }
// })
// );
// })
// );
// });

self.addEventListener("fetch", (ev) => {
  //fetch event - web page is asking for an asset
  ev.respondWith(
    caches
      .match(ev.request)
      .then((response) => {
        return (
          response ||
          fetch(ev.request).then((fetchedResponse) => {
            return caches.open(dynamicName).then((cache) => {
              cache.put(ev.request.url, fetchedResponse.clone());
              limitCacheSize(dynamicName, cacheSize);
              return fetchedResponse;
            });
          })
        );
      })
      .catch((err) => {
        console.log(err);
      })
  );
});

const handleFetchResponse = (fetchResponse, request) => {
  let type = fetchResponse.headers.get("content-type");
  if ((type && type.match(/^image\//i)) || (type && type.match(/^text\/html/i))) {
    return caches.open(dynamicName).then((cache) => {
      cache.put(request, fetchResponse.clone());
      limitCacheSize(dynamicName, dynamicCacheSize);
      return fetchResponse;
    });
  } else {
    return fetchResponse;
  }
};

self.addEventListener("message", ({ data }) => {
  //message received from a web page that uses this sw
  console.log("Message received from page", data);
});

const sendMessage = async (msg) => {
  //send a message from the service worker to the webpage(s)
  let allClients = await clients.matchAll({ includeUncontrolled: true });
  return Promise.all(
    allClients.map((client) => {
      let channel = new MessageChannel();
      channel.port1.onmessage = onMessage;
      //port1 for send port2 for receive
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
