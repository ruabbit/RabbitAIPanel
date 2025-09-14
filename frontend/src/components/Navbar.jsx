import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FiSettings, FiLogIn, FiMenu } from 'react-icons/fi'
import { useUI } from '../context/UIContext'
import { startSocialLogin, currentApiBase } from '../utils/api'
import { isDebug, isLogged } from '../utils/dev'
import DevSettingsModal from './DevSettingsModal'

export default function Navbar() {
  const { sidebarOpen, setSidebarOpen } = useUI()
  const [open, setOpen] = useState(false)
  const location = useLocation()

  const onLogin = async () => {
    try {
      const provider = localStorage.getItem('social_provider') || 'google'
      const { redirect_to } = await startSocialLogin(provider)
      if (redirect_to) window.location.href = redirect_to
    } catch (e) {
      alert(`启动登录失败: ${e}`)
    }
  }

  const base = currentApiBase()
  const debug = isDebug()
  const logged = isLogged()

  return (
    <header className="bg-white border-b">
      <div className="w-full px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center text-gray-600 hover:text-primary" onClick={()=>setSidebarOpen(!sidebarOpen)} aria-label="Toggle sidebar">
            <FiMenu className="text-xl" />
          </button>
          <Link to="/" className="text-xl font-semibold text-gray-800">RabbitRelay</Link>
        </div>
        <nav className="flex items-center gap-4">
          <Link to="/dashboard" className={`text-sm ${location.pathname.startsWith('/dashboard') ? 'text-primary' : 'text-gray-600'} hover:text-primary`}>用户后台</Link>
          <Link to="/admin" className={`text-sm ${location.pathname.startsWith('/admin') ? 'text-primary' : 'text-gray-600'} hover:text-primary`}>管理后台</Link>
          {debug && <span className="hidden md:inline text-xs text-gray-500">API: {base || '未设置'}</span>}
          {debug && (
            <button onClick={() => setOpen(true)} className="inline-flex items-center text-gray-600 hover:text-primary"><FiSettings className="mr-1" />配置</button>
          )}
          {(debug || !logged) && (
            <button onClick={onLogin} className="inline-flex items-center bg-primary text-white px-3 py-1.5 rounded hover:bg-primary-dark"><FiLogIn className="mr-1"/>{debug ? '社交登录测试' : '使用社交登录'}</button>
          )}
        </nav>
      </div>
      {debug && !base && (
        <div className="bg-yellow-50 border-t border-yellow-200 text-amber-800 text-xs px-4 py-2">
          未设置 API 基址。请点击右上角“配置”设置，或在 .env 中配置 VITE_API_BASE。
        </div>
      )}

      <DevSettingsModal open={open} onClose={() => setOpen(false)} />
    </header>
  )
}
