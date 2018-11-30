
var cache_names = {
  app_shell: "app-shell-cache"
}

//list of files to be cached for the app to work offline
var app_shell_pages = [
  "/",
  "/index.html",
  "js/index.js",
  "node_modules/bootstrap/dist/css/bootstrap.min.css",
  "css/index.css",
  "/manifest.json",
  "node_modules/jquery/dist/jquery.min.js",
  "js/popper.min.js",
  "node_modules/bootstrap/dist/js/bootstrap.min.js",
  "node_modules/moment/min/moment.min.js",
  "node_modules/moment/locale/it.js"
]

//Install stage sets up the offline pages in the cache
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches
      .open(cache_names.app_shell)
      .then(function (cache) {
        //after have opened the cache it cache all the files needed
        console.log('Opened cache');
        //this call to cache.addAll is here because it is not required for the install status to succeed
        cache.addAll([
          "res/cal-30.png",
          "res/cal-100.png",
          "res/cal-192.png",
          "res/cal-512.png",
          "res/cal-1024.png"
        ]);
        //this call otherwise is required, because it will cache the app shell
        //this promise will be passed to the event.waitUntil and if it will be rejected the install will fail 
        return cache.addAll(app_shell_pages)
          .then(function () {
            console.log('shell files cached and service worker installed');
          }, function (err) {
            console.log('shell files not cached, so service worker is not installed\n' + err);
          });
      })
  );
});

//here should be added the logic to manage the cache
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (cacheNames) {
        return Promise.all(
          cacheNames.map(function (cacheName) {
            if (cacheName !== cache_names.app_shell) {
              return caches.delete(cacheName);
            }
          })
        );
      })
  );
});

//this implementation will return first from the cache and if a file is not found
//it will fetch the data from the internet, cache it and return to the client
//a problem with this implementation is that it won't update the files in the cache
//because it never fetch from internet if it can found the request in cache
//If any fetch fails, it will show the offline page.
/* self.addEventListener('fetch', function (event) {
  event.respondWith(
    caches.match(event.request)
      .then(function (response) {
        if (response) {
          return response;
        }
        var fetchRequest = event.request.clone();
        return fetch(fetchRequest)
          .then(function (response) {
            if (!response || response.status !== 200 || response.type !== 'basic' || response.headers.get('Content-Type') === 'application/json') {
              return response;
            }
            var responseToCache = response.clone();
            caches
              .open(cache_names.app_shell)
              .then(function (cache) {
                cache.put(event.request, responseToCache);
              });
            return response;
          }, function (err) {
            console.log('Failed to fetch data: ' + err);
            return new Response();
          });
      })
  )
}); */

//this implementation will return the data from the cache but it would update the cache for the 
//next request
self.addEventListener('fetch', function (event) {
  event.respondWith(
    caches
      .open(cache_names.app_shell)
      .then(function (cache) {
        //open the cache and search for a cache that match that request
        return cache
          .match(event.request)
          .then(function (response) {
            // if the cache is found it will start a fetch for that request and return the cache
            /* var fetchPromise = fetch(event.request)
              .then(function (netResp) {
                //if the fetch fullfill the response will be saved in the cache and returned to the
                if (!netResp || netResp.status !== 200 || netResp.type !== 'basic' || netResp.headers.get('Content-Type') === 'application/json') {
                  return netResp;
                }
                cache.put(event.request, netResp.clone());
                return netResp;
              })
            return response || fetchPromise; */
            var fetchPromise = fetchWithCache();
            return response || fetchPromise;
          })
          .catch(function (err) {
            //problem? if the data is not already cached the request will never be fullfilled 
            console.log('resource not found either in cache nor online.\n' + err);
            return fetchWithCache();
          })
      })
  );
})

function fetchWithCache(request) {
  return fetch(request)
    .then(function (netResp) {
      //if the fetch fullfill the response will be saved in the cache and returned to the
      if (!netResp || netResp.status !== 200 || netResp.type !== 'basic' || netResp.headers.get('Content-Type') === 'application/json') {
        return netResp;
      }
      cache.put(request, netResp.clone());
      return netResp;
    })
}