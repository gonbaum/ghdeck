import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "ink-testing-library";
import Hint from "../../components/Hint";

describe("Hint", () => {
  it("renders the key symbol for 'enter'", () => {
    const { lastFrame } = render(<Hint keys="enter" action="confirm" />);
    expect(lastFrame()).toContain("↵");
  });

  it("renders the key symbol for 'esc'", () => {
    const { lastFrame } = render(<Hint keys="esc" action="cancel" />);
    expect(lastFrame()).toContain("⎋");
  });

  it("renders the key symbol for 'backspace'", () => {
    const { lastFrame } = render(<Hint keys="backspace" action="delete" />);
    expect(lastFrame()).toContain("⌫");
  });

  it("renders the key symbol for 'space'", () => {
    const { lastFrame } = render(<Hint keys="space" action="select" />);
    expect(lastFrame()).toContain("␣");
  });

  it("renders the raw key when no symbol mapping exists", () => {
    const { lastFrame } = render(<Hint keys="q" action="quit" />);
    expect(lastFrame()).toContain("q");
    expect(lastFrame()).toContain("quit");
  });

  it("renders the action label", () => {
    const { lastFrame } = render(<Hint keys="enter" action="open repo" />);
    expect(lastFrame()).toContain("open repo");
  });
});
