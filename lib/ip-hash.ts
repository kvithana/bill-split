import crypto from "crypto";

export function ipHash(ip: string) {
  return crypto.createHash("sha256").update(ip).digest("hex");
}
