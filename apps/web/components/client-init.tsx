"use client"

import { useEffect } from "react"
import { initErrorHandlers } from "@/lib/utils/error-handler"

export function ClientInit() {
  useEffect(() => {
    initErrorHandlers()
  }, [])

  return null
}
