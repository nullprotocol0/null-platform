/**
 * Electron-specific LevelAdapter factory.
 *
 * Uses classic-level (LevelDB native bindings) for persistent storage
 * in the Electron main process.
 *
 * LevelAdapter is inlined here (not imported from @null/core/storage) because
 * the main process compiles to CJS and @null/core is ESM-only — attempting to
 * require('@null/core/storage') would throw ERR_PACKAGE_PATH_NOT_EXPORTED.
 */
import { ClassicLevel } from "classic-level";

// Minimal StorageAdapter interface (mirrors @null/core StorageAdapter)
export interface StorageAdapter {
  get(key: string): Promise<string | undefined>;
  put(key: string, value: string): Promise<void>;
  del(key: string): Promise<void>;
  list(prefix: string): Promise<Array<{ key: string; value: string }>>;
  close(): Promise<void>;
}

// Inlined LevelAdapter — avoids ESM-only @null/core/storage import in CJS main process
class LevelAdapter implements StorageAdapter {
  constructor(private readonly db: ClassicLevel<string, string>) {}

  async get(key: string): Promise<string | undefined> {
    try {
      return await this.db.get(key);
    } catch (err: unknown) {
      if (isNotFoundError(err)) return undefined;
      throw err;
    }
  }

  async put(key: string, value: string): Promise<void> {
    await this.db.put(key, value);
  }

  async del(key: string): Promise<void> {
    try {
      await this.db.del(key);
    } catch (err: unknown) {
      if (isNotFoundError(err)) return;
      throw err;
    }
  }

  async list(prefix: string): Promise<Array<{ key: string; value: string }>> {
    const results: Array<{ key: string; value: string }> = [];
    for await (const [key, value] of this.db.iterator({
      gte: prefix,
      lte: prefix + "\xFF",
    })) {
      results.push({ key, value });
    }
    return results;
  }

  async close(): Promise<void> {
    await this.db.close();
  }
}

function isNotFoundError(err: unknown): boolean {
  return (
    err instanceof Error &&
    "code" in err &&
    (err as { code?: unknown }).code === "LEVEL_NOT_FOUND"
  );
}

export async function createDesktopStorage(dbPath: string): Promise<StorageAdapter> {
  const db = new ClassicLevel<string, string>(dbPath, {
    keyEncoding: "utf8",
    valueEncoding: "utf8",
  });
  await db.open();
  return new LevelAdapter(db);
}
