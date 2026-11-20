"use client";

import { useEffect } from "react";

/**
 * Registra el Service Worker en producción para capacidades PWA y caché offline.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          registration.addEventListener("updatefound", () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.addEventListener("statechange", () => {
                if (
                  installingWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  // Nueva versión disponible
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error("Error al registrar Service Worker de PWA:", error);
        });
    }
  }, []);

  return null;
}
