const CACHE_NAME = "network-cache-v1";
const OFFLINE_URL = "index_offline.html";
const ONLINE_URL = "index.html";
const ASSETS = ["index_offline.html", "index.html", "style.css", "app.js"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Caching essential assets");
      return cache.addAll(ASSETS);
    })
  );
  console.log("Service Worker installed and assets cached.");
});

self.addEventListener("activate", (event) => {
  console.log("**************************************");
  console.log("**   Activating new service worker... **");
  console.log("**************************************");
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    (async () => {
      try {
        const networkResponse = await fetch(event.request);
        return networkResponse;
      } catch (error) {
        console.error("Fetch failed; serving cached asset:", error);
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(event.request);
        return cachedResponse || cache.match(OFFLINE_URL);
      }
    })()
  );
});

self.addEventListener("sync", (event) => {
  if (event.tag === "sync-texts") {
    event.waitUntil(syncTexts());
  } else {
    console.warn("Unrecognized sync tag:", event.tag);
  }
});
async function syncTexts() {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction("notes", "readonly");
    const store = transaction.objectStore("notes");
    const unsyncedTexts = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (unsyncedTexts) {
      const response = await fetch(
        "https://sestilabos-s1ym.onrender.com/api/save-texts",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(unsyncedTexts),
        }
      );

      if (response.ok) {
        self.registration.showNotification("Sync completed!", {
          body: "Data synced.",
        });
      } else {
        console.error("Server returned an error:", response.status);
      }
    } else {
      console.log("No texts to sync");
    }
  } catch (error) {
    console.error("Error in syncTexts:", error);
  }
}

function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("NotesDatabase", 1);
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}
