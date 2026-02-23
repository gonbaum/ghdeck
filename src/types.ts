export type Repo = {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  stargazers_count: number;
  pushed_at: string | null;
  description: string | null;
  language: string | null;
  html_url: string;
  clone_url: string;
  ssh_url: string;
};

export type Screen = "list" | "detail" | "confirm" | "rename" | "clone" | "create";

export type MdNode = {
  type: string;
  children?: MdNode[];
  value?: string;
  depth?: number;
  url?: string;
  ordered?: boolean;
  lang?: string;
};
