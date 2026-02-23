import { describe, it, expect, vi, beforeEach } from "vitest";

const mockExecSync = vi.hoisted(() => vi.fn());

vi.mock("child_process", () => ({
  execSync: mockExecSync,
}));

import { copyToClipboard } from "../../utils/clipboard";

describe("copyToClipboard", () => {
  beforeEach(() => {
    mockExecSync.mockClear();
  });

  it("uses pbcopy on darwin", () => {
    const orig = Object.getOwnPropertyDescriptor(process, "platform")!;
    Object.defineProperty(process, "platform", { value: "darwin", configurable: true });

    copyToClipboard("test text");

    expect(mockExecSync).toHaveBeenCalledWith("pbcopy", { input: "test text" });
    Object.defineProperty(process, "platform", orig);
  });

  it("uses clip on win32", () => {
    const orig = Object.getOwnPropertyDescriptor(process, "platform")!;
    Object.defineProperty(process, "platform", { value: "win32", configurable: true });

    copyToClipboard("test text");

    expect(mockExecSync).toHaveBeenCalledWith("clip", { input: "test text" });
    Object.defineProperty(process, "platform", orig);
  });

  it("uses xclip on linux", () => {
    const orig = Object.getOwnPropertyDescriptor(process, "platform")!;
    Object.defineProperty(process, "platform", { value: "linux", configurable: true });

    copyToClipboard("test text");

    expect(mockExecSync).toHaveBeenCalledWith("xclip -selection clipboard", { input: "test text" });
    Object.defineProperty(process, "platform", orig);
  });

  it("falls back to xsel when xclip fails on linux", () => {
    const orig = Object.getOwnPropertyDescriptor(process, "platform")!;
    Object.defineProperty(process, "platform", { value: "linux", configurable: true });

    mockExecSync.mockImplementationOnce(() => {
      throw new Error("xclip not found");
    });

    copyToClipboard("test text");

    expect(mockExecSync).toHaveBeenLastCalledWith("xsel --clipboard --input", { input: "test text" });
    Object.defineProperty(process, "platform", orig);
  });
});
