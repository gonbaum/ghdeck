import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "ink-testing-library";
import Logo from "../../components/Logo";

describe("Logo", () => {
  it("renders without crashing", () => {
    const { lastFrame } = render(<Logo />);
    expect(lastFrame()).toBeTruthy();
  });

  it("matches snapshot", () => {
    const { lastFrame } = render(<Logo />);
    expect(lastFrame()).toMatchSnapshot();
  });
});
