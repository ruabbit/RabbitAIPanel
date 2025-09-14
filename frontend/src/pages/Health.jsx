import React from 'react'
import Container from '../primer/Container'
import { currentApiBase } from '../utils/api'
import { isDebug } from '../utils/dev'

export default function Health() {
  const envApi = import.meta?.env?.VITE_API_BASE || ''
  const envDebug = import.meta?.env?.VITE_DEBUG
  const resolvedBase = currentApiBase()
  const lsBase = typeof window !== 'undefined' ? (localStorage.getItem('api_base') || '') : ''
  const mode = import.meta?.env?.MODE || ''
  const dev = !!import.meta?.env?.DEV
  const prod = !!import.meta?.env?.PROD

  return (
    <Container size="md">
      <div className="py-10">
        <h1 className="text-2xl font-bold text-gray-900">Frontend Health</h1>
        <p className="mt-2 text-sm text-gray-600">当前前端运行时配置快照（仅展示基本信息）。</p>
        <div className="mt-6 rounded-lg bg-white ring-1 ring-gray-200 p-5 text-sm text-gray-800">
          <div className="grid grid-cols-1 gap-3">
            <div><span className="text-gray-500">Debug mode:</span> <span className="ml-2 font-mono">{String(isDebug())}</span></div>
            <div><span className="text-gray-500">Env VITE_DEBUG:</span> <span className="ml-2 font-mono">{String(envDebug ?? '')}</span></div>
            <div><span className="text-gray-500">Env VITE_API_BASE:</span> <span className="ml-2 font-mono break-all">{envApi || '(empty)'}</span></div>
            <div><span className="text-gray-500">Resolved API Base:</span> <span className="ml-2 font-mono break-all">{resolvedBase || '(empty)'}</span></div>
            <div><span className="text-gray-500">localStorage.api_base:</span> <span className="ml-2 font-mono break-all">{lsBase || '(empty)'}</span></div>
            <div><span className="text-gray-500">Mode:</span> <span className="ml-2 font-mono">{mode} (DEV={String(dev)} PROD={String(prod)})</span></div>
            <div><span className="text-gray-500">Timestamp:</span> <span className="ml-2 font-mono">{new Date().toISOString()}</span></div>
          </div>
        </div>
      </div>
    </Container>
  )
}

