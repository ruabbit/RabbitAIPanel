import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Container from '../primer/Container'
import Card from '../primer/Card'
import Button from '../primer/Button'
import { currentApiBase, getStripePublishableKey, createCheckoutIntent, getWallets, listCustomers, listInvoices } from '../utils/api'
import { isDebug } from '../utils/dev'
import { loadStripe } from '@stripe/stripe-js'

export default function Purchase() {
  const navigate = useNavigate()
  const [amount, setAmount] = useState('1000') // cents
  const [currency, setCurrency] = useState('USD')
  const [err, setErr] = useState('')
  const [info, setInfo] = useState('')
  const [paying, setPaying] = useState(false)
  const [ok, setOk] = useState(false)
  const debug = isDebug()
  const api = currentApiBase()

  const demoUrl = `${api || ''}/demo/payment_element?api=${encodeURIComponent(api || '')}`

  const stripeRef = useRef(null)
  const elementsRef = useRef(null)
  const mountedRef = useRef(false)

  async function setupPayment() {
    setErr(''); setInfo(''); setOk(false)
    try {
      const { publishable_key } = await getStripePublishableKey()
      const stripe = await loadStripe(publishable_key)
      stripeRef.current = stripe
      // Create PI
      const uid = (localStorage.getItem('dev_user_id') || '')
      const intent = await createCheckoutIntent({ userId: uid ? Number(uid) : undefined, amountCents: Number(amount), currency })
      const clientSecret = intent?.payload?.client_secret
      if (!clientSecret) throw new Error('no_client_secret')
      // Elements + Payment Element
      const elements = stripe.elements({ clientSecret })
      elementsRef.current = elements
      const paymentElement = elements.create('payment')
      paymentElement.mount('#payment-element')
      setInfo('支付组件已就绪')
    } catch (e) {
      if (debug) {
        setInfo('演示模式：未接入真实支付，您可以使用演示页体验流程。')
      } else {
        setErr('当前不可用，请稍后再试')
      }
    }
  }

  useEffect(()=>{
    mountedRef.current = true
    setupPayment()
    ;(async () => {
      try {
        const params = new URLSearchParams(window.location.search)
        const cs = params.get('payment_intent_client_secret')
        if (cs) {
          setInfo('正在确认支付状态…')
          const { publishable_key } = await getStripePublishableKey()
          const stripe = await loadStripe(publishable_key)
          const pi = await stripe.retrievePaymentIntent(cs)
          const status = pi?.paymentIntent?.status
          if (status === 'succeeded') {
            setOk(true)
            await refreshPostPayment()
            setTimeout(()=> navigate('/dashboard/wallets'), 1200)
          } else if (status) {
            setErr('支付未完成，请稍后重试')
          }
        }
      } catch {}
    })()
    return ()=>{ mountedRef.current = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function refreshPostPayment() {
    try {
      const uid = localStorage.getItem('dev_user_id')
      if (!uid) return
      const w = await getWallets(Number(uid))
      setInfo(`支付成功。余额（${(w.wallets||[]).map(e=>e.currency+':'+(e.balance_cents||0)).join(', ')}）已更新。`)
      const lc = await listCustomers({ entityType: 'user', entityId: Number(uid), limit: 1, offset: 0 })
      const cust = (lc.customers || [])[0]
      if (cust) {
        const inv = await listInvoices({ customerId: cust.id, limit: 5, offset: 0 })
        // 仅提示已生成账单数（明细用户可去发票页查看）
        const count = (inv.invoices || []).length
        if (count > 0) setInfo(v => v + ` 最近账单条目：${count} 条。`)
      }
    } catch {}
  }

  async function onConfirm() {
    setErr(''); setOk(false); setPaying(true)
    try {
      if (!stripeRef.current || !elementsRef.current) throw new Error('not_ready')
      const stripe = stripeRef.current
      const elements = elementsRef.current
      const returnUrl = `${window.location.origin}/purchase?return=1`
      const { error, paymentIntent } = await stripe.confirmPayment({ elements, confirmParams: { return_url: returnUrl }, redirect: 'if_required' })
      if (error) throw new Error(error.message || '支付失败')
      if (paymentIntent && paymentIntent.status === 'succeeded') {
        setOk(true)
        await refreshPostPayment()
        setTimeout(()=> navigate('/dashboard/wallets'), 1200)
      } else {
        setErr('支付未完成，请稍后重试')
      }
    } catch (e) {
      if (debug) setInfo('演示模式：未接入真实支付，您可以使用演示页体验流程。')
      else setErr('当前不可用，请稍后再试')
    } finally { setPaying(false) }
  }

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
          <div className="mt-4">
            <div id="payment-element" className="border border-gray-200 rounded p-3"></div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Button color="blue" disabled={paying} onClick={onConfirm}>{paying ? '支付中…' : '确认支付'}</Button>
            <a className="inline-flex items-center bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-500" href={demoUrl} target="_blank" rel="noreferrer">在新页面打开支付演示</a>
            {err && <span className="text-sm text-red-600">{err}</span>}
            {ok && <span className="text-sm text-green-700">支付成功</span>}
            {info && <span className="text-sm text-gray-600">{info}</span>}
          </div>
          {debug && (
            <div className="text-xs text-gray-600 mt-3">仅演示（Debug）：此页面使用后端自带 Payment Element 演示页打开新窗口进行 Stripe 支付体验。若未配置 Stripe，将无法实际支付。</div>
          )}
        </Card>
      </div>
    </Container>
  )}
