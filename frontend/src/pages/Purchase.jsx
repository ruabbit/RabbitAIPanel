import React, { useState } from 'react'
import Container from '../primer/Container'
import Card from '../primer/Card'
import Button from '../primer/Button'
import { currentApiBase } from '../utils/api'
import { isDebug } from '../utils/dev'

export default function Purchase() {
  const [amount, setAmount] = useState('1000') // cents
  const [currency, setCurrency] = useState('USD')
  const [err, setErr] = useState('')
  const debug = isDebug()
  const api = currentApiBase()

  const demoUrl = `${api || ''}/demo/payment_element?api=${encodeURIComponent(api || '')}`

  return (
    <Container size="sm">
      <div className="mt-10 space-y-4">
        <div className="text-xl font-semibold text-gray-800">购买/充值</div>
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="rr-label">金额（分）</label>
              <input className="rr-input" value={amount} onChange={e=>setAmount(e.target.value)} />
            </div>
            <div>
              <label className="rr-label">币种</label>
              <input className="rr-input" value={currency} onChange={e=>setCurrency(e.target.value)} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <a className="inline-flex items-center bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-500" href={demoUrl} target="_blank" rel="noreferrer">在新页面打开支付演示</a>
            {err && <span className="text-sm text-red-600">{err}</span>}
          </div>
          {debug && (
            <div className="text-xs text-gray-600 mt-3">仅演示（Debug）：此页面使用后端自带 Payment Element 演示页打开新窗口进行 Stripe 支付体验。若未配置 Stripe，将无法实际支付。</div>
          )}
        </Card>
      </div>
    </Container>
  )}

