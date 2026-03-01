/* global fetch, process, console, setTimeout */

import { spawn } from "node:child_process"
import { createRequire } from "node:module"

const FALLBACK_PORT = String(3100 + Math.floor(Math.random() * 500))
const PORT = process.env.SECURITY_PORT || FALLBACK_PORT
const BASE_URL = process.env.SECURITY_BASE_URL || `http://localhost:${PORT}`
const WORKDIR = process.cwd()
const require = createRequire(import.meta.url)
const NEXT_BIN = require.resolve("next/dist/bin/next")

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForServer(url, serverState, timeoutMs = 45000) {
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeoutMs) {
    if (serverState.exited && serverState.exitCode !== 0) {
      throw new Error(`Servidor terminou antes de iniciar (exit code ${serverState.exitCode})`)
    }

    try {
      const response = await fetch(`${url}/login`, { redirect: "manual" })
      if (response.status >= 200) {
        return
      }
    } catch {
      // Wait until server accepts connections.
    }

    await sleep(1000)
  }

  throw new Error(`Servidor nao iniciou em ${url} dentro de ${timeoutMs}ms`)
}

async function run() {
  const child = spawn(
    process.execPath,
    [NEXT_BIN, "start", "-p", String(PORT)],
    {
      cwd: WORKDIR,
      stdio: "inherit",
      env: {
        ...process.env,
        ALLOW_FALLBACK_ADMIN: process.env.ALLOW_FALLBACK_ADMIN || "true",
      },
    },
  )
  const serverState = {
    exited: false,
    exitCode: 0,
  }
  child.on("exit", (code) => {
    serverState.exited = true
    serverState.exitCode = code ?? 1
  })

  try {
    await waitForServer(BASE_URL, serverState)

    const checkExitCode = await new Promise((resolve) => {
      const checkProcess = spawn(process.execPath, ["scripts/security-check.mjs"], {
        cwd: WORKDIR,
        stdio: "inherit",
        env: {
          ...process.env,
          SECURITY_BASE_URL: BASE_URL,
        },
      })

      checkProcess.on("exit", (code) => resolve(code ?? 1))
    })

    if (typeof checkExitCode === "number" && checkExitCode !== 0) {
      process.exitCode = checkExitCode
    }
  } finally {
    if (!serverState.exited) {
      child.kill("SIGTERM")
    }
  }
}

run().catch((error) => {
  console.error("[SECURITY-TEST-LOCAL] Falha:", error.message)
  process.exit(1)
})

