"use client"

import { useCallback, useEffect, useRef, useState } from "react"

const SUCCESS_TTL_MS = 3000
const ERROR_TTL_MS = 5000

export function useAdminNotifications() {
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearSuccess = useCallback(() => setSuccessMessage(""), [])
  const clearError = useCallback(() => setErrorMessage(""), [])

  const showSuccess = useCallback((message: string) => {
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current)
    }

    setSuccessMessage(message)
    successTimeoutRef.current = setTimeout(clearSuccess, SUCCESS_TTL_MS)
  }, [clearSuccess])

  const showError = useCallback((message: string) => {
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current)
    }

    setErrorMessage(message)
    errorTimeoutRef.current = setTimeout(clearError, ERROR_TTL_MS)
  }, [clearError])

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current)
      }
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current)
      }
    }
  }, [])

  return {
    successMessage,
    errorMessage,
    showSuccess,
    showError,
    clearSuccess,
    clearError,
  }
}
