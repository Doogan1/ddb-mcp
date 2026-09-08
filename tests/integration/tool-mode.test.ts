import { describe, it, expect, afterEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createMcpServer } from "../../src/server.js";
import type { ToolMode } from "../../src/config/tool-mode.js";

async function listToolNames(mode: ToolMode): Promise<string[]> {
  const { server } = createMcpServer({ mode });
  const [serverTransport, clientTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test-client", version: "1.0.0" }, { capabilities: {} });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  const response = await client.listTools();
  await client.close();
  await server.close();
  return response.tools.map((tool) => tool.name);
}

describe("createMcpServer tool modes", () => {
  afterEach(() => {
    delete process.env.DDB_MCP_MODE;
  });

  it("registers only read tools by default", async () => {
    const names = await listToolNames("read");
    expect(names).toContain("check_auth");
    expect(names).toContain("get_character");
    expect(names).toContain("search_spells");
    expect(names).not.toContain("setup_auth");
    expect(names).not.toContain("update_hp");
    expect(names).not.toContain("delete_character");
  });

  it("adds session writes in session mode", async () => {
    const names = await listToolNames("session");
    expect(names).toContain("update_hp");
    expect(names).toContain("long_rest");
    expect(names).not.toContain("delete_character");
    expect(names).not.toContain("create_character");
  });

  it("adds builder tools including delete in builder mode", async () => {
    const names = await listToolNames("builder");
    expect(names).toContain("update_hp");
    expect(names).toContain("create_character");
    expect(names).toContain("delete_character");
  });
});
