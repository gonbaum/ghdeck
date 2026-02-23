import { Octokit } from "@octokit/rest";
import { Repo } from "../types";

const GITHUB_USERNAME = process.env.GITHUB_USER ?? "";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? "";

const octokit = new Octokit({ auth: GITHUB_TOKEN });

export { GITHUB_USERNAME, GITHUB_TOKEN };

export async function listRepos(): Promise<Repo[]> {
  const data = await octokit.paginate(octokit.repos.listForUser, {
    username: GITHUB_USERNAME,
    per_page: 100,
    sort: "pushed",
  });
  return data as Repo[];
}

export async function getReadme(repoName: string): Promise<string> {
  const { data } = await octokit.repos.getReadme({
    owner: GITHUB_USERNAME,
    repo: repoName,
  });
  return Buffer.from(data.content, "base64").toString("utf-8");
}

export async function deleteRepo(repoName: string): Promise<void> {
  await octokit.repos.delete({ owner: GITHUB_USERNAME, repo: repoName });
}

export async function renameRepo(repoName: string, newName: string): Promise<Repo> {
  const { data } = await octokit.repos.update({
    owner: GITHUB_USERNAME,
    repo: repoName,
    name: newName,
  });
  return data as Repo;
}

export async function toggleVisibility(repoName: string, makePrivate: boolean): Promise<Repo> {
  const { data } = await octokit.repos.update({
    owner: GITHUB_USERNAME,
    repo: repoName,
    private: makePrivate,
  });
  return data as Repo;
}

export async function createRepo(name: string): Promise<Repo> {
  const { data } = await octokit.repos.createForAuthenticatedUser({ name });
  return data as Repo;
}
