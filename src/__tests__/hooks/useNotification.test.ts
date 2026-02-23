// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useNotification } from "../../hooks/useNotification";

afterEach(() => {
  vi.useRealTimers();
});

describe("useNotification", () => {
  it("starts with null notification", () => {
    const { result } = renderHook(() => useNotification());
    expect(result.current[0]).toBeNull();
  });

  it("sets notification message after showNotification", () => {
    const { result } = renderHook(() => useNotification());
    const [, showNotification] = result.current;

    act(() => {
      showNotification("hello");
    });

    expect(result.current[0]).toBe("hello");
  });

  it("clears notification after 2500ms", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useNotification());

    act(() => {
      result.current[1]("hello");
    });

    expect(result.current[0]).toBe("hello");

    act(() => {
      vi.advanceTimersByTime(2500);
    });

    expect(result.current[0]).toBeNull();
  });

  it("does not clear before 2500ms", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useNotification());

    act(() => {
      result.current[1]("hello");
    });

    act(() => {
      vi.advanceTimersByTime(2499);
    });

    expect(result.current[0]).toBe("hello");
  });
});
