import React, { useState } from 'react'
import { getTeamPeriod } from '../../utils/api'
import Container from '../../primer/Container'
import Button from '../../primer/Button'
import Card from '../../primer/Card'

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
      {/* 标题移除 */}
      <div className="mt-6 space-y-4">
        <Card>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="rr-label" htmlFor="tp-team-id">team_id</label>
            <input id="tp-team-id" className="rr-input" value={teamId} onChange={e=>setTeamId(e.target.value)} placeholder="team_id" />
          </div>
          <div>
            <label className="rr-label" htmlFor="tp-date-from">date_from</label>
            <input id="tp-date-from" className="rr-input" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} placeholder="YYYY-MM-DD" />
          </div>
          <div>
            <label className="rr-label" htmlFor="tp-date-to">date_to</label>
            <input id="tp-date-to" className="rr-input" value={dateTo} onChange={e=>setDateTo(e.target.value)} placeholder="YYYY-MM-DD" />
          </div>
          <div>
            <label className="rr-label" htmlFor="tp-group-by">group_by</label>
            <select id="tp-group-by" className="rr-select" value={groupBy} onChange={e=>setGroupBy(e.target.value)}>
              <option value="total">total</option>
              <option value="model">model</option>
              <option value="day">day</option>
              <option value="model_day">model_day</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button onClick={load} variant="outline" color="blue" className="w-full">加载</Button>
          </div>
        </div>
        {data && (<pre className="mt-3 text-xs bg-gray-50 border rounded p-3 overflow-auto">{JSON.stringify(data, null, 2)}</pre>)}
        {msg && <div className="mt-3 text-sm text-gray-700">{msg}</div>}
        </Card>
      </div>
    </Container>
  )
}
