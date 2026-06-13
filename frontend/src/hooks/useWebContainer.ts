import { useEffect, useState } from "react";
import { WebContainer } from '@webcontainer/api';

// Module-level singleton: WebContainer is per-origin and persists for the
// page's lifetime. Booting twice (which happens in React 18 StrictMode and
// in dev re-mounts) causes the underlying worker to be torn down mid-flight,
// surfacing as "Proxy has been released" on the next call. Treat the
// instance as immutable once booted.
let webcontainerInstance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;

function getWebContainer(): Promise<WebContainer> {
  if (webcontainerInstance) return Promise.resolve(webcontainerInstance);
  if (!bootPromise) {
    bootPromise = WebContainer.boot({ coep: 'require-corp' }).then((instance) => {
      webcontainerInstance = instance;
      return instance;
    });
  }
  return bootPromise;
}

export function useWebContainer() {
  const [webcontainer, setWebcontainer] = useState<WebContainer | undefined>(webcontainerInstance ?? undefined);

  useEffect(() => {
    let cancelled = false;
    getWebContainer()
      .then((instance) => {
        if (!cancelled) {
          setWebcontainer(instance);
        }
      })
      .catch((err) => {
        console.error('Failed to boot WebContainer:', err);
      });
    return () => {
      cancelled = true;
      // Intentionally do NOT teardown. WebContainer is a per-origin singleton
      // and is reused across component remounts. The browser cleans it up on
      // page unload. Tearing down on cleanup breaks StrictMode double-mount
      // and any in-flight boot/mount operations.
    };
  }, []);

  return webcontainer;
}
