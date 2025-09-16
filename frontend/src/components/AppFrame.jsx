import React, { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { FiMenu, FiBell, FiHome, FiUsers, FiFolder, FiCalendar, FiFileText, FiPieChart, FiSettings, FiChevronDown, FiX, FiLogIn } from 'react-icons/fi'
import DevSettingsModal from './DevSettingsModal'
import { startSocialLogin, currentApiBase, getMe, listCustomers } from '../utils/api'
import { isDebug, isLogged } from '../utils/dev'

function navIcon(name) {
  switch (name) {
    case 'home': return FiHome
    case 'users': return FiUsers
    case 'folder': return FiFolder
    case 'calendar': return FiCalendar
    case 'docs': return FiFileText
    case 'reports': return FiPieChart
    case 'settings': return FiSettings
    default: return FiFolder
  }
}

export default function AppFrame({ title = '', items = [], children, settingsTo: settingsToProp }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [devOpen, setDevOpen] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const location = useLocation()
  const base = currentApiBase()
  const debug = isDebug()
  const logged = isLogged()
  const [me, setMe] = useState({ name: '' })
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const r = await getMe()
        if (!mounted) return
        const baseMe = r.me || { name: '' }
        // Fallback in Debug: if name missing, try query by local dev_user_id and then latest user customer
        if ((!baseMe?.name || baseMe.name === '') && debug) {
          try {
            const uid = localStorage.getItem('dev_user_id')
            if (uid) {
              const resp = await listCustomers({ entityType: 'user', entityId: uid, limit: 1, offset: 0 })
              const c = (resp.customers || [])[0]
              if (c) {
                setMe({ name: c.name || '', email: c.email || '' })
                return
              }
            }
            // fallback to latest user customer
            const any = await listCustomers({ entityType: 'user', limit: 1, offset: 0 })
            const c2 = (any.customers || [])[0]
            if (c2) {
              setMe({ name: c2.name || '', email: c2.email || '' })
              // set dev_user_id for subsequent requests
              try { localStorage.setItem('dev_user_id', String(c2.entity_id)) } catch {}
              return
            }
          } catch {}
        }
        setMe(baseMe)
      } catch (e) {
        const msg = String(e?.message || e || '')
        if (msg.includes('not_logged_in')) {
          window.location.href = '/'
          return
        }
        // ignore other errors
      }
    })()
    return () => { mounted = false }
  }, [])

  const settingsTo = settingsToProp || (location.pathname.startsWith('/admin') ? '/admin/settings' : '/settings')

  const Sidebar = (
    <div className="relative flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6 pb-4 ring-1 ring-white/10">
      <div className="relative flex h-16 shrink-0 items-center">
        <Link to="/" className="text-white font-semibold">RabbitRelay</Link>
      </div>
      <nav className="relative flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {items.map((it, idx) => {
                const active = location.pathname === it.to || location.pathname.startsWith(it.to + '/')
                const Icon = navIcon(it.icon)
                return (
                  <li key={idx}>
                    <Link
                      to={it.to}
                      className={(active ? 'bg-white/5 text-white ' : 'text-gray-400 hover:bg-white/5 hover:text-white ') + 'group flex gap-x-3 rounded-md p-2 text-sm font-semibold'}
                      onClick={() => setSidebarOpen(false)}
                    >
                      {Icon && <Icon className="size-5 shrink-0" />}
                      {it.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </li>
          <li className="mt-auto">
            <Link to={settingsTo} className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold text-gray-400 hover:bg-white/5 hover:text-white" onClick={() => setSidebarOpen(false)}>
              <FiSettings className="size-5 shrink-0" />
              设置
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  )

  return (
    <div>
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 bg-gray-900 ring-1 ring-white/10 shadow-xl">
            <button className="absolute -right-10 top-4 text-white" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">
              <FiX className="size-6" />
            </button>
            {Sidebar}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden bg-gray-900 ring-1 ring-white/10 lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-black/10 px-0 pb-4">
          {Sidebar}
        </div>
      </div>

      {/* Content area */}
      <div className="lg:pl-72">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-xs sm:gap-x-6 sm:px-6 lg:px-8">
          <button type="button" onClick={() => setSidebarOpen(true)} className="-m-2.5 p-2.5 text-gray-700 hover:text-gray-900 lg:hidden" aria-label="Open sidebar">
            <FiMenu className="size-6" />
          </button>
          <div aria-hidden className="h-6 w-px bg-gray-900/10 lg:hidden" />
          <div className="flex flex-1 items-center justify-between">
            <div className="text-sm font-medium text-gray-700">{title}</div>
            <div className="flex items-center gap-x-4">
              {debug && <span className="hidden md:inline text-xs text-gray-500">API: {base || '未设置'}</span>}
              {debug && (
                <button type="button" className="-m-2.5 p-2.5 text-gray-700 hover:text-gray-900" onClick={() => setDevOpen(true)}>
                  <FiSettings className="size-5" />
                </button>
              )}
              {(debug || !logged) && (
                <button
                  type="button"
                  className="inline-flex items-center bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-500"
                  onClick={async () => {
                    try {
                      setLoginLoading(true)
                      const provider = localStorage.getItem('social_provider') || 'google'
                      const { redirect_to } = await startSocialLogin(provider)
                      if (redirect_to) window.location.href = redirect_to
                    } catch (e) {
                      alert(`启动登录失败: ${e}`)
                    } finally { setLoginLoading(false) }
                  }}
                  disabled={loginLoading}
                >
                  <FiLogIn className="mr-1" />{loginLoading ? '登录中…' : (debug ? '社交登录测试' : '使用社交登录')}
                </button>
              )}
              <button type="button" className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500" aria-label="Notifications">
                <FiBell className="size-5" />
              </button>
              <div className="hidden lg:flex relative items-center text-sm text-gray-700">
                <button className="inline-flex items-center" onClick={()=> setUserMenuOpen(v=>!v)}>
                  <span className="font-medium">{me?.name || '你'}</span>
                  <FiChevronDown className="ml-2 size-4 text-gray-400" />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-40 bg-white border border-gray-200 rounded shadow z-50">
                    <Link to="/dashboard/purchase" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={()=> setUserMenuOpen(false)}>购买/充值</Link>
                    <Link to="/settings" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={()=> setUserMenuOpen(false)}>设置</Link>
                    <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={()=>{
                      try {
                        localStorage.removeItem('dev_user_id')
                        localStorage.removeItem('dev_api_key')
                        localStorage.removeItem('admin_auth_token')
                        // 保留 api_base 以免丢失配置
                      } catch {}
                      window.location.href = '/'
                    }}>退出</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {debug && !base && (
          <div className="lg:pl-72">
            <div className="bg-yellow-50 border-b border-yellow-200 text-amber-800 text-xs px-4 py-2">
              未设置 API 基址。请点击右上角“齿轮/配置”设置，或在 .env 中配置 VITE_API_BASE。
            </div>
          </div>
        )}

        <main className="py-6">
          <div className="px-4 sm:px-6 lg:px-8">
            {children || <Outlet />}
          </div>
        </main>
      </div>

      <DevSettingsModal open={devOpen} onClose={() => setDevOpen(false)} />
    </div>
  )
}
