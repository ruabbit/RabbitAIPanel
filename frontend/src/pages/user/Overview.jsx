import React, { useEffect, useState } from 'react'
import { getBudget, getDailyReport, getSummaryReport, getOverdraftReport, getPeriod } from '../../utils/api'
import Container from '../../primer/Container'
import { currentUserId } from '../../utils/dev'

export default function Overview() {
  const [userId, setUserId] = useState(currentUserId('1'))
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  // 生产视图不提供用户ID修改入口（移除高级切换）
  // ---- 新增各模块状态
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0,10))
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); d.setDate(d.getDate()-6); return d.toISOString().slice(0,10) })
  const [period, setPeriod] = useState(null)
  const [periodLoading, setPeriodLoading] = useState(false)
  const [periodErr, setPeriodErr] = useState('')
  const [daily, setDaily] = useState(null)
  const [dailyLoading, setDailyLoading] = useState(false)
  const [dailyErr, setDailyErr] = useState('')
  const [sumDays, setSumDays] = useState(7)
  const [summary, setSummary] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryErr, setSummaryErr] = useState('')
  const [odDays, setOdDays] = useState(7)
  const [overdraft, setOverdraft] = useState(null)
  const [overdraftLoading, setOverdraftLoading] = useState(false)
  const [overdraftErr, setOverdraftErr] = useState('')

  const load = async (overrideUid) => {
    setLoading(true); setErr('')
    const uid = (overrideUid ?? userId)
    try { const res = await getBudget(uid); setData(res) } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }

  const loadPeriod = async (overrideUid) => {
    setPeriodLoading(true); setPeriodErr('')
    const uid = (overrideUid ?? userId)
    try { const res = await getPeriod({ userId: uid, dateFrom, dateTo, groupBy: 'total' }); setPeriod(res) } catch (e) { setPeriodErr(String(e)) } finally { setPeriodLoading(false) }
  }

  const loadDaily = async (overrideUid) => {
    setDailyLoading(true); setDailyErr('')
    const uid = (overrideUid ?? userId)
    try { const res = await getDailyReport({ userId: uid, date: dateTo }); setDaily(res) } catch (e) { setDailyErr(String(e)) } finally { setDailyLoading(false) }
  }

  const loadSummary = async (overrideUid) => {
    setSummaryLoading(true); setSummaryErr('')
    const uid = (overrideUid ?? userId)
    try { const res = await getSummaryReport({ userId: uid, days: Number(sumDays) }); setSummary(res) } catch (e) { setSummaryErr(String(e)) } finally { setSummaryLoading(false) }
  }

  const loadOverdraft = async (overrideUid) => {
    setOverdraftLoading(true); setOverdraftErr('')
    const uid = (overrideUid ?? userId)
    try { const res = await getOverdraftReport({ userId: uid, days: Number(odDays) }); setOverdraft(res) } catch (e) { setOverdraftErr(String(e)) } finally { setOverdraftLoading(false) }
  }

  const loadAll = (overrideUid) => {
    load(overrideUid)
    loadPeriod(overrideUid)
    loadDaily(overrideUid)
    loadSummary(overrideUid)
    loadOverdraft(overrideUid)
  }

  useEffect(() => {
    // 初始自动加载
    loadAll()
    // 监听配置保存/窗口聚焦后同步 userId 并自动刷新
    const syncAndLoad = () => {
      const uid = currentUserId('1')
      if (uid !== userId) setUserId(uid)
      // 无论是否变化，都尝试刷新一次，保持数据最新
      loadAll(uid)
    }
    window.addEventListener('rr:settings-saved', syncAndLoad)
    window.addEventListener('focus', syncAndLoad)
    return () => {
      window.removeEventListener('rr:settings-saved', syncAndLoad)
      window.removeEventListener('focus', syncAndLoad)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const percent = () => {
    if (!data?.daily_limit) return 0
    const dl = data.daily_limit
    const used = dl.spent_today_cents || 0
    const total = dl.daily_limit_cents || 1
    return Math.min(100, Math.round((used / total) * 100))
  }

  return (
    <Container>
      {/* 标题移除：面板左侧已有导航，不再重复显示章节标题 */}
      {/* 生产视图不展示用户ID与手动刷新控件，默认自动加载与刷新 */}
      {loading && <div className="text-sm text-gray-500">加载中…</div>}
      {err && <div className="text-sm text-red-600">{err}</div>}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
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

      {/* Period (last 7 days), Daily (today), Overdraft (7 days) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div className="bg-white rounded shadow p-5">
          <div className="font-semibold mb-2">账期汇总（{dateFrom} ~ {dateTo}）</div>
          {periodLoading && <div className="text-sm text-gray-500">加载中…</div>}
          {periodErr && <div className="text-sm text-red-600">{periodErr}</div>}
          {period && (
            <ul className="text-sm text-gray-700 space-y-1">
              <li>用量金额：{period.usage_amount_cents}¢；代币：{period.usage_tokens}</li>
              <li>充值：{period.topup_cents}¢；退款：{period.refunds_cents}¢；净充值：{period.net_topup_cents}¢</li>
              <li>余额变动：{period.balance_delta_cents}¢</li>
            </ul>
          )}
        </div>
        <div className="bg-white rounded shadow p-5">
          <div className="font-semibold mb-2">今日汇总（{dateTo}）</div>
          {dailyLoading && <div className="text-sm text-gray-500">加载中…</div>}
          {dailyErr && <div className="text-sm text-red-600">{dailyErr}</div>}
          {daily && (
            <div className="text-sm text-gray-700">金额：{daily.amount_cents}¢，代币：{daily.total_tokens}</div>
          )}
        </div>
        <div className="bg-white rounded shadow p-5">
          <div className="font-semibold mb-2">近 {sumDays} 日透支/溢出</div>
          {overdraftLoading && <div className="text-sm text-gray-500">加载中…</div>}
          {overdraftErr && <div className="text-sm text-red-600">{overdraftErr}</div>}
          {overdraft && (
            <div className="text-sm text-gray-700">事件数：{(overdraft.overdrafts || []).length}</div>
          )}
        </div>
      </div>

      {/* Summary table */}
      {summary && (
        <div className="bg-white rounded shadow p-5 mt-4">
          <div className="font-semibold mb-2">近 {sumDays} 日汇总</div>
          {summaryLoading && <div className="text-sm text-gray-500">加载中…</div>}
          {summaryErr && <div className="text-sm text-red-600">{summaryErr}</div>}
          <div className="rr-table-flow">
            <div className="rr-table-scroll">
              <div className="rr-table-inner">
                <table className="rr-table">
                  <thead>
                    <tr>
                      <th scope="col">date</th>
                      <th scope="col">amount_cents</th>
                      <th scope="col">total_tokens</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(summary.daily || []).map((d, i) => (
                      <tr key={i}>
                        <td>{d.date}</td>
                        <td>{d.amount_cents}</td>
                        <td>{d.total_tokens}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </Container>
  )
}
