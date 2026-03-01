/* global fetch, process, console */

const BASE_URL = process.env.SECURITY_BASE_URL || "http://localhost:3000"
const LOGIN_USERNAME = process.env.SECURITY_LOGIN_USERNAME || process.env.CALCULATOR_USERNAME
const LOGIN_PASSWORD = process.env.SECURITY_LOGIN_PASSWORD || process.env.CALCULATOR_PASSWORD

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

  const suspiciousResponse = await request("/api/auth/login?tool=sqlmap")
  checks.push({
    name: "Proxy bloqueia padrao suspeito",
    ok: suspiciousResponse.status === 403,
    details: `status=${suspiciousResponse.status}`,
  })

  const bruteForceIp = randomTestIp()
  const bruteForceStatuses = []
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
  }
  checks.push({
    name: "Rate limit de login ativo apos tentativas repetidas",
    ok: bruteForceStatuses.at(-1) === 429,
    details: `statuses=${bruteForceStatuses.join(",")}`,
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

    if (sessionCookie) {
      const cookieHeader = sessionCookie.split(";")[0]
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
