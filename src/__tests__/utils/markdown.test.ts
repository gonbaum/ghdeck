import { describe, it, expect } from "vitest";
import { collectText, stripMarkdown, flattenMdNode } from "../../utils/markdown";
import type { MdNode } from "../../types";

describe("collectText", () => {
  it("returns value of a text node", () => {
    const node: MdNode = { type: "text", value: "hello" };
    expect(collectText(node)).toBe("hello");
  });

  it("returns empty string for html node", () => {
    const node: MdNode = { type: "html", value: "<br/>" };
    expect(collectText(node)).toBe("");
  });

  it("collects text from nested children", () => {
    const node: MdNode = {
      type: "paragraph",
      children: [
        { type: "text", value: "hello " },
        { type: "strong", children: [{ type: "text", value: "world" }] },
      ],
    };
    expect(collectText(node)).toBe("hello world");
  });

  it("returns empty string for node with no value or children", () => {
    const node: MdNode = { type: "thematicBreak" };
    expect(collectText(node)).toBe("");
  });
});

describe("stripMarkdown", () => {
  it("strips fenced code blocks but keeps content", () => {
    const md = "```js\nconsole.log('hi');\n```";
    expect(stripMarkdown(md)).toBe("console.log('hi');");
  });

  it("strips inline code backticks", () => {
    expect(stripMarkdown("Use `npm install`")).toBe("Use npm install");
  });

  it("strips images entirely", () => {
    expect(stripMarkdown("![alt text](http://example.com/img.png)")).toBe("");
  });

  it("strips links but keeps link text", () => {
    expect(stripMarkdown("[click here](http://example.com)")).toBe("click here");
  });

  it("strips HTML tags", () => {
    expect(stripMarkdown("<br/>text")).toBe("text");
  });

  it("replaces &nbsp; with a space", () => {
    expect(stripMarkdown("foo&nbsp;bar")).toBe("foo bar");
  });
});

describe("flattenMdNode", () => {
  it("heading node produces 2 lines (text + spacer)", () => {
    const node: MdNode = {
      type: "heading",
      depth: 1,
      children: [{ type: "text", value: "Hello" }],
    };
    const lines: unknown[] = [];
    flattenMdNode(node, 80, lines as React.ReactNode[], 0);
    expect(lines.length).toBe(2);
  });

  it("paragraph node produces wrapped lines + spacer", () => {
    const node: MdNode = {
      type: "paragraph",
      children: [{ type: "text", value: "short text" }],
    };
    const lines: unknown[] = [];
    flattenMdNode(node, 80, lines as React.ReactNode[], 0);
    expect(lines.length).toBe(2); // 1 line + spacer
  });

  it("code node produces one line per code line + spacer", () => {
    const node: MdNode = {
      type: "code",
      value: "line1\nline2",
    };
    const lines: unknown[] = [];
    flattenMdNode(node, 80, lines as React.ReactNode[], 0);
    expect(lines.length).toBe(3); // 2 code lines + spacer
  });

  it("root node recurses into all children", () => {
    const node: MdNode = {
      type: "root",
      children: [
        { type: "heading", depth: 1, children: [{ type: "text", value: "Title" }] },
        { type: "paragraph", children: [{ type: "text", value: "body text" }] },
      ],
    };
    const lines: unknown[] = [];
    flattenMdNode(node, 80, lines as React.ReactNode[], 0);
    expect(lines.length).toBe(4); // heading: 2 + paragraph: 2
  });

  it("list node adds spacer after all items", () => {
    const node: MdNode = {
      type: "list",
      children: [
        {
          type: "listItem",
          children: [{ type: "paragraph", children: [{ type: "text", value: "item" }] }],
        },
      ],
    };
    const lines: unknown[] = [];
    flattenMdNode(node, 80, lines as React.ReactNode[], 0);
    // listItem paragraph → 1 bullet line; list → +1 spacer
    expect(lines.length).toBe(2);
  });
});
