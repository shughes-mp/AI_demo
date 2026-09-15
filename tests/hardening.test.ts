import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { checkRateLimit } from "../src/lib/rate-limit.ts";

test("rate limiting rejects requests after the configured fixed-window budget", () => {
  const request = new Request("https://example.test/api/chat", {
    headers: { "x-forwarded-for": "192.0.2.42" },
  });
  const options = {
    scope: `test-${Date.now()}`,
    limit: 2,
    windowMs: 60_000,
  };

  assert.equal(checkRateLimit(request, options).allowed, true);
  assert.equal(checkRateLimit(request, options).allowed, true);
  const blocked = checkRateLimit(request, options);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.headers["X-RateLimit-Remaining"], "0");
  assert.ok(blocked.retryAfterSeconds > 0);
});

test("learner-session rate limits do not make colleagues on one network share a budget", () => {
  const request = new Request("https://example.test/api/chat", {
    headers: { "x-forwarded-for": "192.0.2.42" },
  });
  const scope = `session-test-${Date.now()}`;

  assert.equal(
    checkRateLimit(request, {
      scope,
      identifier: "learner-a",
      limit: 1,
      windowMs: 60_000,
    }).allowed,
    true
  );
  assert.equal(
    checkRateLimit(request, {
      scope,
      identifier: "learner-a",
      limit: 1,
      windowMs: 60_000,
    }).allowed,
    false
  );
  assert.equal(
    checkRateLimit(request, {
      scope,
      identifier: "learner-b",
      limit: 1,
      windowMs: 60_000,
    }).allowed,
    true
  );
});

test("learner entry and chat routes enforce request budgets", () => {
  for (const route of [
    "src/app/api/student-sessions/route.ts",
    "src/app/api/chat/route.ts",
  ]) {
    const source = fs.readFileSync(path.resolve(process.cwd(), route), "utf8");
    assert.match(source, /checkRateLimit/);
    assert.match(source, /rateLimitExceededResponse/);
  }
});

test("session deletion is owner-only and relies on cascading data removal", () => {
  const route = fs.readFileSync(
    path.resolve(process.cwd(), "src/app/api/sessions/[sessionId]/route.ts"),
    "utf8"
  );
  assert.match(route, /export async function DELETE/);
  assert.match(route, /requireSessionAccess\(sessionId, "owner"\)/);
  assert.match(route, /prisma\.session\.delete/);

  const workspace = fs.readFileSync(
    path.resolve(process.cwd(), "src/app/instructor/[sessionId]/page.tsx"),
    "utf8"
  );
  assert.match(workspace, /Delete session and learner data/);
  assert.match(workspace, /session\.instructorRole === "owner"/);
});

test("application routes provide loading, not-found, and error recovery UI", () => {
  for (const file of [
    "src/app/loading.tsx",
    "src/app/not-found.tsx",
    "src/app/error.tsx",
    "src/app/global-error.tsx",
  ]) {
    assert.equal(fs.existsSync(path.resolve(process.cwd(), file)), true, file);
  }
});

test("the Anthropic SDK is initialized lazily for build-safe imports", () => {
  const source = fs.readFileSync(
    path.resolve(process.cwd(), "src/lib/anthropic.ts"),
    "utf8"
  );
  assert.match(source, /export function getAnthropic/);
  assert.doesNotMatch(source, /export const anthropic/);
});

test("the Prisma client is initialized lazily for build-safe imports", () => {
  const source = fs.readFileSync(
    path.resolve(process.cwd(), "src/lib/db.ts"),
    "utf8"
  );
  assert.match(source, /function getPrismaClient/);
  assert.match(source, /export const prisma = new Proxy/);
  assert.doesNotMatch(source, /export const prisma = globalForPrisma\.prisma/);
});

test("every Prisma model is represented in the Turso bootstrap schema", () => {
  const prismaSchema = fs.readFileSync(
    path.resolve(process.cwd(), "prisma/schema.prisma"),
    "utf8"
  );
  const databaseSource = fs.readFileSync(
    path.resolve(process.cwd(), "src/lib/db.ts"),
    "utf8"
  );
  const modelNames = Array.from(
    prismaSchema.matchAll(/^model\s+(\w+)\s+\{/gm),
    (match: RegExpExecArray) => match[1]
  );

  assert.ok(modelNames.length > 0);
  for (const modelName of modelNames) {
    assert.match(
      databaseSource,
      new RegExp(`CREATE TABLE IF NOT EXISTS \\"${modelName}\\"`),
      `Turso bootstrap SQL is missing Prisma model ${modelName}`
    );
  }
});

test("Turso additive upgrades tolerate concurrent cold-start column races", () => {
  const databaseSource = fs.readFileSync(
    path.resolve(process.cwd(), "src/lib/db.ts"),
    "utf8"
  );

  assert.match(databaseSource, /async function applyAdditiveSchemaChanges/);
  assert.match(databaseSource, /duplicate column name/i);
  assert.match(databaseSource, /await client\.execute\(statement\)/);
  assert.doesNotMatch(
    databaseSource,
    /executeMultiple\(`\$\{alters\.join\(";\\n"\)\};`\)/
  );
});
