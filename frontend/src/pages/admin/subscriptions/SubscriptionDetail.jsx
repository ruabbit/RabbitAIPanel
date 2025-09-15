import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Container from '../../../primer/Container'
import Card from '../../../primer/Card'
import Button from '../../../primer/Button'
import Select from '../../../components/Select'
import { getSubscription, updateSubscriptionStatus } from '../../../utils/api'

export default function SubscriptionDetail() {
  const { subscriptionId } = useParams()
  const [sub, setSub] = useState(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [status, setStatus] = useState('active')

  const load = async () => {
    if (!subscriptionId) return
    setLoading(true); setMsg('')
    try {
      const res = await getSubscription(subscriptionId)
      setSub(res.subscription || null)
      setStatus((res.subscription?.status) || 'active')
    } catch (e) { setMsg(String(e)) } finally { setLoading(false) }
  }

  useEffect(()=>{ load() }, [subscriptionId])

  const onSave = async () => {
    setMsg('')
    try {
      if (!subscriptionId) throw new Error('subscription_id 为空')
      const r = await updateSubscriptionStatus({ subscriptionId, status })
      setMsg('已保存')
      setSub(r.subscription || sub)
    } catch (e) { setMsg(String(e)) }
  }

  return (
    <Container size="lg">
      <div className="mt-6 space-y-4">
        <div className="text-xl font-semibold text-gray-800">订阅详情</div>
        {loading && <div className="text-sm text-gray-500">加载中…</div>}
        {msg && <div className="text-sm text-gray-700">{msg}</div>}
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <div className="rr-label">subscription_id</div>
              <div className="text-sm font-mono">{subscriptionId}</div>
            </div>
            <div>
              <div className="rr-label">customer_id</div>
              <div className="text-sm font-mono">{sub?.customer_id || '-'}</div>
            </div>
            <div>
              <div className="rr-label">plan_id</div>
              <div className="text-sm font-mono">{sub?.plan_id || '-'}</div>
            </div>
            <div>
              <label className="rr-label" htmlFor="s-status">status</label>
              <Select id="s-status" value={status} onChange={v=>setStatus(String(v))} options={[{value:'active',label:'active'},{value:'paused',label:'paused'},{value:'canceled',label:'canceled'}]} />
            </div>
          </div>
          <div className="mt-4">
            <Button color="blue" onClick={onSave}>保存</Button>
          </div>
        </Card>
        <Card>
          <div className="font-semibold mb-2">原始数据</div>
          <pre className="text-xs bg-gray-50 border rounded p-3 overflow-auto">{JSON.stringify(sub, null, 2)}</pre>
        </Card>
      </div>
    </Container>
  )
}

