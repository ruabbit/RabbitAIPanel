import React from 'react'
import Sidebar from '../../components/Sidebar'
import { useUI } from '../../context/UIContext'

export default function UserLayout({ children }) {
  const { sidebarOpen, setSidebarOpen } = useUI()
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
    <div className={`grid grid-cols-1 ${sidebarOpen ? 'md:grid-cols-[16rem_1fr]' : 'md:grid-cols-1'} gap-0 min-h-full`}>
      <Sidebar items={items} title="用户后台" open={sidebarOpen} onClose={()=>setSidebarOpen(false)} />
      <div className="p-4 md:p-6">{children}</div>
    </div>
  )
}
