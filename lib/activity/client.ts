"use client"

interface ActivityDetailPayload {
  details?: string
}

function dispatchActivityEvent(eventName: string, payload: ActivityDetailPayload) {
  if (typeof window === "undefined") {
    return
  }

  window.dispatchEvent(
    new CustomEvent(eventName, {
      detail: payload,
    }),
  )
}

export function trackBudgetCalculated(details: string) {
  dispatchActivityEvent("orcamento-calculado", { details })
}

export function trackGuidanceCopied(details: string) {
  dispatchActivityEvent("orientacoes-copiadas", { details })
}
