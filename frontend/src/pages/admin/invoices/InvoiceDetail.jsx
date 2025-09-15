import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Container from '../../../primer/Container'
import Card from '../../../primer/Card'
import Button from '../../../primer/Button'
import { getInvoice, pushInvoiceToStripe } from '../../../utils/api'

export default function InvoiceDetail() {
  const { invoiceId } = useParams()
  const [inv, setInv] = useState(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const load = async () => {
    if (!invoiceId) return
    setLoading(true); setMsg('')
    try {
      const res = await getInvoice(invoiceId)
      setInv(res.invoice || null)
    } catch (e) { setMsg(String(e)) } finally { setLoading(false) }
  }

  useEffect(()=>{ load() }, [invoiceId])

  return (
    <Container size="lg">
      <div className="mt-6 space-y-4">
        <div className="text-xl font-semibold text-gray-800">发票详情</div>
        {loading && <div className="text-sm text-gray-500">加载中…</div>}
        {msg && <div className="text-sm text-gray-700">{msg}</div>}
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <div className="rr-label">invoice_id</div>
              <div className="text-sm font-mono">{invoiceId}</div>
            </div>
            <div>
              <div className="rr-label">customer_id</div>
              <div className="text-sm font-mono">{inv?.customer_id || '-'}</div>
            </div>
            <div>
              <div className="rr-label">period</div>
              <div className="text-sm font-mono">{inv?.period_start?.slice(0,10)} ~ {inv?.period_end?.slice(0,10)}</div>
            </div>
            <div>
              <div className="rr-label">total_amount_cents</div>
              <div className="text-sm font-mono">{inv?.total_amount_cents}</div>
            </div>
            <div>
              <div className="rr-label">status</div>
              <div className="text-sm font-mono">{inv?.status || '-'}</div>
            </div>
            <div>
              <div className="rr-label">stripe_invoice_id</div>
              <div className="text-sm font-mono">{inv?.stripe_invoice_id || '-'}</div>
            </div>
          </div>
          <div className="mt-4">
            <Button variant="outline" onClick={load}>刷新</Button>
            <Button className="ml-2" color="blue" onClick={async ()=>{ try { setMsg(''); await pushInvoiceToStripe({ invoiceId: Number(invoiceId) }); await load(); setMsg('已推送至 Stripe'); } catch (e) { setMsg(String(e)) } }}>推送至 Stripe</Button>
          </div>
        </Card>
        <Card>
          <div className="font-semibold mb-2">条目</div>
          <div className="rr-table-flow">
            <div className="rr-table-scroll">
              <div className="rr-table-inner">
                <table className="rr-table">
                  <thead>
                    <tr>
                      <th scope="col">id</th>
                      <th scope="col">description</th>
                      <th scope="col">amount_cents</th>
                      <th scope="col">created_at</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inv?.items?.length ? inv.items.map(it => (
                      <tr key={it.id}>
                        <td>{it.id}</td>
                        <td>{it.description}</td>
                        <td>{it.amount_cents}</td>
                        <td>{it.created_at?.slice(0,19).replace('T',' ')}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan={4} className="text-center text-sm text-gray-500">无条目</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="font-semibold mb-2">原始数据</div>
          <pre className="text-xs bg-gray-50 border rounded p-3 overflow-auto">{JSON.stringify(inv, null, 2)}</pre>
        </Card>
      </div>
    </Container>
  )
}

