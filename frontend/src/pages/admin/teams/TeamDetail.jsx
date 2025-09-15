import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import Container from '../../../primer/Container'
import Card from '../../../primer/Card'
import Button from '../../../primer/Button'
import Select from '../../../components/Select'
import { getTeam, getTeamPeriod } from '../../../utils/api'

function TabButton({ active, onClick, children }) {
  return (
    <button onClick={onClick} className={(active ? 'border-blue-600 text-blue-700 ' : 'border-transparent text-gray-600 hover:text-gray-800 ') + 'px-3 py-1.5 text-sm border-b-2'}>{children}</button>
  )
}

export default function TeamDetail() {
  const { teamId } = useParams()
  const [tab, setTab] = useState('period')
  const [team, setTeam] = useState(null)
  const [msg, setMsg] = useState('')

  const load = async () => {
    setMsg('')
    try {
      const r = await getTeam(teamId)
      setTeam(r.team || null)
    } catch (e) { setMsg(String(e)) }
  }

  useEffect(()=>{ if (teamId) load() }, [teamId])

  return (
    <Container size="xl">
      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-xl font-semibold text-gray-800">团队详情</div>
          <div className="text-sm text-gray-600">team_id: <span className="font-mono">{teamId}</span></div>
        </div>
        {msg && <div className="text-sm text-red-600">{msg}</div>}
        <div className="border-b">
          <div className="flex gap-3">
            <TabButton active={tab==='period'} onClick={()=>setTab('period')}>账期报告</TabButton>
            <TabButton active={tab==='overview'} onClick={()=>setTab('overview')}>Overview</TabButton>
          </div>
        </div>
        {tab === 'overview' && (
          <Card>
            <div className="text-sm text-gray-700">团队基础信息</div>
            {team ? (
              <pre className="mt-3 text-xs bg-gray-50 border rounded p-3 overflow-auto">{JSON.stringify(team, null, 2)}</pre>
            ) : <div className="text-sm text-gray-500">未加载</div>}
          </Card>
        )}
        {tab === 'period' && <TabPeriod teamId={teamId} />}
      </div>
    </Container>
  )
}

function TabPeriod({ teamId }) {
  const [dateFrom, setDateFrom] = useState('2025-09-01')
  const [dateTo, setDateTo] = useState('2025-09-03')
  const [groupBy, setGroupBy] = useState('total')
  const [data, setData] = useState(null)
  const [msg, setMsg] = useState('')
  const load = async () => { setMsg(''); try { const res = await getTeamPeriod({ teamId, dateFrom, dateTo, groupBy }); setData(res) } catch(e){ setMsg(String(e)) } }
  return (
    <Card>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
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
          <Select id="tp-group-by" value={groupBy} onChange={(v)=>setGroupBy(String(v))}
            options={[{ value: 'total', label: 'total' },{ value: 'model', label: 'model' },{ value: 'day', label: 'day' },{ value: 'model_day', label: 'model_day' }]} />
        </div>
        <div className="flex items-end">
          <Button onClick={load} variant="outline" color="blue" className="w-full">加载</Button>
        </div>
      </div>
      {data && (<pre className="mt-3 text-xs bg-gray-50 border rounded p-3 overflow-auto">{JSON.stringify(data, null, 2)}</pre>)}
      {msg && <div className="mt-3 text-sm text-gray-700">{msg}</div>}
    </Card>
  )
}

