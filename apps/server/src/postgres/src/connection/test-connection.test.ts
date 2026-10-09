

/**
 * Test con Vitest. 
 * Mockeamos el pool para no depender de tener Postgres corriendo mientras hacés `pnpm test`
 */

import { describe, it, expect, vi } from "vitest";

vi.mock("./pool.js", () => ({
  readOnlyPool: {
    query: vi.fn().mockResolvedValue({ 
      rows: [{ version: "PostgreSQL 16.0 on x86_64-pc-linux-gnu" }] 
    }),
  },
}));

import { testConnection } from "./test-connection.js";

describe("testConnection", () => {
  it("devuelve la versión de PostgreSQL", async () => {
    const version = await testConnection();
    expect(version).toBe("PostgreSQL 16.0 on x86_64-pc-linux-gnu");
  });
});