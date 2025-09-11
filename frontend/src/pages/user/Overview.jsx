import React, { useState } from 'react'
import { getBudget } from '../../utils/api'

export default function Overview() {
  const [userId, setUserId] = useState(localStorage.getItem('dev_user_id') || '1')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const load = async () => {
    setLoading(true); setErr('')
    try { const res = await getBudget(userId); setData(res) } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }

  const percent = () => {
    if (!data?.daily_limit) return 0
    const dl = data.daily_limit
    const used = dl.spent_today_cents || 0
    const total = dl.daily_limit_cents || 1
    return Math.min(100, Math.round((used / total) * 100))
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-3">
        <input className="border rounded px-3 py-2" value={userId} onChange={e => setUserId(e.target.value)} />
        <button onClick={load} className="bg-primary text-white px-4 py-2 rounded">加载概览</button>
      </div>
      {loading && <div className="text-sm text-gray-500">加载中…</div>}
      {err && <div className="text-sm text-red-600">{err}</div>}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded shadow p-5">
            <div className="font-semibold mb-2">钱包（多币种）</div>
            <ul className="text-sm text-gray-700 space-y-1">
              {(data.wallets || []).map((w, i) => (
                <li key={i}>{w.currency}: {w.balance_cents}¢</li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded shadow p-5">
            <div className="font-semibold mb-2">日限额使用</div>
            {data.daily_limit ? (
              <>
                <div className="text-sm text-gray-700 mb-2">已用 {data.daily_limit.spent_today_cents} / 总额 {data.daily_limit.daily_limit_cents}（¢）</div>
                <div className="h-2 bg-gray-200 rounded">
                  <div className="h-2 bg-primary rounded" style={{ width: `${percent()}%` }} />
                </div>
              </>
            ) : <div className="text-sm text-gray-500">未配置日限额</div>}
          </div>
          <div className="bg-white rounded shadow p-5">
            <div className="font-semibold mb-2">系统状态</div>
            <div className="text-sm text-gray-700">门禁：{data.gating?.enabled ? data.gating.mode : '关闭'}</div>
            <div className="text-sm text-gray-700">LiteLLM：{data.litellm?.configured ? '已配置' : '未配置'}（同步 {data.litellm?.sync_enabled ? '开':'关'}）</div>
          </div>
        </div>
      )}
    </div>
  )
}

