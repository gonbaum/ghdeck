import "dotenv/config";
import React from "react";
import { render } from "ink";
import { App } from "./App";

// Buffer all stdout.write() calls within the same tick into one CSI ?2026
// (Synchronized Update) frame — eliminates Ink's per-line render jitter.
(function patchSyncOutput() {
  const _write = process.stdout.write.bind(process.stdout);
  let buf = "";
  let cbs: Array<() => void> = [];
  let pending = false;

  function flush() {
    pending = false;
    const out = buf;
    const callbacks = cbs;
    buf = "";
    cbs = [];
    if (out) _write("\x1b[?2026h" + out + "\x1b[?2026l");
    for (const cb of callbacks) cb();
  }

  process.stdout.write = function (data: any, enc?: any, cb?: any): boolean {
    if (typeof enc === "function") { cb = enc; }
    buf += typeof data === "string" ? data : (data as Buffer).toString("utf8");
    if (cb) cbs.push(cb);
    if (!pending) { pending = true; setImmediate(flush); }
    return true;
  } as typeof process.stdout.write;
})();

render(<App />);
