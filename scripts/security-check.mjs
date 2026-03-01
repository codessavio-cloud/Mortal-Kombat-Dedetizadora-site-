/* global fetch, process, console */

import { readFileSync } from "node:fs"
import { join } from "node:path"

function loadDotEnvLocal() {
  const envFilePath = join(process.cwd(), ".env.local")
  try {
    const raw = readFileSync(envFilePath, "utf8")
    const values = {}
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) {
        continue
      }

      const separatorIndex = trimmed.indexOf("=")
      if (separatorIndex <= 0) {
        continue
      }

      const key = trimmed.slice(0, separatorIndex).trim()
      let value = trimmed.slice(separatorIndex + 1).trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      values[key] = value
    }
    return values
  } catch {
    return {}
  }
}

const LOCAL_ENV = loadDotEnvLocal()
const BASE_URL = process.env.SECURITY_BASE_URL || "http://localhost:3000"
const LOGIN_USERNAME =
  process.env.SECURITY_LOGIN_USERNAME ||
  process.env.CALCULATOR_USERNAME ||
  process.env.ADMIN_FALLBACK_USERNAME ||
  LOCAL_ENV.CALCULATOR_USERNAME ||
  LOCAL_ENV.ADMIN_FALLBACK_USERNAME
const LOGIN_PASSWORD =
  process.env.SECURITY_LOGIN_PASSWORD ||
  process.env.CALCULATOR_PASSWORD ||
  process.env.ADMIN_FALLBACK_PASSWORD ||
  LOCAL_ENV.CALCULATOR_PASSWORD ||
  LOCAL_ENV.ADMIN_FALLBACK_PASSWORD

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function randomTestIp() {
  const lastOctet = Math.floor(Math.random() * 200) + 20
  return `198.51.100.${lastOctet}`
}

async function request(path, init = {}, options = {}) {
  const ip = options.ip || randomTestIp()
  const mergedHeaders = {
    "X-Forwarded-For": ip,
    "User-Agent": "security-check",
    ...(init.headers || {}),
  }

  return fetch(`${BASE_URL}${path}`, {
    redirect: "manual",
    ...init,
    headers: mergedHeaders,
  })
}

