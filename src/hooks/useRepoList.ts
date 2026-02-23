import { useState, useEffect } from "react";
import { Repo } from "../types";
import { listRepos, deleteRepo, renameRepo, toggleVisibility, createRepo } from "../services/github";
import { useNotification } from "./useNotification";

export function useRepoList() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deleted, setDeleted] = useState<string[]>([]);
  const [notification, showNotification] = useNotification();

  useEffect(() => {
    listRepos()
      .then((data) => { setRepos(data); setLoading(false); })
      .catch((e: any) => { setLoading(false); showNotification(`✗ ${e.message}`); });
  }, []);

  async function handleDelete(selectedIndices: Set<number>): Promise<void> {
    const toDelete = repos.filter((_, i) => selectedIndices.has(i));
    const names: string[] = [];
    for (const repo of toDelete) {
      try {
        await deleteRepo(repo.name);
        names.push(repo.name);
      } catch {
        showNotification(`✗ Failed: ${repo.name}`);
      }
    }
    if (names.length) setDeleted((d) => [...d, ...names]);
    setRepos((prev) => prev.filter((_, i) => !selectedIndices.has(i)));
  }

  async function handleRename(cursor: number, newName: string): Promise<boolean> {
    const repo = repos[cursor];
    if (!repo || !newName.trim() || newName === repo.name || updating) return false;
    setUpdating(true);
    try {
      const data = await renameRepo(repo.name, newName.trim());
      setRepos((prev) =>
        prev.map((r, i) =>
          i === cursor
            ? { ...r, name: data.name, full_name: data.full_name, html_url: data.html_url,
                clone_url: data.clone_url ?? r.clone_url, ssh_url: data.ssh_url ?? r.ssh_url }
            : r
        )
      );
      showNotification(`✓ Renamed → ${data.name}`);
      return true;
    } catch {
      showNotification(`✗ Rename failed`);
      return false;
    } finally {
      setUpdating(false);
    }
  }

  async function handleToggleVisibility(cursor: number): Promise<void> {
    const repo = repos[cursor];
    if (!repo || updating) return;
    setUpdating(true);
    try {
      const data = await toggleVisibility(repo.name, !repo.private);
      setRepos((prev) =>
        prev.map((r, i) => (i === cursor ? { ...r, private: data.private } : r))
      );
      showNotification(`✓ Now ${data.private ? "private" : "public"}`);
    } catch (e: any) {
      showNotification(`✗ ${e.message ?? "Toggle failed"}`);
    } finally {
      setUpdating(false);
    }
  }

  async function handleCreate(name: string, onSuccess: () => void): Promise<void> {
    if (!name.trim() || updating) return;
    setUpdating(true);
    try {
      const data = await createRepo(name.trim());
      setRepos((prev) => [data, ...prev]);
      onSuccess();
      showNotification(`✓ Created ${data.name}`);
    } catch (e: any) {
      showNotification(`✗ ${e.message ?? "Create failed"}`);
    } finally {
      setUpdating(false);
    }
  }

  return {
    repos,
    loading,
    updating,
    deleted,
    notification,
    showNotification,
    handleDelete,
    handleRename,
    handleToggleVisibility,
    handleCreate,
  };
}
