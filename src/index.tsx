import "dotenv/config";
import React from "react";
import { render } from "ink";
import { App } from "./App";

// ── Synchronized-output patch ─────────────────────────────────────────────────
// Ink rewrites every output line on each render. The terminal processes those
// escape sequences one by one, producing a brief "partial frame" window — the
// visible jitter. Fix: collect all stdout.write() calls that happen within the
// same JS event-loop tick into one buffer, then flush it wrapped in a
// CSI ?2026 (Begin/End Synchronized Update) pair. The terminal applies the
// whole frame atomically. Terminals that don't support ?2026 ignore the
// sequences harmlessly (no change in behaviour for them).
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
