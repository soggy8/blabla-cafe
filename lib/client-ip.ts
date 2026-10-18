// Behind a reverse proxy the proxy appends the connecting address to the end
// of X-Forwarded-For; anything before it was supplied by the client and can be
// forged. Only the last hop is trusted.
export function clientIp(headers: Pick<Headers, "get">) {
  const forwarded = headers.get("x-forwarded-for");
  const last = forwarded?.split(",").at(-1)?.trim();
  return last || headers.get("x-real-ip")?.trim() || "local";
}
