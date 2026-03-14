"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// Blog listing is now embedded in the main Gestión Web page (Blog tab)
// This page redirects there
export default function BlogPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/gestion-web')
  }, [router])

  return (
    <div className="min-h-screen bg-[#f6f6f8] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#135bec]"></div>
    </div>
  )
}
