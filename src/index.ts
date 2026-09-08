#!/usr/bin/env node
import { startServer } from "./server.js";

startServer().catch((error) => {
  console.error("ddb-mcp: fatal error:", error);
  process.exit(1);
});
