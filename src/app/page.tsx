'use client'

import { useEffect } from "react"
import { useRouter } from 'next/navigation'

import Cookies from "js-cookie"

export default function Page() {
  const router = useRouter()

  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      router.push('/dashboard')
    } else {
      router.push('/auth/login')
    }
  }, [router])

  return null
}
