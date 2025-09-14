import React, { useState } from 'react'
import { addPriceRuleToPlan } from '../../utils/api'
import Container from '../../primer/Container'
import Button from '../../primer/Button'
import Card from '../../primer/Card'

export default function PlanPriceRule() {
  const [planId, setPlanId] = useState('')
  const [modelPattern, setModelPattern] = useState('gpt-*')
  const [unit, setUnit] = useState('token')
  const [base, setBase] = useState('1')
  const [inMul, setInMul] = useState('1')
  const [outMul, setOutMul] = useState('1')
  const [priceMul, setPriceMul] = useState('1')
  const [minCharge, setMinCharge] = useState('0')
  const [msg, setMsg] = useState('')
  const onAdd = async () => {
    setMsg('')
    try {
      await addPriceRuleToPlan({
        planId: Number(planId), modelPattern, unit, unitBasePriceCents: Number(base),
        inputMultiplier: Number(inMul), outputMultiplier: Number(outMul), priceMultiplier: Number(priceMul),
        minChargeCents: Number(minCharge)
      })
      setMsg('已添加')
    } catch (e) { setMsg(String(e)) }
  }
  return (
    <Container size="lg">
      {/* 标题移除 */}
      <div className="mt-6 space-y-4">
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            <input className="border rounded px-3 py-2" value={planId} onChange={e=>setPlanId(e.target.value)} placeholder="plan_id" />
            <input className="border rounded px-3 py-2" value={modelPattern} onChange={e=>setModelPattern(e.target.value)} placeholder="model_pattern" />
            <select className="border rounded px-3 py-2" value={unit} onChange={e=>setUnit(e.target.value)}>
              <option value="token">token</option><option value="request">request</option><option value="minute">minute</option><option value="image">image</option>
            </select>
            <input className="border rounded px-3 py-2" value={base} onChange={e=>setBase(e.target.value)} placeholder="base cents" />
            <input className="border rounded px-3 py-2" value={inMul} onChange={e=>setInMul(e.target.value)} placeholder="input mul" />
            <input className="border rounded px-3 py-2" value={outMul} onChange={e=>setOutMul(e.target.value)} placeholder="output mul" />
            <input className="border rounded px-3 py-2" value={priceMul} onChange={e=>setPriceMul(e.target.value)} placeholder="price mul" />
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
            <input className="border rounded px-3 py-2" value={minCharge} onChange={e=>setMinCharge(e.target.value)} placeholder="min charge cents" />
            <Button onClick={onAdd} color="blue">添加规则</Button>
            {msg && <div className="text-sm text-gray-700">{msg}</div>}
          </div>
        </Card>
      </div>
    </Container>
  )
}
