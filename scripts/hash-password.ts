import { hash } from "@node-rs/argon2";

const password = process.argv[2];
if (!password || password.length < 12) {
  console.error("Usage: npm run auth:hash -- 'a-password-with-12+-characters'");
  process.exit(1);
}

console.log(await hash(password));
