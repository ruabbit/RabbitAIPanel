import React, { useState } from 'react'
import { listPriceMappings, createPriceMapping, updatePriceMapping, deletePriceMapping } from '../../utils/api'
import Container from '../../primer/Container'
import Button from '../../primer/Button'
import Select from '../../components/Select'
import Card from '../../primer/Card'

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
    <Container size="lg">
      {/* 标题移除 */}
      <div className="mt-6 space-y-4">
        <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="rr-label" htmlFor="pm-list-plan">plan_id（列表）</label>
            <input id="pm-list-plan" className="rr-input" value={planId} onChange={e=>setPlanId(e.target.value)} placeholder="plan_id" />
          </div>
          <div className="flex items-end">
            <Button onClick={load} variant="outline" color="blue" className="w-full">加载映射</Button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="rr-label" htmlFor="pm-create-plan">plan_id</label>
            <input id="pm-create-plan" className="rr-input" value={pmPlanId} onChange={e=>setPmPlanId(e.target.value)} placeholder="plan_id" />
          </div>
          <div>
            <label className="rr-label" htmlFor="pm-create-currency">currency</label>
            <input id="pm-create-currency" className="rr-input" value={pmCurrency} onChange={e=>setPmCurrency(e.target.value)} placeholder="USD" />
          </div>
          <div>
            <label className="rr-label" htmlFor="pm-create-price">stripe_price_id</label>
            <input id="pm-create-price" className="rr-input" value={pmPriceId} onChange={e=>setPmPriceId(e.target.value)} placeholder="price_xxx" />
          </div>
          <div>
            <label className="rr-label" htmlFor="pm-create-active">active</label>
            <Select id="pm-create-active" value={pmActive ? '1':'0'} onChange={v=>setPmActive(String(v)==='1')} options={[{value:'1',label:'active'},{value:'0',label:'inactive'}]} placeholder="选择状态" />
          </div>
          <div className="flex items-end">
            <Button onClick={create} color="blue" className="w-full">创建</Button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="rr-label" htmlFor="pm-id">mapping_id</label>
            <input id="pm-id" className="rr-input" value={pmMappingId} onChange={e=>setPmMappingId(e.target.value)} placeholder="mapping_id" />
          </div>
          <div className="flex items-end">
            <Button onClick={update} variant="outline" color="blue" className="w-full">更新</Button>
          </div>
          <div className="flex items-end">
            <Button onClick={del} variant="outline" color="blue" className="w-full">删除</Button>
          </div>
        </div>
        {mappings && mappings.length > 0 && (
          <div className="rr-table-flow mt-4">
            <div className="rr-table-scroll">
              <div className="rr-table-inner">
                <table className="rr-table">
                  <thead>
                    <tr>
                      <th scope="col">id</th>
                      <th scope="col">plan_id</th>
                      <th scope="col">currency</th>
                      <th scope="col">stripe_price_id</th>
                      <th scope="col">active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mappings.map(m => (
                      <tr key={m.id}>
                        <td>{m.id}</td>
                        <td>{m.plan_id}</td>
                        <td>{m.currency}</td>
                        <td>{m.stripe_price_id}</td>
                        <td>{String(m.active)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {msg && <div className="mt-3 text-sm text-gray-700">{msg}</div>}
        </Card>
      </div>
    </Container>
  )
}
// 弃用说明：
// 本页面属于旧版“价格映射”入口，已由新版计划详情页的 Pricing 选项卡整合管理（/admin/plans/:planId）。
// 该文件仅在过渡期间保留以便回退，请优先在新版页面操作。
