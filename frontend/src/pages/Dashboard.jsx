import React, { useState } from 'react'
import { getBudget, getPeriod, getDailyReport, getSummaryReport, getOverdraftReport } from '../utils/api'

export default function Dashboard() {
  const [userId, setUserId] = useState(localStorage.getItem('dev_user_id') || '1')
  const [budget, setBudget] = useState(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const [dateFrom, setDateFrom] = useState('2025-09-01')
  const [dateTo, setDateTo] = useState('2025-09-03')
  const [groupBy, setGroupBy] = useState('total')
  const [period, setPeriod] = useState(null)
  const [dailyDate, setDailyDate] = useState('2025-09-03')
  const [daily, setDaily] = useState(null)
  const [sumDays, setSumDays] = useState(7)
  const [summary, setSummary] = useState(null)
  const [odDays, setOdDays] = useState(7)
  const [overdraft, setOverdraft] = useState(null)

  const loadBudget = async () => {
    setLoading(true); setErr('')
    try {
      const data = await getBudget(userId)
      setBudget(data)
    } catch (e) {
      setErr(String(e))
    } finally { setLoading(false) }
  }

  const loadPeriod = async () => {
    setLoading(true); setErr('')
    try {
      const data = await getPeriod({ userId, dateFrom, dateTo, groupBy })
      setPeriod(data)
    } catch (e) {
      setErr(String(e))
    } finally { setLoading(false) }
  }

  const downloadPeriodCsv = async () => {
    try {
      const csv = await getPeriod({ userId, dateFrom, dateTo, groupBy, format: 'csv' })
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `period_${userId}_${dateFrom}_${dateTo}_${groupBy}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert(`下载失败: ${e}`)
    }
  }

  const loadDaily = async () => {
    setLoading(true); setErr('')
    try { const data = await getDailyReport({ userId, date: dailyDate }); setDaily(data) } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }

  const loadSummary = async () => {
    setLoading(true); setErr('')
    try { const data = await getSummaryReport({ userId, days: Number(sumDays) }); setSummary(data) } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }

  const loadOverdraft = async () => {
    setLoading(true); setErr('')
    try { const data = await getOverdraftReport({ userId, days: Number(odDays) }); setOverdraft(data) } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">用户后台</h2>

      <div className="bg-white rounded shadow p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">user_id</label>
            <input className="w-full border rounded px-3 py-2" value={userId} onChange={e => setUserId(e.target.value)} />
          </div>
          <div className="flex items-end">
            <button onClick={loadBudget} className="bg-primary text-white px-4 py-2 rounded w-full">加载预算总览</button>
          </div>
        </div>
        {loading && <div className="text-sm text-gray-500">加载中…</div>}
        {err && <div className="text-sm text-red-600">{err}</div>}
        {budget && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="border rounded p-4">
              <div className="font-semibold mb-2">钱包（多币种）</div>
              <ul className="text-sm text-gray-700 space-y-1">
                {(budget.wallets || []).map((w, i) => (
                  <li key={i}>{w.currency}: {w.balance_cents}¢{w.low_threshold_cents != null ? `（低阈值 ${w.low_threshold_cents}¢）` : ''}</li>
                ))}
              </ul>
            </div>
            <div className="border rounded p-4">
              <div className="font-semibold mb-2">日限额</div>
              {budget.daily_limit ? (
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>计划ID: {budget.daily_limit.plan_id}</li>
                  <li>额度: {budget.daily_limit.daily_limit_cents}¢</li>
                  <li>已用: {budget.daily_limit.spent_today_cents}¢</li>
                  <li>剩余: {budget.daily_limit.remaining_cents}¢</li>
                  <li>策略: {budget.daily_limit.overflow_policy}</li>
                </ul>
              ) : <div className="text-sm text-gray-500">无日限额</div>}
            </div>
            <div className="border rounded p-4">
              <div className="font-semibold mb-2">系统</div>
              <div className="text-sm text-gray-700">门禁：{budget.gating?.enabled ? `${budget.gating.mode}` : '关闭'}</div>
              <div className="text-sm text-gray-700">LiteLLM：{budget.litellm?.configured ? '已配置' : '未配置'}（同步 {budget.litellm?.sync_enabled ? '开' : '关'}）</div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded shadow p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">date_from</label>
            <input className="w-full border rounded px-3 py-2" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">date_to</label>
            <input className="w-full border rounded px-3 py-2" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">group_by</label>
            <select className="w-full border rounded px-3 py-2" value={groupBy} onChange={e => setGroupBy(e.target.value)}>
              <option value="total">total</option>
              <option value="model">model</option>
              <option value="day">day</option>
              <option value="model_day">model_day</option>
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={loadPeriod} className="bg-primary text-white px-4 py-2 rounded w-full">加载账期汇总</button>
          </div>
          <div className="flex items-end">
            <button onClick={downloadPeriodCsv} className="border px-4 py-2 rounded w-full">下载 CSV</button>
          </div>
        </div>
        {period && (
          <div className="text-sm text-gray-700 space-y-1">
            <div>用量金额：{period.usage_amount_cents}¢；代币：{period.usage_tokens}</div>
            <div>充值：{period.topup_cents}¢；退款：{period.refunds_cents}¢；净充值：{period.net_topup_cents}¢</div>
            <div>余额变动：{period.balance_delta_cents}¢</div>
            {period.groups && (
              <div className="overflow-auto">
                <table className="min-w-full border mt-3">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      {groupBy === 'model' && (<><th className="p-2 border">model</th><th className="p-2 border">usage_amount_cents</th><th className="p-2 border">usage_tokens</th></>)}
                      {groupBy === 'day' && (<><th className="p-2 border">date</th><th className="p-2 border">usage_amount_cents</th><th className="p-2 border">usage_tokens</th></>)}
                      {groupBy === 'model_day' && (<><th className="p-2 border">date</th><th className="p-2 border">model</th><th className="p-2 border">usage_amount_cents</th><th className="p-2 border">usage_tokens</th></>)}
                    </tr>
                  </thead>
                  <tbody>
                    {period.groups.map((g, i) => (
                      <tr key={i} className="odd:bg-white even:bg-gray-50">
                        {groupBy === 'model' && (<><td className="p-2 border">{g.model}</td><td className="p-2 border">{g.usage_amount_cents}</td><td className="p-2 border">{g.usage_tokens}</td></>)}
                        {groupBy === 'day' && (<><td className="p-2 border">{g.date}</td><td className="p-2 border">{g.usage_amount_cents}</td><td className="p-2 border">{g.usage_tokens}</td></>)}
                        {groupBy === 'model_day' && (<><td className="p-2 border">{g.date}</td><td className="p-2 border">{g.model}</td><td className="p-2 border">{g.usage_amount_cents}</td><td className="p-2 border">{g.usage_tokens}</td></>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded shadow p-6 space-y-4">
        <div className="font-semibold">每日汇总（daily）</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">date</label>
            <input className="w-full border rounded px-3 py-2" value={dailyDate} onChange={e => setDailyDate(e.target.value)} />
          </div>
          <div className="flex items-end">
            <button onClick={loadDaily} className="border px-4 py-2 rounded w-full">加载 daily</button>
          </div>
        </div>
        {daily && (
          <div className="text-sm text-gray-700">金额：{daily.amount_cents}¢，代币：{daily.total_tokens}</div>
        )}
      </div>

      <div className="bg-white rounded shadow p-6 space-y-4">
        <div className="font-semibold">近 N 日汇总（summary）</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">days</label>
            <input className="w-full border rounded px-3 py-2" value={sumDays} onChange={e => setSumDays(e.target.value)} />
          </div>
          <div className="flex items-end">
            <button onClick={loadSummary} className="border px-4 py-2 rounded w-full">加载 summary</button>
          </div>
        </div>
        {summary && (
          <div className="overflow-auto">
            <table className="min-w-full border text-sm">
              <thead className="bg-gray-100">
                <tr><th className="p-2 border">date</th><th className="p-2 border">amount_cents</th><th className="p-2 border">total_tokens</th></tr>
              </thead>
              <tbody>
                {(summary.daily || []).map((d, i) => (
                  <tr key={i} className="odd:bg-white even:bg-gray-50">
                    <td className="p-2 border">{d.date}</td>
                    <td className="p-2 border">{d.amount_cents}</td>
                    <td className="p-2 border">{d.total_tokens}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded shadow p-6 space-y-4">
        <div className="font-semibold">透支/溢出事件（overdraft）</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">days</label>
            <input className="w-full border rounded px-3 py-2" value={odDays} onChange={e => setOdDays(e.target.value)} />
          </div>
          <div className="flex items-end">
            <button onClick={loadOverdraft} className="border px-4 py-2 rounded w-full">加载 overdraft</button>
          </div>
        </div>
        {overdraft && (
          <div className="overflow-auto">
            <table className="min-w-full border text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">created_at</th>
                  <th className="p-2 border">model</th>
                  <th className="p-2 border">request_id</th>
                  <th className="p-2 border">overflow_policy</th>
                  <th className="p-2 border">final_amount_cents</th>
                  <th className="p-2 border">charged_amount_cents</th>
                  <th className="p-2 border">remaining_before_cents</th>
                </tr>
              </thead>
              <tbody>
                {(overdraft.overdrafts || []).map((r, i) => (
                  <tr key={i} className="odd:bg-white even:bg-gray-50">
                    <td className="p-2 border">{r.created_at}</td>
                    <td className="p-2 border">{r.model}</td>
                    <td className="p-2 border">{r.request_id}</td>
                    <td className="p-2 border">{r.overflow_policy}</td>
                    <td className="p-2 border">{r.final_amount_cents}</td>
                    <td className="p-2 border">{r.charged_amount_cents}</td>
                    <td className="p-2 border">{r.remaining_before_cents}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
