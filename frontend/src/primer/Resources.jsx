import React from 'react'
import Container from './Container'
import SectionHeading from './SectionHeading'
import { FiZap, FiTrendingDown, FiActivity, FiShield, FiPackage } from 'react-icons/fi'

const cards = [
  { icon: FiPackage, title: '官方原版安装包', desc: '使用官方二进制/安装包，零修改、零注入、零破解。' },
  { icon: FiZap, title: '智能网络优化', desc: '多线路自动择优，异常自动切换，降低丢包与延迟。' },
  { icon: FiActivity, title: '一致的使用体验', desc: '登录、升级、插件与直连官网完全一致。' },
  { icon: FiShield, title: '安全与隐私', desc: '不读取代码、不收集日志、本地优先，最小权限。' },
  { icon: FiTrendingDown, title: '价格更优惠', desc: '更友好的成本结构，开发与团队使用更轻松。' },
]

export default function Resources() {
  return (
    <section id="resources" className="pt-16 pb-10 sm:pt-20 sm:pb-14 lg:pt-32 lg:pb-16">
      <Container>
        <SectionHeading number="03">特性</SectionHeading>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((c) => (
            <div key={c.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-blue-600 text-2xl">
                {React.createElement(c.icon, { className: 'h-7 w-7' })}
              </div>
              <div className="mt-3 font-semibold text-slate-900">{c.title}</div>
              <div className="mt-2 text-slate-600 text-sm">{c.desc}</div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
