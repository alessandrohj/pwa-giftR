//service worker for pwa4
//TODO: Add the code for all the events and make this work offline
const version = 1;
let staticName = `pre-v${version}`;
let dynamicName = `dynamic-v${version}`;
let cacheSize = 65;
let staticList = [
  '/',
  './index.html',
  './gifts.html',
  './people.html',
  './css/main.css',
  './css/materialize.min.css',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://fonts.gstatic.com/s/materialicons/v78/flUhRq6tzZclQEJ-Vdg-IuiaDsNcIhQ8tQ.woff2',
];
let dynamicList = [];

self.addEventListener('install', (ev) => {
  //install event - browser has installed this version
  console.log('Service Worker has been installed', version, ev);
  //build cache
  ev.waitUntil(
    caches.open(staticName)
    .then((cache)=>{
      return cache.addAll(staticList)
    })
    .then(()=>{
      return self.skipWaiting();
    },
    (err) => {
      console.warn(`${err} - failed to update ${staticName}.`)
    }
    )
  )
});

self.addEventListener('activate', (ev) => {
  //activate event - browser now using this version
  console.log('SW activated');
// delete old versions of caches.
  ev.waitUntil(
    caches.keys()
    .then(keys =>{
      return Promise.all(
        keys.filter(cacheName =>{
          if(cacheName != staticName && cacheName !=  dynamicName){
            return true;
          }
        }).map(cacheName =>{
          return caches.delete(cacheName)
        })
        ).then((empties) => {
          console.log('Deleted successfully:', empties);
        })
      }
    ))
});

self.addEventListener('fetch', (ev) => {
  //fetch event - web page is asking for an asset
  ev.respondWith(
    caches.match(ev.request)
    .then(response=>{
      return response || fetch(ev.request).then(fetchedResponse =>{
        return caches.open(dynamicName)
        .then(cache=>{
          cache.put(ev.request.url, fetchedResponse.clone());
          limitCacheSize(dynamicName, cacheSize);
          return fetchedResponse;
        })
      })
    })
    .catch((err)=>{
      console.log(err);
    })
  )
});

self.addEventListener('message', ({ data }) => {
  //message received from a web page that uses this sw
  console.log('Message received from page', data);
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

const limitCacheSize = (cacheName, size) =>{
  caches.open(cacheName)
  .then(cache=>{
    cache.keys()
    .then(keys=>{
      if(keys.length > size){
        cache.delete(keys[0])
        .then(limitCacheSize(cacheName, size))
      }
    })
  })
}