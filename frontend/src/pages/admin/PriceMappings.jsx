import React, { useState } from 'react'
import { listPriceMappings, createPriceMapping, updatePriceMapping, deletePriceMapping } from '../../utils/api'

export default function PriceMappings() {
  const [planId, setPlanId] = useState('')
  const [mappings, setMappings] = useState([])
  const [pmPlanId, setPmPlanId] = useState('')
  const [pmCurrency, setPmCurrency] = useState('USD')
  const [pmPriceId, setPmPriceId] = useState('price_...')
  const [pmActive, setPmActive] = useState(true)
  const [pmMappingId, setPmMappingId] = useState('')
  const [msg, setMsg] = useState('')

  const load = async () => {
    setMsg('')
    try { const res = await listPriceMappings({ planId }); setMappings(res.mappings || []) } catch (e) { setMsg(String(e)) }
  }
  const create = async () => {
    setMsg('')
    try { await createPriceMapping({ planId: Number(pmPlanId), stripePriceId: pmPriceId, currency: pmCurrency, active: pmActive }); setMsg('已创建'); await load() } catch (e) { setMsg(String(e)) }
  }
  const update = async () => { setMsg(''); try { await updatePriceMapping({ mappingId: Number(pmMappingId), stripePriceId: pmPriceId, currency: pmCurrency, active: pmActive }); setMsg('已更新'); await load() } catch (e) { setMsg(String(e)) } }
  const del = async () => { setMsg(''); try { await deletePriceMapping({ mappingId: Number(pmMappingId) }); setMsg('已删除'); await load() } catch (e) { setMsg(String(e)) } }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input className="border rounded px-3 py-2" value={planId} onChange={e=>setPlanId(e.target.value)} placeholder="plan_id (用于列表)" />
        <button onClick={load} className="border px-4 py-2 rounded">加载映射</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <input className="border rounded px-3 py-2" value={pmPlanId} onChange={e=>setPmPlanId(e.target.value)} placeholder="plan_id" />
        <input className="border rounded px-3 py-2" value={pmCurrency} onChange={e=>setPmCurrency(e.target.value)} placeholder="currency" />
        <input className="border rounded px-3 py-2" value={pmPriceId} onChange={e=>setPmPriceId(e.target.value)} placeholder="stripe_price_id" />
        <select className="border rounded px-3 py-2" value={pmActive ? '1':'0'} onChange={e=>setPmActive(e.target.value==='1')}>
          <option value="1">active</option>
          <option value="0">inactive</option>
        </select>
        <button onClick={create} className="bg-primary text-white px-4 py-2 rounded">创建</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <input className="border rounded px-3 py-2" value={pmMappingId} onChange={e=>setPmMappingId(e.target.value)} placeholder="mapping_id" />
        <button onClick={update} className="border px-4 py-2 rounded">更新</button>
        <button onClick={del} className="border px-4 py-2 rounded">删除</button>
      </div>
      {mappings && mappings.length > 0 && (
        <div className="overflow-auto">
          <table className="min-w-full border text-sm">
            <thead className="bg-gray-100"><tr><th className="p-2 border">id</th><th className="p-2 border">plan_id</th><th className="p-2 border">currency</th><th className="p-2 border">stripe_price_id</th><th className="p-2 border">active</th></tr></thead>
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
      {msg && <div className="text-sm text-gray-700">{msg}</div>}
    </div>
  )
}

