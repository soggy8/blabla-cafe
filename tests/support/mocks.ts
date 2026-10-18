import type { TestDb } from "./db";

export const state = {
  db: null as TestDb | null,
  cookies: new Map<string, string>(),
  headers: new Headers(),
};

export const dbModule = {
  hasDatabase: () => Boolean(state.db),
  getDb: () => {
    if (!state.db) throw new Error("no test db");
    return state.db;
  },
};

export const headersModule = {
  cookies: async () => ({
    get: (name: string) => {
      const value = state.cookies.get(name);
      return value === undefined ? undefined : { name, value };
    },
    set: (name: string, value: string) => void state.cookies.set(name, value),
    delete: (name: string) => void state.cookies.delete(name),
  }),
  headers: async () => state.headers,
};
