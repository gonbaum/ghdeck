// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useNavigation } from "../../hooks/useNavigation";

describe("useNavigation", () => {
  it("starts with cursor=0 and scrollOffset=0", () => {
    const { result } = renderHook(() => useNavigation(10, 5));
    expect(result.current.cursor).toBe(0);
    expect(result.current.scrollOffset).toBe(0);
  });

  it("moveCursor(1) increments cursor", () => {
    const { result } = renderHook(() => useNavigation(10, 5));

    act(() => {
      result.current.moveCursor(1);
    });

    expect(result.current.cursor).toBe(1);
  });

  it("cursor does not go below 0", () => {
    const { result } = renderHook(() => useNavigation(10, 5));

    act(() => {
      result.current.moveCursor(-5);
    });

    expect(result.current.cursor).toBe(0);
  });

  it("cursor does not exceed reposLength - 1", () => {
    const { result } = renderHook(() => useNavigation(5, 5));

    act(() => {
      result.current.moveCursor(100);
    });

    expect(result.current.cursor).toBe(4);
  });

  it("scrollOffset adjusts when cursor moves past visible area", () => {
    const { result } = renderHook(() => useNavigation(10, 3));

    // Move cursor to index 3 (beyond visible range 0..2)
    act(() => {
      result.current.moveCursor(3);
    });

    expect(result.current.cursor).toBe(3);
    expect(result.current.scrollOffset).toBe(1); // 3 - 3 + 1 = 1
  });

  it("scrollOffset adjusts when cursor moves above scroll window", () => {
    const { result } = renderHook(() => useNavigation(10, 3));

    // First move down to set scrollOffset > 0
    act(() => {
      result.current.moveCursor(5);
    });
    expect(result.current.scrollOffset).toBe(3);

    // Now move back up beyond scrollOffset
    act(() => {
      result.current.moveCursor(-5);
    });

    expect(result.current.cursor).toBe(0);
    expect(result.current.scrollOffset).toBe(0);
  });

  it("resetNav resets cursor and scrollOffset to 0", () => {
    const { result } = renderHook(() => useNavigation(10, 3));

    act(() => {
      result.current.moveCursor(5);
    });

    act(() => {
      result.current.resetNav();
    });

    expect(result.current.cursor).toBe(0);
    expect(result.current.scrollOffset).toBe(0);
  });

  it("scrollOffset increases to keep cursor visible when visibleCount shrinks", () => {
    const { result, rerender } = renderHook(
      ({ len, vis }) => useNavigation(len, vis),
      { initialProps: { len: 10, vis: 5 } },
    );

    // Move cursor to 4 (last item in first viewport)
    act(() => {
      result.current.moveCursor(4);
    });
    expect(result.current.cursor).toBe(4);
    expect(result.current.scrollOffset).toBe(0);

    // Shrink visibleCount to 2: cursor=4 >= 0+2 → scrollOffset = 4-2+1 = 3
    rerender({ len: 10, vis: 2 });

    expect(result.current.scrollOffset).toBe(3);
  });

  it("scrollOffset stays stable when cursor remains within range after resize", () => {
    const { result, rerender } = renderHook(
      ({ len, vis }) => useNavigation(len, vis),
      { initialProps: { len: 10, vis: 3 } },
    );

    // Move cursor to 5 → scrollOffset = 3
    act(() => {
      result.current.moveCursor(5);
    });
    expect(result.current.cursor).toBe(5);
    expect(result.current.scrollOffset).toBe(3);

    // Increase visibleCount: cursor=5 is within [3, 12], no adjustment needed
    rerender({ len: 10, vis: 10 });

    expect(result.current.scrollOffset).toBe(3);
  });
});
