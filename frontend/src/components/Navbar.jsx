import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FiSettings, FiUser, FiLogIn } from 'react-icons/fi'
import { startSocialLogin } from '../utils/api'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [devUserId, setDevUserId] = useState('1')
  const [provider, setProvider] = useState('google')
  const location = useLocation()

  useEffect(() => {
    setApiKey(localStorage.getItem('dev_api_key') || '')
    setDevUserId(localStorage.getItem('dev_user_id') || '1')
    setProvider(localStorage.getItem('social_provider') || 'google')
  }, [])

  const save = () => {
    localStorage.setItem('dev_api_key', apiKey)
    localStorage.setItem('dev_user_id', devUserId)
    localStorage.setItem('social_provider', provider)
    setOpen(false)
  }

  const onLogin = async () => {
    try {
      const { redirect_to } = await startSocialLogin(provider)
      if (redirect_to) window.location.href = redirect_to
    } catch (e) {
      alert(`启动登录失败: ${e}`)
    }
  }

  return (
    <header className="bg-white border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-semibold text-gray-800">Rabbit Panel</Link>
        <nav className="flex items-center gap-4">
          <Link to="/dashboard" className={`text-sm ${location.pathname === '/dashboard' ? 'text-primary' : 'text-gray-600'} hover:text-primary`}>用户后台</Link>
          <Link to="/admin" className={`text-sm ${location.pathname === '/admin' ? 'text-primary' : 'text-gray-600'} hover:text-primary`}>管理后台</Link>
          <Link to="/proxy" className={`text-sm ${location.pathname === '/proxy' ? 'text-primary' : 'text-gray-600'} hover:text-primary`}>代理测试</Link>
          <button onClick={() => setOpen(true)} className="inline-flex items-center text-gray-600 hover:text-primary"><FiSettings className="mr-1" />配置</button>
          <button onClick={onLogin} className="inline-flex items-center bg-primary text-white px-3 py-1.5 rounded hover:bg-primary-dark"><FiLogIn className="mr-1"/>使用社交登录</button>
        </nav>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg w-full max-w-lg p-6">
            <h3 className="text-lg font-semibold mb-4">开发配置</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">DEV_API_KEY</label>
                <input className="w-full border rounded px-3 py-2" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="用于调用后端 dev_auth" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">x-dev-user-id</label>
                <input className="w-full border rounded px-3 py-2" value={devUserId} onChange={e => setDevUserId(e.target.value)} placeholder="模拟用户ID" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">社交提供方</label>
                <select className="w-full border rounded px-3 py-2" value={provider} onChange={e => setProvider(e.target.value)}>
                  <option value="google">Google</option>
                  <option value="github">GitHub</option>
                </select>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button className="px-3 py-1.5 rounded border" onClick={() => setOpen(false)}>取消</button>
              <button className="px-3 py-1.5 rounded bg-primary text-white" onClick={save}>保存</button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
