import React from 'react'
import Sidebar from '../../components/Sidebar'

export default function UserLayout({ children }) {
  const items = [
    { label: '概览', to: '/dashboard/overview' },
    { label: '账期汇总', to: '/dashboard/period' },
    { label: '每日汇总', to: '/dashboard/daily' },
    { label: '近N日汇总', to: '/dashboard/summary' },
    { label: '透支/溢出', to: '/dashboard/overdraft' },
    { label: '钱包', to: '/dashboard/wallets' },
    { label: '流水', to: '/dashboard/ledger' },
    { label: '代理测试', to: '/dashboard/proxy' },
  ]
  return (
    <div className="min-h-[70vh] grid grid-cols-[16rem_1fr] gap-0">
      <Sidebar items={items} title="用户后台" />
      <div className="p-6">{children}</div>
    </div>
  )
}

