import React, { useState } from 'react'
import { listInvoices, generateInvoice, pushInvoiceToStripe, getInvoice } from '../../utils/api'
import Container from '../../primer/Container'
import Button from '../../primer/Button'
import Card from '../../primer/Card'

export default function Invoices() {
  const [customerId, setCustomerId] = useState('1')
  const [invoices, setInvoices] = useState([])
  const [dateFrom, setDateFrom] = useState('2025-09-01')
  const [dateTo, setDateTo] = useState('2025-09-03')
  const [invoiceId, setInvoiceId] = useState('')
  const [qInvoiceId, setQInvoiceId] = useState('')
  const [detail, setDetail] = useState(null)
  const [msg, setMsg] = useState('')

  const onList = async () => { setMsg(''); try { const res = await listInvoices({ customerId }); setInvoices(res.invoices || []) } catch (e) { setMsg(String(e)) } }
  const onGenerate = async () => { setMsg(''); try { const res = await generateInvoice({ customerId, dateFrom, dateTo }); setInvoiceId(String(res.invoice?.id || '')); setMsg(`生成发票: id=${res.invoice?.id}`) } catch (e) { setMsg(String(e)) } }
  const onPush = async () => { setMsg(''); try { const res = await pushInvoiceToStripe({ invoiceId }); setMsg(`推送成功: stripe_invoice_id=${res.stripe_invoice_id}`) } catch (e) { setMsg(String(e)) } }
  const onQuery = async () => { setMsg(''); try { const res = await getInvoice(Number(qInvoiceId)); setDetail(res.invoice || null) } catch (e) { setMsg(String(e)) } }

  return (
    <Container size="lg">
      {/* 标题移除 */}
      <div className="mt-6 space-y-4">
        <Card>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="rr-label" htmlFor="inv-customer-id">customer_id</label>
            <input id="inv-customer-id" className="rr-input" value={customerId} onChange={e=>setCustomerId(e.target.value)} placeholder="customer_id" />
          </div>
          <div className="flex items-end">
            <Button onClick={onList} variant="outline" color="blue" className="w-full">加载发票</Button>
          </div>
        </div>
        {invoices && invoices.length > 0 && (
          <div className="rr-table-flow">
            <div className="rr-table-scroll">
              <div className="rr-table-inner">
                <table className="rr-table">
                  <thead>
                    <tr>
                      <th scope="col">id</th>
                      <th scope="col">total_amount_cents</th>
                      <th scope="col">currency</th>
                      <th scope="col">status</th>
                      <th scope="col">stripe_invoice_id</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map(inv => (
                      <tr key={inv.id}>
                        <td>{inv.id}</td>
                        <td>{inv.total_amount_cents}</td>
                        <td>{inv.currency}</td>
                        <td>{inv.status}</td>
                        <td>{inv.stripe_invoice_id || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-6 gap-3">
          <div>
            <label className="rr-label" htmlFor="inv-date-from">date_from</label>
            <input id="inv-date-from" className="rr-input" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} placeholder="YYYY-MM-DD" />
          </div>
          <div>
            <label className="rr-label" htmlFor="inv-date-to">date_to</label>
            <input id="inv-date-to" className="rr-input" value={dateTo} onChange={e=>setDateTo(e.target.value)} placeholder="YYYY-MM-DD" />
          </div>
          <div className="flex items-end">
            <Button onClick={onGenerate} color="blue" className="w-full">生成发票</Button>
          </div>
          <div>
            <label className="rr-label" htmlFor="inv-push-id">invoice_id（用于推送）</label>
            <input id="inv-push-id" className="rr-input" value={invoiceId} onChange={e=>setInvoiceId(e.target.value)} placeholder="invoice_id" />
          </div>
          <div className="flex items-end">
            <Button onClick={onPush} variant="outline" color="blue" className="w-full">推送 Stripe</Button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="rr-label" htmlFor="inv-query-id">查询 invoice_id</label>
            <input id="inv-query-id" className="rr-input" value={qInvoiceId} onChange={e=>setQInvoiceId(e.target.value)} placeholder="invoice_id" />
          </div>
          <div className="flex items-end">
            <Button onClick={onQuery} variant="outline" color="blue" className="w-full">查询发票详情</Button>
          </div>
        </div>
        {detail && (<pre className="text-xs bg-gray-50 border rounded p-3 overflow-auto">{JSON.stringify(detail, null, 2)}</pre>)}
        {msg && <div className="mt-3 text-sm text-gray-700">{msg}</div>}
        </Card>
      </div>
    </Container>
  )
}
