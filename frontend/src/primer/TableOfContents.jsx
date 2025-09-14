import React from 'react'
import Container from './Container'
import SectionHeading from './SectionHeading'

export default function TableOfContents() {
  const items = [
    { num: '01', title: '功能概览', desc: 'RabbitRelay 的核心价值与适用场景。', href: '#introduction' },
    { num: '02', title: '演示', desc: '安装、选择产品、开启加速、更新回滚。', href: '#screencasts' },
    { num: '03', title: '特性', desc: '官方原版安装包、智能网络优化、安全与隐私。', href: '#resources' },
    { num: '04', title: '价格', desc: '更优惠的网络成本与透明计费。', href: '#pricing' },
    { num: '05', title: '关于我们', desc: '团队与愿景。', href: '#author' },
  ]
  return (
    <section id="table-of-contents" className="pt-16 pb-10 sm:pt-20 sm:pb-14 lg:pt-28 lg:pb-16">
      <Container>
        <SectionHeading number="01">目录</SectionHeading>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((it) => (
            <a key={it.num} href={it.href} className="group rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-md transition-shadow">
              <div className="inline-flex items-center rounded-full px-3 py-1 text-blue-600 ring-1 ring-blue-600/20 ring-inset">
                <span className="font-mono text-sm">{it.num}</span>
                <span className="ml-3 h-3.5 w-px bg-blue-600/20" />
                <span className="ml-3 text-base font-medium tracking-tight group-hover:text-blue-700">{it.title}</span>
              </div>
              <p className="mt-3 text-slate-600">{it.desc}</p>
            </a>
          ))}
        </div>
      </Container>
    </section>
  )
}
