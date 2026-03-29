
// apps/web/components/pwa-register.tsx

"use client";

import { useEffect } from "react";

export default function PwaRegister() {
    useEffect(() => {
        if (!("serviceWorker" in navigator)) return;

        navigator.serviceWorker
            .register("/sw.js")
            .then(() => {
                console.log("Service Worker registered");
            })
            .catch((err) => {
                console.error("SW registration failed:", err);
            });
    }, []);

    return null;
}