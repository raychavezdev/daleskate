import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  clearSessionOnUnauthorizedStatus,
  clearStoredSession,
  getStoredSessionStartedAt,
  isSessionTokenCurrent,
  storeSessionToken,
} from "../src/components/admin/sessionToken.js";

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const fakeStorage = (initial = null) => {
  const values = new Map();
  if (initial !== null) values.set("token", initial);
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, nextValue) => { values.set(key, nextValue); },
    removeItem: (key) => { values.delete(key); },
  };
};

const encodeBase64Url = (value) => Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
const makeToken = (payload) => `${encodeBase64Url({ alg: "HS256", typ: "JWT" })}.${encodeBase64Url(payload)}.fictitious-signature`;

test("acepta y conserva un JWT recién generado por authenticateRequest de PHP", () => {
  const generatorPath = resolve(currentDirectory, "../../backend/tests/fixtures/create_session_compatibility_token.php");
  const generated = spawnSync("php", [generatorPath], { encoding: "utf8" });
  assert.equal(generated.status, 0, "el generador PHP ficticio debe finalizar correctamente");
  const token = generated.stdout.trim();
  assert.ok(token.length > 0, "PHP debe emitir el JWT de prueba sin imprimirlo en la salida de la suite");

  const storage = fakeStorage();
  assert.equal(isSessionTokenCurrent(token), true);
  assert.equal(storeSessionToken(token, storage), true);
  assert.equal(storage.getItem("token") === token, true);
  assert.equal(Number.isFinite(getStoredSessionStartedAt(storage)), true);
});

test("rechaza expirados, sin exp y malformados", () => {
  const now = Math.floor(Date.now() / 1000);
  const expired = makeToken({ iat: now - 28_801, exp: now - 1, data: { id: 1, role: "admin" } });
  const missingExp = makeToken({ iat: now, data: { id: 1, role: "admin" } });
  assert.equal(isSessionTokenCurrent(expired, now * 1000), false);
  assert.equal(isSessionTokenCurrent(missingExp, now * 1000), false);
  assert.equal(isSessionTokenCurrent("no-es-un-jwt"), false);
});

test("el reloj local adelantado no elimina un login nuevo y respeta las ocho horas", () => {
  const now = Math.floor(Date.now() / 1000);
  const token = makeToken({ iat: now, exp: now + 28_800, data: { id: 1, role: "admin" } });
  const localClock = Date.now() + 10 * 365 * 24 * 60 * 60 * 1000;
  const storage = fakeStorage();
  assert.equal(storeSessionToken(token, storage, localClock), true);
  const sessionStartedAt = getStoredSessionStartedAt(storage);
  assert.equal(isSessionTokenCurrent(token, localClock, sessionStartedAt), true);
  assert.equal(isSessionTokenCurrent(token, localClock + 28_800_000, sessionStartedAt), false);
});

test("logout elimina la sesión y solo HTTP 401 limpia el token", () => {
  const storage = fakeStorage("sesion-ficticia");
  storage.setItem("token_session_started_at", "12345");
  assert.equal(clearSessionOnUnauthorizedStatus(403, storage), false);
  assert.equal(storage.getItem("token"), "sesion-ficticia");
  assert.equal(storage.getItem("token_session_started_at"), "12345");
  assert.equal(clearSessionOnUnauthorizedStatus(401, storage), true);
  assert.equal(storage.getItem("token"), null);
  assert.equal(storage.getItem("token_session_started_at"), null);

  storage.setItem("token", "sesion-ficticia");
  clearStoredSession(storage);
  assert.equal(storage.getItem("token"), null);
  assert.equal(storage.getItem("token_session_started_at"), null);
});

test("Login y PrivateRoutes usan el mismo validador temporal", async () => {
  const login = await readFile(resolve(currentDirectory, "../src/components/pages/Login.jsx"), "utf8");
  const privateRoute = await readFile(resolve(currentDirectory, "../src/components/admin/PrivateRoutes.jsx"), "utf8");
  const dashboard = await readFile(resolve(currentDirectory, "../src/components/admin/Dashboard.jsx"), "utf8");
  assert.match(login, /storeSessionToken\(data\.token,/);
  assert.ok(login.indexOf("const sessionStartedAt = Date.now()") < login.indexOf("storeSessionToken(data.token,"));
  assert.match(privateRoute, /isSessionTokenCurrent\(token,/);
  assert.match(dashboard, /clearStoredSession\(\)/);
});
