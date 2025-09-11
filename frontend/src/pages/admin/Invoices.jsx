import React, { useState } from 'react'
import { listInvoices, generateInvoice, pushInvoiceToStripe, getInvoice } from '../../utils/api'
import Container from '../../primer/Container'
import SectionHeading from '../../primer/SectionHeading'
import Button from '../../primer/Button'

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
      <SectionHeading number="B3">发票</SectionHeading>
      <div className="mt-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input className="border rounded px-3 py-2" value={customerId} onChange={e=>setCustomerId(e.target.value)} placeholder="customer_id" />
          <Button onClick={onList} variant="outline" color="blue">加载发票</Button>
        </div>
        {invoices && invoices.length > 0 && (
          <div className="overflow-auto">
            <table className="min-w-full border text-sm">
              <thead className="bg-gray-100"><tr><th className="p-2 border">id</th><th className="p-2 border">total_amount_cents</th><th className="p-2 border">currency</th><th className="p-2 border">status</th><th className="p-2 border">stripe_invoice_id</th></tr></thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id} className="odd:bg-white even:bg-gray-50">
                    <td className="p-2 border">{inv.id}</td>
                    <td className="p-2 border">{inv.total_amount_cents}</td>
                    <td className="p-2 border">{inv.currency}</td>
                    <td className="p-2 border">{inv.status}</td>
                    <td className="p-2 border">{inv.stripe_invoice_id || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <input className="border rounded px-3 py-2" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} placeholder="date_from" />
          <input className="border rounded px-3 py-2" value={dateTo} onChange={e=>setDateTo(e.target.value)} placeholder="date_to" />
          <Button onClick={onGenerate} color="blue">生成发票</Button>
          <input className="border rounded px-3 py-2" value={invoiceId} onChange={e=>setInvoiceId(e.target.value)} placeholder="invoice_id（用于推送）" />
          <Button onClick={onPush} variant="outline" color="blue">推送 Stripe</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input className="border rounded px-3 py-2" value={qInvoiceId} onChange={e=>setQInvoiceId(e.target.value)} placeholder="查询 invoice_id" />
          <Button onClick={onQuery} variant="outline" color="blue">查询发票详情</Button>
        </div>
        {detail && (<pre className="text-xs bg-gray-50 border rounded p-3 overflow-auto">{JSON.stringify(detail, null, 2)}</pre>)}
        {msg && <div className="text-sm text-gray-700">{msg}</div>}
      </div>
    </Container>
  )
}