async function run() {
  const checks = []

  const loginPageResponse = await request("/login")
  checks.push({
    name: "Login page responde 200",
    ok: loginPageResponse.status === 200,
    details: `status=${loginPageResponse.status}`,
  })
  checks.push({
    name: "Login page com header X-Frame-Options",
    ok: Boolean(loginPageResponse.headers.get("x-frame-options")),
    details: `x-frame-options=${loginPageResponse.headers.get("x-frame-options") || "ausente"}`,
  })
  checks.push({
    name: "Login page com CSP",
    ok: Boolean(loginPageResponse.headers.get("content-security-policy")),
    details: `csp=${loginPageResponse.headers.get("content-security-policy") ? "presente" : "ausente"}`,
  })

  const unauthorizedUsers = await request("/api/users")
  checks.push({
    name: "API /api/users bloqueia sem autenticacao",
    ok: unauthorizedUsers.status === 401 || unauthorizedUsers.status === 403,
    details: `status=${unauthorizedUsers.status}`,
  })

  const suspiciousIp = randomTestIp()
  const suspiciousResponse = await request("/api/auth/login?tool=sqlmap", {}, { ip: suspiciousIp })
  checks.push({
    name: "Proxy bloqueia padrao suspeito",
    ok: suspiciousResponse.status === 403,
    details: `status=${suspiciousResponse.status}`,
  })

  let bruteForceIp = randomTestIp()
  while (bruteForceIp === suspiciousIp) {
    bruteForceIp = randomTestIp()
  }
  const bruteForceStatuses = []
  const bruteForcePayloads = []
  const bruteForceRequestIds = []
  const bruteForceRetryAfter = []
  for (let index = 0; index < 6; index++) {
    const bruteForceResponse = await request(
      "/api/auth/login",
      {
        method: "POST",
        headers: {
          Origin: BASE_URL,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "hacker_test",
          password: "wrong-password",
        }),
      },
      { ip: bruteForceIp },
    )
    bruteForceStatuses.push(bruteForceResponse.status)
    bruteForceRequestIds.push(bruteForceResponse.headers.get("x-request-id"))
    bruteForceRetryAfter.push(bruteForceResponse.headers.get("retry-after"))
    bruteForcePayloads.push(await bruteForceResponse.json().catch(() => ({})))
  }
  checks.push({
    name: "Rate limit de login ativo apos tentativas repetidas",
    ok: bruteForceStatuses.at(-1) === 429,
    details: `statuses=${bruteForceStatuses.join(",")}`,
  })
  checks.push({
    name: "Login invalido retorna erro estruturado",
    ok:
      bruteForcePayloads[0]?.code === "INVALID_CREDENTIALS" &&
      typeof bruteForcePayloads[0]?.remainingAttempts === "number",
    details: `code=${bruteForcePayloads[0]?.code || "n/a"} remainingAttempts=${bruteForcePayloads[0]?.remainingAttempts ?? "n/a"}`,
  })
  const lastPayload = bruteForcePayloads[bruteForcePayloads.length - 1] || {}
  const retryAfterHeaderValue = Number(bruteForceRetryAfter[bruteForceRetryAfter.length - 1] || 0)
  checks.push({
    name: "Lockout retorna retryAfterSeconds",
    ok:
      (typeof lastPayload.retryAfterSeconds === "number" && lastPayload.retryAfterSeconds > 0) ||
      (Number.isFinite(retryAfterHeaderValue) && retryAfterHeaderValue > 0),
    details: `retryAfterSeconds=${lastPayload.retryAfterSeconds ?? "n/a"} retryAfterHeader=${bruteForceRetryAfter[bruteForceRetryAfter.length - 1] || "n/a"}`,
  })
  checks.push({
    name: "Respostas de login incluem X-Request-Id",
    ok: bruteForceRequestIds.every((value) => typeof value === "string" && value.length > 0),
    details: `requestIds=${bruteForceRequestIds.filter(Boolean).length}/${bruteForceRequestIds.length}`,
  })

  if (LOGIN_USERNAME && LOGIN_PASSWORD) {
    const authIp = randomTestIp()
    const loginResponse = await request(
      "/api/auth/login",
      {
        method: "POST",
        headers: {
          Origin: BASE_URL,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: LOGIN_USERNAME,
          password: LOGIN_PASSWORD,
        }),
      },
      { ip: authIp },
    )
    const loginBody = await loginResponse.json().catch(() => ({}))

    const sessionCookie = loginResponse.headers.get("set-cookie")
    checks.push({
      name: "Login com credencial valida",
      ok: loginResponse.status === 200,
      details: `status=${loginResponse.status}`,
    })
    checks.push({
      name: "Login retorna cookie de sessao",
      ok: Boolean(sessionCookie && sessionCookie.includes("auth-token=")),
      details: `cookie=${sessionCookie ? "presente" : "ausente"}`,
    })
    checks.push({
      name: "Login retorna contrato aditivo de sessao",
      ok:
        loginBody?.success === true &&
        loginBody?.sessionStatus === "authenticated" &&
        typeof loginBody?.redirectTo === "string" &&
        typeof loginBody?.expiresAt === "string",
      details: `sessionStatus=${loginBody?.sessionStatus || "n/a"} redirectTo=${loginBody?.redirectTo || "n/a"}`,
    })
    checks.push({
      name: "Login retorna X-Request-Id",
      ok: Boolean(loginResponse.headers.get("x-request-id")),
      details: `x-request-id=${loginResponse.headers.get("x-request-id") || "ausente"}`,
    })

    if (sessionCookie) {
      const cookieHeader = sessionCookie.split(";")[0]

      const meResponse = await request(
        "/api/auth/me",
        {
          method: "GET",
          headers: {
            Cookie: cookieHeader,
          },
        },
        { ip: authIp },
      )
      const meBody = await meResponse.json().catch(() => ({}))
      checks.push({
        name: "/api/auth/me autenticado retorna 200",
        ok: meResponse.status === 200,
        details: `status=${meResponse.status}`,
      })
      checks.push({
        name: "/api/auth/me retorna expiresAt/sessionStatus",
        ok: meBody?.sessionStatus === "authenticated" && typeof meBody?.expiresAt === "string",
        details: `sessionStatus=${meBody?.sessionStatus || "n/a"} expiresAt=${meBody?.expiresAt ? "presente" : "ausente"}`,
      })
      checks.push({
        name: "/api/auth/me retorna X-Request-Id",
        ok: Boolean(meResponse.headers.get("x-request-id")),
        details: `x-request-id=${meResponse.headers.get("x-request-id") || "ausente"}`,
      })

      const giantPayload = "A".repeat(64 * 1024)
      const giantActivityResponse = await request(
        "/api/activity",
        {
          method: "POST",
          headers: {
            Origin: BASE_URL,
            "Content-Type": "application/json",
            Cookie: cookieHeader,
          },
          body: JSON.stringify({
            action: "Pentest payload",
            details: giantPayload,
            page: "/admin",
          }),
        },
        { ip: authIp },
      )
      checks.push({
        name: "API activity bloqueia payload gigante",
        ok: giantActivityResponse.status === 413,
        details: `status=${giantActivityResponse.status}`,
      })

      const logoutResponse = await request(
        "/api/auth/logout",
        {
          method: "POST",
          headers: {
            Origin: BASE_URL,
            Cookie: cookieHeader,
          },
        },
        { ip: authIp },
      )
      const logoutBody = await logoutResponse.json().catch(() => ({}))
      checks.push({
        name: "Logout responde 200",
        ok: logoutResponse.status === 200,
        details: `status=${logoutResponse.status}`,
      })
      checks.push({
        name: "Logout retorna contrato idempotente",
        ok: logoutBody?.success === true && logoutBody?.sessionStatus === "unauthenticated",
        details: `sessionStatus=${logoutBody?.sessionStatus || "n/a"}`,
      })
      checks.push({
        name: "Logout retorna X-Request-Id",
        ok: Boolean(logoutResponse.headers.get("x-request-id")),
        details: `x-request-id=${logoutResponse.headers.get("x-request-id") || "ausente"}`,
      })

      const logoutAgainResponse = await request(
        "/api/auth/logout",
        {
          method: "POST",
          headers: {
            Origin: BASE_URL,
          },
        },
        { ip: authIp },
      )
      const logoutAgainBody = await logoutAgainResponse.json().catch(() => ({}))
      checks.push({
        name: "Logout permanece idempotente sem cookie",
        ok: logoutAgainResponse.status === 200 && logoutAgainBody?.sessionStatus === "unauthenticated",
        details: `status=${logoutAgainResponse.status} sessionStatus=${logoutAgainBody?.sessionStatus || "n/a"}`,
      })

      const meAfterLogout = await request(
        "/api/auth/me",
        {
          method: "GET",
        },
        { ip: authIp },
      )
      const meAfterLogoutBody = await meAfterLogout.json().catch(() => ({}))
      checks.push({
        name: "/api/auth/me apos logout retorna sessao unauthenticated",
        ok:
          meAfterLogout.status === 200 &&
          meAfterLogoutBody?.sessionStatus === "unauthenticated" &&
          meAfterLogoutBody?.code === "NOT_AUTHENTICATED",
        details: `status=${meAfterLogout.status} sessionStatus=${meAfterLogoutBody?.sessionStatus || "n/a"} code=${meAfterLogoutBody?.code || "n/a"}`,
      })
    }
  } else {
    checks.push({
      name: "Login com credencial valida",
      ok: true,
      details: "ignorado (variaveis de credencial ausentes)",
    })
  }

  const failedChecks = checks.filter((check) => !check.ok)
  for (const check of checks) {
    const prefix = check.ok ? "[OK]" : "[FAIL]"
    console.log(`${prefix} ${check.name} -> ${check.details}`)
  }

  assertCondition(failedChecks.length === 0, `${failedChecks.length} verificacao(oes) de seguranca falharam.`)
}

run().catch((error) => {
  console.error("[SECURITY-CHECK] Falha:", error.message)
  process.exit(1)
})
