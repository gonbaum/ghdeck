import React from "react";
import { Text } from "ink";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import { MdNode } from "../types";
import { wrapText } from "./formatting";

export const mdParser = unified().use(remarkParse).use(remarkGfm);

export function collectText(node: MdNode): string {
  if (node.type === "html") return "";
  if (node.value) return node.value;
  return (node.children ?? []).map(collectText).join("");
}

export function stripMarkdown(md: string): string {
  return (
    md
      .replace(/```[^\n]*\n([\s\S]*?)```/g, (_, code) => code.trim())
      .replace(/`([^`]+)`/g, "$1")
      .replace(/!\[.*?\]\(.*?\)/g, "")
      .replace(/\[(.*?)\]\(.*?\)/g, "$1")
      .replace(/<\/?[^>]+(>|$)/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/^\|.*\|$/gm, "")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]+$/gm, "")
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .trim()
  );
}

export function flattenMdNode(node: MdNode, width: number, lines: React.ReactNode[], indent: number): void {
  switch (node.type) {
    case "root":
      for (const child of node.children ?? []) {
        flattenMdNode(child, width, lines, indent);
      }
      break;
    case "heading": {
      const color = node.depth === 1 ? "cyan" : node.depth === 2 ? "magenta" : undefined;
      const text = collectText(node);
      lines.push(<Text bold color={color} wrap="truncate">{text}</Text>);
      lines.push(<Text> </Text>);
      break;
    }
    case "paragraph": {
      const text = collectText(node);
      const maxW = width - indent;
      const wrapped = wrapText(text, maxW);
      for (const wl of wrapped) {
        lines.push(<Text wrap="truncate">{wl}</Text>);
      }
      lines.push(<Text> </Text>);
      break;
    }
    case "list":
      for (const child of node.children ?? []) {
        flattenMdNode(child, width, lines, indent);
      }
      lines.push(<Text> </Text>);
      break;
    case "listItem":
      for (let ci = 0; ci < (node.children ?? []).length; ci++) {
        const child = node.children![ci];
        if (child.type === "paragraph") {
          const text = collectText(child);
          const maxW = width - indent - 2;
          const wrapped = wrapText(text, maxW);
          for (let wi = 0; wi < wrapped.length; wi++) {
            const prefix = wi === 0 ? "• " : "  ";
            lines.push(<Text wrap="truncate">{prefix}{wrapped[wi]}</Text>);
          }
        } else {
          flattenMdNode(child, width, lines, indent + 2);
        }
      }
      break;
    case "blockquote":
      for (const child of node.children ?? []) {
        if (child.type === "paragraph") {
          const text = collectText(child);
          const maxW = width - indent - 2;
          const wrapped = wrapText(text, maxW);
          for (const wl of wrapped) {
            lines.push(<Text dimColor wrap="truncate">│ {wl}</Text>);
          }
        } else {
          flattenMdNode(child, width, lines, indent + 2);
        }
      }
      lines.push(<Text> </Text>);
      break;
    case "code": {
      const codeLines = (node.value ?? "").split("\n");
      for (const cl of codeLines) {
        lines.push(<Text color="yellow" wrap="truncate">{cl}</Text>);
      }
      lines.push(<Text> </Text>);
      break;
    }
    case "thematicBreak":
      lines.push(<Text dimColor>{"─".repeat(Math.min(width, 40))}</Text>);
      lines.push(<Text> </Text>);
      break;
    case "table":
      for (const row of node.children ?? []) {
        const cells = (row.children ?? []).map((cell) => collectText(cell));
        lines.push(<Text wrap="truncate">{cells.join(" │ ")}</Text>);
      }
      lines.push(<Text> </Text>);
      break;
    case "html":
      break;
    default:
      if (node.children) {
        for (const child of node.children) {
          flattenMdNode(child, width, lines, indent);
        }
      } else if (node.value) {
        lines.push(<Text wrap="truncate">{node.value}</Text>);
      }
      break;
  }
}
