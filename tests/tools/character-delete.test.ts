import { describe, it, expect, vi } from "vitest";
import { deleteCharacter } from "../../src/tools/character.js";
import type { DdbClient } from "../../src/api/client.js";

function mockClient(overrides: Partial<DdbClient> = {}): DdbClient {
  return {
    get: vi.fn(),
    delete: vi.fn(),
    ...overrides,
  } as unknown as DdbClient;
}

describe("deleteCharacter", () => {
  it("does not call the API without confirm=true", async () => {
    const client = mockClient();
    const result = await deleteCharacter(client, {
      characterId: 123,
      characterName: "Test Character",
      confirm: false,
    });

    expect(client.delete).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain("Deletion aborted");
  });

  it("does not call the API when the name does not match", async () => {
    const client = mockClient({
      get: vi.fn().mockResolvedValue({ name: "Test Character" }),
    });

    const result = await deleteCharacter(client, {
      characterId: 123,
      characterName: "Someone Else",
      confirm: true,
    });

    expect(client.delete).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain("does not match");
  });

  it("deletes when confirm is true and the name matches", async () => {
    const client = mockClient({
      get: vi.fn().mockResolvedValue({ name: "Test Character" }),
      delete: vi.fn().mockResolvedValue(undefined),
    });

    const result = await deleteCharacter(client, {
      characterId: 123,
      characterName: "test character",
      confirm: true,
    });

    expect(client.delete).toHaveBeenCalledOnce();
    expect(result.content[0].text).toContain("Deleted character Test Character");
  });
});
