import Urbit from "@urbit/http-api";

// One stream per ship and browser origin keeps HTTP connections available for
// navigation. Tabs share invalidations only; article bodies never enter the bus.
export function updates(ship: string, refresh: () => void) {
  if (!navigator.locks || !globalThis.BroadcastChannel) return;
  const name = `domheap-updates:${ship}`;
  let stop: (() => void) | undefined;
  const start = () => {
    if (stop) return;
    const bus = new BroadcastChannel(name);
    const lifetime = new AbortController();
    let channel: Urbit | undefined;
    let release: (() => void) | undefined;
    bus.onmessage = () => refresh();
    stop = () => {
      lifetime.abort();
      // delete() sends a beacon; reset() also closes the local streaming fetch.
      channel?.reset();
      release?.();
      bus.close();
      stop = undefined;
    };
    void navigator.locks
      .request(name, { signal: lifetime.signal }, async () => {
        if (lifetime.signal.aborted) return;
        channel = new Urbit("", "", "domheap");
        // This module owns disposal, including restoration from the back cache.
        window.removeEventListener("beforeunload", channel.delete);
        channel.ship = ship.replace(/^~/, "");
        channel.onError = () => {};
        void channel
          .subscribe({
            app: "domheap",
            path: "/updates",
            event: () => {
              if (lifetime.signal.aborted) return;
              bus.postMessage(null);
              refresh();
            },
            err: () => {},
          })
          .catch(() => {});
        await new Promise<void>((resolve) => {
          release = resolve;
        });
      })
      .catch(() => {});
  };
  window.addEventListener("pagehide", () => stop?.());
  window.addEventListener("pageshow", start);
  start();
}
