import React, { useEffect, useState } from 'react'
import { toast } from '../utils/toast'

export default function DevSettingsModal({ open, onClose }) {
  const [apiKey, setApiKey] = useState('')
  const [devUserId, setDevUserId] = useState('1')
  const [provider, setProvider] = useState('google')
  const [apiBase, setApiBase] = useState('')

  useEffect(() => {
    if (!open) return
    setApiKey(localStorage.getItem('dev_api_key') || '')
    setDevUserId(localStorage.getItem('dev_user_id') || '1')
    setProvider(localStorage.getItem('social_provider') || 'google')
    setApiBase(localStorage.getItem('api_base') || (import.meta?.env?.VITE_API_BASE || ''))
  }, [open])

  const save = () => {
    localStorage.setItem('dev_api_key', apiKey)
    localStorage.setItem('dev_user_id', devUserId)
    localStorage.setItem('social_provider', provider)
    const base = (apiBase || '').trim()
    if (base) {
      localStorage.setItem('api_base', base)
    } else {
      localStorage.removeItem('api_base')
    }
    try { window.dispatchEvent(new Event('rr:settings-saved')) } catch {}
    toast('配置已保存')
    onClose?.()
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60]">
      <div className="bg-white rounded shadow-lg w-full max-w-lg p-6">
        <h3 className="text-lg font-semibold mb-4">开发配置</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">API 基址（可选，覆盖 .env 的 VITE_API_BASE）</label>
            <input className="w-full border rounded px-3 py-2" value={apiBase} onChange={e => setApiBase(e.target.value)} placeholder="例如：http://100.110.0.229:8000" />
          </div>
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
          <button className="px-3 py-1.5 rounded border" onClick={onClose}>取消</button>
          <button className="px-3 py-1.5 rounded bg-blue-600 text-white" onClick={save}>保存</button>
        </div>
      </div>
    </div>
  )
}
