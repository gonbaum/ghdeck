import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  paginate: vi.fn(),
  getReadme: vi.fn(),
  reposDelete: vi.fn(),
  update: vi.fn(),
  createForAuthenticatedUser: vi.fn(),
}));

vi.mock("@octokit/rest", () => ({
  Octokit: class MockOctokit {
    paginate = mocks.paginate;
    repos = {
      listForUser: {},
      getReadme: mocks.getReadme,
      delete: mocks.reposDelete,
      update: mocks.update,
      createForAuthenticatedUser: mocks.createForAuthenticatedUser,
    };
  },
}));

import { listRepos, getReadme, deleteRepo, renameRepo, toggleVisibility, createRepo } from "../../services/github";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("listRepos", () => {
  it("calls paginate with per_page=100 and sort=pushed", async () => {
    mocks.paginate.mockResolvedValueOnce([]);

    await listRepos();

    expect(mocks.paginate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ per_page: 100, sort: "pushed" }),
    );
  });

  it("returns the paginated data", async () => {
    const fakeRepos = [{ id: 1, name: "repo1" }];
    mocks.paginate.mockResolvedValueOnce(fakeRepos);

    const result = await listRepos();

    expect(result).toEqual(fakeRepos);
  });
});

describe("getReadme", () => {
  it("decodes base64 content", async () => {
    const rawContent = "# Hello World\n";
    const b64 = Buffer.from(rawContent).toString("base64");
    mocks.getReadme.mockResolvedValueOnce({ data: { content: b64 } });

    const result = await getReadme("my-repo");

    expect(result).toBe(rawContent);
  });

  it("calls getReadme with correct repo name", async () => {
    mocks.getReadme.mockResolvedValueOnce({ data: { content: "" } });

    await getReadme("some-repo");

    expect(mocks.getReadme).toHaveBeenCalledWith(
      expect.objectContaining({ repo: "some-repo" }),
    );
  });
});

describe("deleteRepo", () => {
  it("calls repos.delete with the repo name", async () => {
    mocks.reposDelete.mockResolvedValueOnce({});

    await deleteRepo("my-repo");

    expect(mocks.reposDelete).toHaveBeenCalledWith(
      expect.objectContaining({ repo: "my-repo" }),
    );
  });
});

describe("renameRepo", () => {
  it("calls repos.update with new name and returns updated repo", async () => {
    const fakeRepo = { id: 1, name: "new-name" };
    mocks.update.mockResolvedValueOnce({ data: fakeRepo });

    const result = await renameRepo("old-name", "new-name");

    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({ repo: "old-name", name: "new-name" }),
    );
    expect(result).toEqual(fakeRepo);
  });
});

describe("toggleVisibility", () => {
  it("calls repos.update with private=true when making private", async () => {
    const fakeRepo = { id: 1, name: "repo", private: true };
    mocks.update.mockResolvedValueOnce({ data: fakeRepo });

    await toggleVisibility("repo", true);

    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({ repo: "repo", private: true }),
    );
  });

  it("calls repos.update with private=false when making public", async () => {
    const fakeRepo = { id: 1, name: "repo", private: false };
    mocks.update.mockResolvedValueOnce({ data: fakeRepo });

    await toggleVisibility("repo", false);

    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({ repo: "repo", private: false }),
    );
  });
});

describe("createRepo", () => {
  it("calls createForAuthenticatedUser with name and returns created repo", async () => {
    const fakeRepo = { id: 1, name: "new-repo" };
    mocks.createForAuthenticatedUser.mockResolvedValueOnce({ data: fakeRepo });

    const result = await createRepo("new-repo");

    expect(mocks.createForAuthenticatedUser).toHaveBeenCalledWith({ name: "new-repo" });
    expect(result).toEqual(fakeRepo);
  });
});
