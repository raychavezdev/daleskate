const MAX_SESSION_SECONDS = 8 * 60 * 60;
const ALLOWED_ISSUED_AT_SKEW_SECONDS = 60;
const SESSION_STARTED_AT_KEY = "token_session_started_at";

export function readJwtPayload(token) {
  if (typeof token !== "string") return null;
  const segments = token.split(".");
  if (segments.length !== 3 || segments.some((segment) => segment === "")) return null;

  if (segments.some((segment) => !/^[A-Za-z0-9_-]+$/.test(segment))) return null;
  const payloadSegment = segments[1];

  try {
    const headerSegment = segments[0].replace(/-/g, "+").replace(/_/g, "/");
    const headerPadded = headerSegment.padEnd(Math.ceil(headerSegment.length / 4) * 4, "=");
    const headerBinary = atob(headerPadded);
    const headerBytes = Uint8Array.from(headerBinary, (character) => character.charCodeAt(0));
    const header = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(headerBytes));
    if (!header || header.alg !== "HS256") return null;

    const normalized = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const payload = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    return payload && typeof payload === "object" && !Array.isArray(payload) ? payload : null;
  } catch {
    return null;
  }
}

function hasValidSessionClaims(payload) {
  return Boolean(payload)
    && Number.isInteger(payload.iat)
    && Number.isInteger(payload.exp)
    && payload.exp > payload.iat
    && payload.exp - payload.iat <= MAX_SESSION_SECONDS;
}

export function isSessionTokenCurrent(token, nowMilliseconds = Date.now(), sessionStartedAt = null) {
  const payload = readJwtPayload(token);
  if (!hasValidSessionClaims(payload)) return false;

  if (Number.isFinite(sessionStartedAt)) {
    // sessionStartedAt se captura al iniciar el login, antes de que el servidor emita el JWT.
    const elapsedMilliseconds = nowMilliseconds - sessionStartedAt;
    return elapsedMilliseconds >= 0
      && elapsedMilliseconds < (payload.exp - payload.iat) * 1000;
  }

  const nowSeconds = Math.floor(nowMilliseconds / 1000);
  return payload.iat <= nowSeconds + ALLOWED_ISSUED_AT_SKEW_SECONDS
    && payload.exp > nowSeconds;
}

export function storeSessionToken(token, storage = localStorage, sessionStartedAt = Date.now()) {
  if (!hasValidSessionClaims(readJwtPayload(token)) || !Number.isFinite(sessionStartedAt)) return false;
  storage.setItem("token", token);
  storage.setItem(SESSION_STARTED_AT_KEY, String(sessionStartedAt));
  return true;
}

export function clearStoredSession(storage = localStorage) {
  storage.removeItem("token");
  storage.removeItem(SESSION_STARTED_AT_KEY);
}

export function clearSessionOnUnauthorizedStatus(status, storage = localStorage) {
  if (status !== 401) return false;
  clearStoredSession(storage);
  return true;
}

export function getStoredSessionStartedAt(storage = localStorage) {
  const storedValue = storage.getItem(SESSION_STARTED_AT_KEY);
  if (storedValue === null) return null;
  const timestamp = Number(storedValue);
  return Number.isFinite(timestamp) ? timestamp : null;
}
