import crypto from "node:crypto";

const PBKDF2_ITERATIONS = 100000;
const PBKDF2_KEYLEN = 64;
const PBKDF2_DIGEST = "sha512";
const SALT_BYTES = 32;

/**
 * Hash a plain password using PBKDF2 with SHA-512 and a random salt.
 */
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(SALT_BYTES).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST)
    .toString("hex");
  return { hash, salt };
}

/**
 * Verify a plain password against a stored PBKDF2 hash using constant-time comparison.
 */
export function verifyPassword(
  password: string,
  hash: string,
  salt: string,
): boolean {
  try {
    const computed = crypto
      .pbkdf2Sync(
        password,
        salt,
        PBKDF2_ITERATIONS,
        PBKDF2_KEYLEN,
        PBKDF2_DIGEST,
      )
      .toString("hex");
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
  } catch {
    return false;
  }
}

/**
 * Generate a unique entity identifier (e.g. `usr_...`, `biz_...`).
 */
export function randomId(prefix = "id"): string {
  const hex = crypto.randomBytes(12).toString("hex");
  return `${prefix}_${hex}`;
}

/**
 * Generate a cryptographically secure random token (hex string).
 */
export function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

/**
 * Generate a secure 6-digit numeric verification code.
 */
export function randomDigitCode(length = 6): string {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  return crypto.randomInt(min, max + 1).toString();
}

/**
 * Compute SHA-256 hash of a string (useful for hashing refresh tokens).
 */
export function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export interface JwtHeader {
  alg: "HS256";
  typ: "JWT";
}

export interface JwtPayload {
  sub: string;
  role: "owner" | "employee" | "accountant";
  businessId?: string;
  email: string;
  fullName: string;
  exp: number;
  iat: number;
  jti: string;
}

/**
 * Sign a payload using HMAC-SHA256 into a standard base64url JWT.
 */
export function signJwt(
  payload: Omit<JwtPayload, "iat" | "jti">,
  secret: string,
): string {
  const iat = Math.floor(Date.now() / 1000);
  const jti = crypto.randomBytes(16).toString("hex");
  const fullPayload: JwtPayload = { ...payload, iat, jti };

  const header: JwtHeader = { alg: "HS256", typ: "JWT" };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString(
    "base64url",
  );
  const encodedPayload = Buffer.from(JSON.stringify(fullPayload)).toString(
    "base64url",
  );
  const message = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(message)
    .digest("base64url");

  return `${message}.${signature}`;
}

/**
 * Verify and decode an HMAC-SHA256 JWT using constant-time comparison.
 */
export function verifyJwt(token: string, secret: string): JwtPayload {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Malformed JWT: expected 3 segments.");
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  if (!encodedHeader || !encodedPayload || !signature) {
    throw new Error("Malformed JWT segment.");
  }

  const message = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(message)
    .digest("base64url");

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    sigBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    throw new Error("Invalid JWT signature.");
  }

  const payloadJson = Buffer.from(encodedPayload, "base64url").toString("utf8");
  const payload = JSON.parse(payloadJson) as JwtPayload;

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    throw new Error("JWT has expired.");
  }

  return payload;
}
