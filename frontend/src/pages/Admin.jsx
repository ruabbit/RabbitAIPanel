import React, { useState } from 'react'
import { listSubscriptions, listInvoices, listPriceMappings, generateInvoice, pushInvoiceToStripe } from '../utils/api'

export default function Admin() {
  const [customerId, setCustomerId] = useState('1')
  const [planId, setPlanId] = useState('')
  const [subs, setSubs] = useState([])
  const [invoices, setInvoices] = useState([])
  const [mappings, setMappings] = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const [dateFrom, setDateFrom] = useState('2025-09-01')
  const [dateTo, setDateTo] = useState('2025-09-03')
  const [invoiceId, setInvoiceId] = useState('')

  const loadSubs = async () => {
    setLoading(true); setErr('')
    try { const res = await listSubscriptions({ customerId, planId }); setSubs(res.subscriptions || []) } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }
  const loadInvoices = async () => {
    setLoading(true); setErr('')
    try { const res = await listInvoices({ customerId }); setInvoices(res.invoices || []) } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }
  const loadMappings = async () => {
    setLoading(true); setErr('')
    try { const res = await listPriceMappings({ planId }); setMappings(res.mappings || []) } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }
  const onGenerateInvoice = async () => {
    setLoading(true); setErr('')
    try { const res = await generateInvoice({ customerId, dateFrom, dateTo }); alert(`生成成功: invoice_id=${res.invoice?.id}`) } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }
  const onPushInvoice = async () => {
    setLoading(true); setErr('')
    try { const res = await pushInvoiceToStripe({ invoiceId }); alert(`推送成功: stripe_invoice_id=${res.stripe_invoice_id}`) } catch (e) { setErr(String(e)) } finally { setLoading(false) }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">管理后台</h2>

      <div className="bg-white rounded shadow p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">customer_id</label>
            <input className="w-full border rounded px-3 py-2" value={customerId} onChange={e => setCustomerId(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">plan_id</label>
            <input className="w-full border rounded px-3 py-2" value={planId} onChange={e => setPlanId(e.target.value)} placeholder="可空" />
          </div>
          <div className="flex items-end">
            <button onClick={loadSubs} className="bg-primary text-white px-4 py-2 rounded w-full">加载订阅</button>
          </div>
          <div className="flex items-end">
            <button onClick={loadInvoices} className="border px-4 py-2 rounded w-full">加载发票</button>
          </div>
        </div>
        {loading && <div className="text-sm text-gray-500">加载中…</div>}
        {err && <div className="text-sm text-red-600">{err}</div>}

        {!!subs.length && (
          <div>
            <div className="font-semibold mb-2">订阅</div>
            <div className="overflow-auto">
              <table className="min-w-full border text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 border">id</th>
                    <th className="p-2 border">customer_id</th>
                    <th className="p-2 border">plan_id</th>
                    <th className="p-2 border">status</th>
                    <th className="p-2 border">stripe_subscription_id</th>
                    <th className="p-2 border">created_at</th>
                  </tr>
                </thead>
                <tbody>
                  {subs.map(s => (
                    <tr key={s.id} className="odd:bg-white even:bg-gray-50">
                      <td className="p-2 border">{s.id}</td>
                      <td className="p-2 border">{s.customer_id}</td>
                      <td className="p-2 border">{s.plan_id}</td>
                      <td className="p-2 border">{s.status}</td>
                      <td className="p-2 border">{s.stripe_subscription_id}</td>
                      <td className="p-2 border">{s.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!!invoices.length && (
          <div>
            <div className="font-semibold mb-2">发票</div>
            <div className="overflow-auto">
              <table className="min-w-full border text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 border">id</th>
                    <th className="p-2 border">customer_id</th>
                    <th className="p-2 border">total_amount_cents</th>
                    <th className="p-2 border">currency</th>
                    <th className="p-2 border">status</th>
                    <th className="p-2 border">stripe_invoice_id</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(inv => (
                    <tr key={inv.id} className="odd:bg-white even:bg-gray-50">
                      <td className="p-2 border">{inv.id}</td>
                      <td className="p-2 border">{inv.customer_id}</td>
                      <td className="p-2 border">{inv.total_amount_cents}</td>
                      <td className="p-2 border">{inv.currency}</td>
                      <td className="p-2 border">{inv.status}</td>
                      <td className="p-2 border">{inv.stripe_invoice_id || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="border rounded p-4">
          <div className="font-semibold mb-3">价格映射</div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">plan_id</label>
              <input className="w-full border rounded px-3 py-2" value={planId} onChange={e => setPlanId(e.target.value)} />
            </div>
            <div className="flex items-end">
              <button onClick={loadMappings} className="border px-4 py-2 rounded w-full">加载映射</button>
            </div>
          </div>
          {!!mappings.length && (
            <div className="overflow-auto">
              <table className="min-w-full border text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 border">id</th>
                    <th className="p-2 border">plan_id</th>
                    <th className="p-2 border">currency</th>
                    <th className="p-2 border">stripe_price_id</th>
                    <th className="p-2 border">active</th>
                  </tr>
                </thead>
                <tbody>
                  {mappings.map(m => (
                    <tr key={m.id} className="odd:bg-white even:bg-gray-50">
                      <td className="p-2 border">{m.id}</td>
                      <td className="p-2 border">{m.plan_id}</td>
                      <td className="p-2 border">{m.currency}</td>
                      <td className="p-2 border">{m.stripe_price_id}</td>
                      <td className="p-2 border">{String(m.active)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="border rounded p-4">
          <div className="font-semibold mb-3">生成/推送发票</div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">customer_id</label>
              <input className="w-full border rounded px-3 py-2" value={customerId} onChange={e => setCustomerId(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">date_from</label>
              <input className="w-full border rounded px-3 py-2" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">date_to</label>
              <input className="w-full border rounded px-3 py-2" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
            <div className="flex items-end">
              <button onClick={onGenerateInvoice} className="bg-primary text-white px-4 py-2 rounded w-full">生成发票</button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">invoice_id</label>
              <input className="w-full border rounded px-3 py-2" value={invoiceId} onChange={e => setInvoiceId(e.target.value)} />
            </div>
            <div className="flex items-end">
              <button onClick={onPushInvoice} className="border px-4 py-2 rounded w-full">推送至 Stripe</button>
            </div>
          </div>
        </div>

        {err && <div className="text-sm text-red-600">{err}</div>}
      </div>
    </div>
  )
}
