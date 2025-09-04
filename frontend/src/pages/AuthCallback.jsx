import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    // 当前后端 /auth/social/callback 会 302 到 / ，此页面作为兜底
    const timer = setTimeout(() => navigate('/'), 800)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="text-center py-20">
      <div className="text-xl text-gray-700">登录处理中…</div>
      <div className="text-sm text-gray-500 mt-2">若未跳转，请返回首页。</div>
    </div>
  )
}

