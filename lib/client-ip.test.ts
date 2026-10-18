import { describe, expect, it } from "vitest";
import { clientIp } from "./client-ip";

const h = (values: Record<string, string>) => new Headers(values);

describe("clientIp", () => {
  it("uses the address the proxy appended, not client-supplied ones", () => {
    expect(clientIp(h({ "x-forwarded-for": "6.6.6.6, 7.7.7.7, 203.0.113.9" }))).toBe("203.0.113.9");
  });
  it("handles a single address", () => {
    expect(clientIp(h({ "x-forwarded-for": "203.0.113.9" }))).toBe("203.0.113.9");
  });
  it("falls back to x-real-ip then local", () => {
    expect(clientIp(h({ "x-real-ip": "198.51.100.2" }))).toBe("198.51.100.2");
    expect(clientIp(h({}))).toBe("local");
  });
});
