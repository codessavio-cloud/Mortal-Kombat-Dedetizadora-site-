"use client"

import { useEffect } from "react"

const RETRY_KEY = "mk-asset-retry-at"
const RETRY_WINDOW_MS = 30_000

function shouldRetryNow() {
  try {
    const lastRetryRaw = sessionStorage.getItem(RETRY_KEY)
    if (!lastRetryRaw) {
      return true
    }

    const lastRetryAt = Number(lastRetryRaw)
    if (!Number.isFinite(lastRetryAt)) {
      return true
    }

    return Date.now() - lastRetryAt > RETRY_WINDOW_MS
  } catch {
    return true
  }
}

function markRetry() {
  try {
    sessionStorage.setItem(RETRY_KEY, String(Date.now()))
  } catch {
    // Ignore storage write failures.
  }
}

function isNextStaticAssetUrl(url: string | null | undefined) {
  if (!url) {
    return false
  }

  return url.includes("/_next/static/")
}

function recoverFromAssetFailure(failedUrl: string) {
  if (!isNextStaticAssetUrl(failedUrl)) {
    return
  }

  if (!shouldRetryNow()) {
    return
  }

  markRetry()

  const nextUrl = new URL(window.location.href)
  nextUrl.searchParams.set("_assetRetry", String(Date.now()))
  window.location.replace(nextUrl.toString())
}

function extractFailureUrlFromError(error: unknown) {
  if (!error) {
    return ""
  }

  if (typeof error === "string") {
    return error
  }

  if (error instanceof Error) {
    return error.message
  }

  return ""
}

export function AssetRecovery() {
  useEffect(() => {
    const onResourceError = (event: Event) => {
      const target = event.target
      if (!target) {
        return
      }

      if (target instanceof HTMLScriptElement) {
        recoverFromAssetFailure(target.src)
        return
      }

      if (target instanceof HTMLLinkElement) {
        recoverFromAssetFailure(target.href)
      }
    }

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reasonText = extractFailureUrlFromError(event.reason)
      recoverFromAssetFailure(reasonText)
    }

    const onError = (event: ErrorEvent) => {
      const composed = `${event.message || ""} ${event.filename || ""}`
      recoverFromAssetFailure(composed)
    }

    window.addEventListener("error", onResourceError, true)
    window.addEventListener("error", onError)
    window.addEventListener("unhandledrejection", onUnhandledRejection)

    return () => {
      window.removeEventListener("error", onResourceError, true)
      window.removeEventListener("error", onError)
      window.removeEventListener("unhandledrejection", onUnhandledRejection)
    }
  }, [])

  return null
}
