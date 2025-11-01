import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

import { env } from "@/env";

const ALGORITHM = "aes-256-gcm";
const KEY_BYTE_LENGTH = 32;
const IV_BYTE_LENGTH = 16;
const VERSION = "v1";
const PAYLOAD_PARTS = 4;

type CiphertextV1 = string & { readonly __brand: "CiphertextV1" };

export type Ciphertext = CiphertextV1;

export class EncryptionKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EncryptionKeyError";
  }
}

export class DecryptionError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "DecryptionError";
  }
}

function getKey(): Buffer {
  const keyHex = env.ENCRYPTION_KEY;

  const keyBuffer = Buffer.from(keyHex, "hex");

  if (keyBuffer.length !== KEY_BYTE_LENGTH) {
    throw new EncryptionKeyError(
      "ENCRYPTION_KEY must decode to a 32-byte buffer"
    );
  }

  return keyBuffer;
}

function isCiphertextV1(value: string): value is CiphertextV1 {
  return value.startsWith(`${VERSION}:`);
}

export function encrypt(plainText: string): Ciphertext {
  const key = getKey();
  const initializationVector = randomBytes(IV_BYTE_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, initializationVector);

  const encrypted =
    cipher.update(plainText, "utf8", "hex") + cipher.final("hex");
  const authTagHex = cipher.getAuthTag().toString("hex");
  const ivHex = initializationVector.toString("hex");

  return `${VERSION}:${ivHex}:${authTagHex}:${encrypted}` as Ciphertext;
}

export function decrypt(payload: string): string {
  if (!isCiphertextV1(payload)) {
    throw new DecryptionError("Encrypted payload has unexpected format");
  }

  const segments = payload.split(":");

  if (segments.length !== PAYLOAD_PARTS) {
    throw new DecryptionError("Encrypted payload is incomplete");
  }

  const [, ivHex, authTagHex, encryptedHex] = segments;

  try {
    const key = getKey();
    const decipher = createDecipheriv(
      ALGORITHM,
      key,
      Buffer.from(ivHex, "hex")
    );
    decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

    return (
      decipher.update(encryptedHex, "hex", "utf8") + decipher.final("utf8")
    );
  } catch (error) {
    throw new DecryptionError("Failed to decrypt payload", { cause: error });
  }
}

export function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function isCiphertext(value: string): value is Ciphertext {
  return isCiphertextV1(value);
}
