import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"

const scrypt = promisify(scryptCallback)

const HASH_PREFIX = "scrypt"
const SALT_BYTES = 16
const KEY_BYTES = 64

function toHex(data: Buffer) {
  return data.toString("hex")
}

function fromHex(value: string) {
  return Buffer.from(value, "hex")
}

export function isHashedPassword(value: string) {
  return value.startsWith(`${HASH_PREFIX}$`)
}

export async function hashPassword(password: string) {
  const salt = randomBytes(SALT_BYTES)
  const derivedKey = (await scrypt(password, salt, KEY_BYTES)) as Buffer
  return `${HASH_PREFIX}$${toHex(salt)}$${toHex(derivedKey)}`
}

function verifyHashedPassword(password: string, storedHash: string) {
  const [prefix, saltHex, hashHex] = storedHash.split("$")

  if (prefix !== HASH_PREFIX || !saltHex || !hashHex) {
    return false
  }

  const salt = fromHex(saltHex)
  const expected = fromHex(hashHex)
  return scrypt(password, salt, expected.length).then((derived) =>
    timingSafeEqual(derived as Buffer, expected),
  )
}

export async function verifyPassword(password: string, storedPassword: string) {
  if (isHashedPassword(storedPassword)) {
    const valid = await verifyHashedPassword(password, storedPassword)
    return { valid, needsRehash: false }
  }

  const valid = password === storedPassword
  return { valid, needsRehash: valid }
}
