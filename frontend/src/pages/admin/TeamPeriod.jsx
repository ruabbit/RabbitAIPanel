import React, { useState } from 'react'
import { getTeamPeriod } from '../../utils/api'
import Container from '../../primer/Container'
import SectionHeading from '../../primer/SectionHeading'
import Button from '../../primer/Button'

export default function TeamPeriod() {
  const [teamId, setTeamId] = useState('1')
  const [dateFrom, setDateFrom] = useState('2025-09-01')
  const [dateTo, setDateTo] = useState('2025-09-03')
  const [groupBy, setGroupBy] = useState('total')
  const [data, setData] = useState(null)
  const [msg, setMsg] = useState('')
  const load = async () => { setMsg(''); try { const res = await getTeamPeriod({ teamId, dateFrom, dateTo, groupBy }); setData(res) } catch(e){ setMsg(String(e)) } }
  return (
    <Container size="lg">
      <SectionHeading number="B5">团队账期</SectionHeading>
      <div className="mt-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input className="border rounded px-3 py-2" value={teamId} onChange={e=>setTeamId(e.target.value)} placeholder="team_id" />
          <input className="border rounded px-3 py-2" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} placeholder="date_from" />
          <input className="border rounded px-3 py-2" value={dateTo} onChange={e=>setDateTo(e.target.value)} placeholder="date_to" />
          <select className="border rounded px-3 py-2" value={groupBy} onChange={e=>setGroupBy(e.target.value)}>
            <option value="total">total</option>
            <option value="model">model</option>
            <option value="day">day</option>
            <option value="model_day">model_day</option>
          </select>
          <Button onClick={load} variant="outline" color="blue">加载</Button>
        </div>
        {data && (<pre className="text-xs bg-gray-50 border rounded p-3 overflow-auto">{JSON.stringify(data, null, 2)}</pre>)}
        {msg && <div className="text-sm text-gray-700">{msg}</div>}
      </div>
    </Container>
  )
}
