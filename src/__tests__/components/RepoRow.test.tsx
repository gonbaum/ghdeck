import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "ink-testing-library";
import RepoRow from "../../components/RepoRow";
import type { Repo } from "../../types";

const baseRepo: Repo = {
  id: 1,
  name: "my-project",
  full_name: "user/my-project",
  private: false,
  stargazers_count: 10,
  pushed_at: "2024-01-15T08:00:00Z",
  description: "A test repo",
  language: "TypeScript",
  html_url: "https://github.com/user/my-project",
  clone_url: "https://github.com/user/my-project.git",
  ssh_url: "git@github.com:user/my-project.git",
};

describe("RepoRow", () => {
  it("renders repo name", () => {
    const { lastFrame } = render(
      <RepoRow repo={baseRepo} isCursor={false} isSelected={false} />,
    );
    expect(lastFrame()).toContain("my-project");
  });

  it("compact mode shows privacy badge without label text", () => {
    const { lastFrame } = render(
      <RepoRow repo={baseRepo} isCursor={false} isSelected={false} compact />,
    );
    expect(lastFrame()).toContain("◉"); // public badge
    expect(lastFrame()).not.toContain("pub");
  });

  it("full mode shows privacy badge with label text", () => {
    const { lastFrame } = render(
      <RepoRow repo={baseRepo} isCursor={false} isSelected={false} />,
    );
    expect(lastFrame()).toContain("◉ pub");
  });

  it("private repo shows private badge", () => {
    const privateRepo = { ...baseRepo, private: true };
    const { lastFrame } = render(
      <RepoRow repo={privateRepo} isCursor={false} isSelected={false} />,
    );
    expect(lastFrame()).toContain("⊘");
  });

  it("selected repo shows selection indicator", () => {
    const { lastFrame } = render(
      <RepoRow repo={baseRepo} isCursor={false} isSelected />,
    );
    expect(lastFrame()).toContain("◆");
  });

  it("non-selected non-cursor row shows space for selection indicator", () => {
    const { lastFrame } = render(
      <RepoRow repo={baseRepo} isCursor={false} isSelected={false} />,
    );
    expect(lastFrame()).not.toContain("◆");
  });

  it("full mode shows language", () => {
    const { lastFrame } = render(
      <RepoRow repo={baseRepo} isCursor={false} isSelected={false} />,
    );
    expect(lastFrame()).toContain("TypeScript");
  });

  it("compact mode does not show language", () => {
    const { lastFrame } = render(
      <RepoRow repo={baseRepo} isCursor={false} isSelected={false} compact />,
    );
    expect(lastFrame()).not.toContain("TypeScript");
  });
});
