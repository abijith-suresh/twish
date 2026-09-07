/// <reference lib="webworker" />

import { setCacheNameDetails } from "workbox-core";
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";

declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<string | { revision: string | null; url: string }>;
};

setCacheNameDetails({ prefix: "unwrapped" });
cleanupOutdatedCaches();

precacheAndRoute(self.__WB_MANIFEST, {
  cleanURLs: true,
  directoryIndex: "index.html",
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    void self.skipWaiting();
  }
});
