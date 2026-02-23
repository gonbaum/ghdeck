import { useState, useEffect, useRef } from "react";
import { Repo, Screen } from "../types";
import { getReadme } from "../services/github";

const DEBOUNCE_MS = 200;

export function useReadme(cursor: number, repos: Repo[], screen: Screen) {
  const [readme, setReadme] = useState<string | null>(null);
  const [readmeLoading, setReadmeLoading] = useState(false);
  const [readmeScroll, setReadmeScroll] = useState(0);

  const cache = useRef<Map<number, string>>(new Map());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset scroll when cursor moves to a different repo
  useEffect(() => {
    setReadmeScroll(0);
  }, [cursor]);

  useEffect(() => {
    if (screen !== "list") return;
    const repo = repos[cursor];
    if (!repo) return;

    if (timer.current) clearTimeout(timer.current);

    if (cache.current.has(repo.id)) {
      setReadme(cache.current.get(repo.id)!);
      setReadmeLoading(false);
      return;
    }

    setReadmeLoading(true);
    setReadme(null);

    timer.current = setTimeout(async () => {
      try {
        const content = await getReadme(repo.name);
        cache.current.set(repo.id, content);
        setReadme(content);
      } catch {
        cache.current.set(repo.id, "");
        setReadme("");
      }
      setReadmeLoading(false);
    }, DEBOUNCE_MS);
  }, [cursor, repos, screen]);

  return { readme, readmeLoading, readmeScroll, setReadmeScroll };
}
