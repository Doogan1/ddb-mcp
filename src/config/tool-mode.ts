export const TOOL_MODES = ["read", "session", "builder"] as const;

export type ToolMode = (typeof TOOL_MODES)[number];

const MODE_RANK: Record<ToolMode, number> = {
  read: 0,
  session: 1,
  builder: 2,
};

/**
 * Parse DDB_MCP_MODE. Unknown values fall back to read-only.
 */
export function parseToolMode(raw: string | undefined): ToolMode {
  const value = raw?.trim().toLowerCase();
  if (value === "session" || value === "builder" || value === "read") {
    return value;
  }
  return "read";
}

export function modeAllows(mode: ToolMode, required: ToolMode): boolean {
  return MODE_RANK[mode] >= MODE_RANK[required];
}
