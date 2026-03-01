/* global fetch, process, console, setTimeout */

import { spawn } from "node:child_process"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { join } from "node:path"

const FALLBACK_PORT = String(3600 + Math.floor(Math.random() * 200))
const PORT = process.env.SMOKE_PORT || FALLBACK_PORT
const BASE_URL = process.env.SMOKE_BASE_URL || `http://localhost:${PORT}`
const WORKDIR = process.cwd()
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
const LOGIN_USERNAME =
  process.env.SMOKE_LOGIN_USERNAME ||
  process.env.CALCULATOR_USERNAME ||
  process.env.ADMIN_FALLBACK_USERNAME ||
  LOCAL_ENV.CALCULATOR_USERNAME ||
  LOCAL_ENV.ADMIN_FALLBACK_USERNAME
const LOGIN_PASSWORD =
  process.env.SMOKE_LOGIN_PASSWORD ||
  process.env.CALCULATOR_PASSWORD ||
  process.env.ADMIN_FALLBACK_PASSWORD ||
  LOCAL_ENV.CALCULATOR_PASSWORD ||
  LOCAL_ENV.ADMIN_FALLBACK_PASSWORD

const require = createRequire(import.meta.url)
const NEXT_BIN = require.resolve("next/dist/bin/next")

const PUBLIC_ROUTE = "/login"
const PROTECTED_ROUTES = [
  "/",
  "/baratinha",
  "/barata-esgoto",
  "/aranha-mosquito-traca",
  "/pulga-carrapato-percevejo",
  "/formiga",
  "/escorpiao",
  "/escorpiao-formiga",
  "/cupim",
  "/rato",
  "/lei",
  "/admin",
  "/caixa-dagua",
  "/veiculos",
  "/atomizacao",
  "/falas",
]

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

async function waitForServer(timeoutMs = 45_000) {
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(`${BASE_URL}${PUBLIC_ROUTE}`, { redirect: "manual" })
      if (response.status >= 200) {
        return
      }
    } catch {
      // Wait until server accepts connections.
    }

    await sleep(1000)
  }

  throw new Error(`Servidor nao iniciou em ${BASE_URL} dentro de ${timeoutMs}ms`)
}

async function request(path, options = {}) {
  const headers = {
    Accept: "text/html,application/json",
    ...(options.headers || {}),
  }

  return fetch(`${BASE_URL}${path}`, {
    redirect: "manual",
    ...options,
    headers,
  })
}

function getCookiePair(setCookieHeader) {
  if (!setCookieHeader) {
    return null
  }

  const [firstCookie] = setCookieHeader.split(";")
  return firstCookie || null
}

function collectStaticAssetsFromHtml(html) {
  if (!html) {
    return []
  }

  const urls = new Set()
  const staticPattern = /\/_next\/static\/[^"' )>]+\.(?:js|css)/g
  for (const match of html.matchAll(staticPattern)) {
    const assetPath = match[0]
    if (assetPath) {
      urls.add(assetPath)
    }
  }

  return [...urls]
}

async function runChecks() {
  const checks = []
  const assetPaths = new Set()

  const pushCheck = (name, ok, details, level = "check") => {
    checks.push({ name, ok, details, level })
  }

  const loginPageResponse = await request(PUBLIC_ROUTE)
  const loginPageHtml = await loginPageResponse.text()
  pushCheck("Login page responde 200", loginPageResponse.status === 200, `status=${loginPageResponse.status}`)
  pushCheck(
    "Login page nao injeta /_vercel/insights/script.js em local",
    !loginPageHtml.includes("/_vercel/insights/script.js"),
    loginPageHtml.includes("/_vercel/insights/script.js") ? "script encontrado" : "script ausente",
  )

  for (const assetPath of collectStaticAssetsFromHtml(loginPageHtml)) {
    assetPaths.add(assetPath)
  }

  for (const route of PROTECTED_ROUTES) {
    const response = await request(route)
    const location = response.headers.get("location") || ""
    pushCheck(
      `Sem sessao: ${route} redireciona para login`,
      (response.status === 307 || response.status === 308) && location.includes("/login"),
      `status=${response.status} location=${location || "n/a"}`,
    )
  }

  if (!LOGIN_USERNAME || !LOGIN_PASSWORD) {
    pushCheck("Login autenticado", true, "ignorado (credenciais ausentes)", "skip")
  } else {
    const loginResponse = await request("/api/auth/login", {
      method: "POST",
      headers: {
        Origin: BASE_URL,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: LOGIN_USERNAME,
        password: LOGIN_PASSWORD,
      }),
    })

    const loginBody = await loginResponse.json().catch(() => ({}))
    const cookiePair = getCookiePair(loginResponse.headers.get("set-cookie"))

    pushCheck("Login autenticado", loginResponse.status === 200, `status=${loginResponse.status}`)
    pushCheck("Login retornou cookie de sessao", Boolean(cookiePair), cookiePair ? "cookie presente" : "cookie ausente")

    if (cookiePair) {
      const meResponse = await request("/api/auth/me", {
        headers: {
          Cookie: cookiePair,
        },
      })

      const meBody = await meResponse.json().catch(() => ({}))
      const role = meBody?.user?.role
      pushCheck("Sessao autenticada em /api/auth/me", meResponse.status === 200, `status=${meResponse.status}`)

      for (const route of PROTECTED_ROUTES) {
        const routeResponse = await request(route, {
          headers: {
            Cookie: cookiePair,
          },
        })

        if (route === "/admin" && role !== "admin") {
          const location = routeResponse.headers.get("location") || ""
          pushCheck(
            "Funcionario nao acessa /admin",
            (routeResponse.status === 307 || routeResponse.status === 308) && location === "/",
            `status=${routeResponse.status} location=${location || "n/a"}`,
          )
          continue
        }

        const routeHtml = await routeResponse.text()
        pushCheck(`${route} responde 200 com sessao`, routeResponse.status === 200, `status=${routeResponse.status}`)
        for (const assetPath of collectStaticAssetsFromHtml(routeHtml)) {
          assetPaths.add(assetPath)
        }
      }

      const activityResponse = await request("/api/activity?limit=5", {
        headers: {
          Cookie: cookiePair,
        },
      })
      pushCheck(
        "/api/activity responde com sessao",
        activityResponse.status === 200,
        `status=${activityResponse.status}`,
      )

      const usersResponse = await request("/api/users", {
        headers: {
          Cookie: cookiePair,
        },
      })
      if (role === "admin") {
        pushCheck("/api/users responde para admin", usersResponse.status === 200, `status=${usersResponse.status}`)
      } else {
        pushCheck(
          "/api/users bloqueado para funcionario",
          usersResponse.status === 403,
          `status=${usersResponse.status}`,
        )
      }

      const logoutResponse = await request("/api/auth/logout", {
        method: "POST",
        headers: {
          Cookie: cookiePair,
          Origin: BASE_URL,
        },
      })
      const logoutBody = await logoutResponse.json().catch(() => ({}))
      pushCheck("Logout responde 200", logoutResponse.status === 200, `status=${logoutResponse.status}`)
      pushCheck(
        "Logout retorna status de sessao unauthenticated",
        logoutBody?.sessionStatus === "unauthenticated",
        `sessionStatus=${logoutBody?.sessionStatus || "n/a"}`,
      )
    } else {
      pushCheck(
        "Checks autenticados de paginas/APIs",
        false,
        `nao executados: login status=${loginResponse.status} code=${loginBody?.code || "n/a"}`,
      )
    }
  }

  if (assetPaths.size === 0) {
    pushCheck("Assets _next/static encontrados", false, "nenhum asset encontrado no HTML")
  } else {
    for (const assetPath of assetPaths) {
      const assetResponse = await request(assetPath)
      pushCheck(
        `Asset ${assetPath} responde 200`,
        assetResponse.status === 200,
        `status=${assetResponse.status}`,
      )
    }
  }

  const failedChecks = checks.filter((check) => !check.ok)
  for (const check of checks) {
    const prefix = check.level === "skip" ? "[SKIP]" : check.ok ? "[OK]" : "[FAIL]"
    console.log(`${prefix} ${check.name} -> ${check.details}`)
  }

  assertCondition(failedChecks.length === 0, `${failedChecks.length} verificacao(oes) de smoke falharam.`)
}

async function run() {
  const child = spawn(process.execPath, [NEXT_BIN, "start", "-p", String(PORT)], {
    cwd: WORKDIR,
    stdio: "inherit",
    env: {
      ...process.env,
      ALLOW_FALLBACK_ADMIN: process.env.ALLOW_FALLBACK_ADMIN || "true",
    },
  })

  let exited = false
  child.on("exit", () => {
    exited = true
  })

  try {
    await waitForServer()
    await runChecks()
  } finally {
    if (!exited) {
      child.kill("SIGTERM")
    }
  }
}

run().catch((error) => {
  console.error("[SITE-SMOKE] Falha:", error.message)
  process.exit(1)
})
