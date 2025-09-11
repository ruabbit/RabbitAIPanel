import React from 'react'
import Container from './Container'
import SectionHeading from './SectionHeading'

const topics = [
  { t: '下载与安装', d: '获取官方原版安装包，完成首次安装与登录。' },
  { t: '选择产品', d: '选择 Claude Code / Codex / Gemini CLI / Gork Code。' },
  { t: '开启加速', d: '一键启动智能网络优化，线路自动择优。' },
  { t: '更新与回滚', d: '使用官方更新机制，必要时快速回滚版本。' },
]

export default function Screencasts() {
  return (
    <section id="screencasts" className="pt-16 pb-10 sm:pt-20 sm:pb-14 lg:pt-32 lg:pb-16">
      <Container>
        <SectionHeading number="02">演示</SectionHeading>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {topics.map((v) => (
            <div key={v.t} className="rounded-2xl overflow-hidden border border-slate-200 bg-white">
              <div className="aspect-video bg-slate-100 grid place-items-center text-slate-400">Coming soon</div>
              <div className="p-5">
                <div className="font-semibold text-slate-900">{v.t}</div>
                <div className="mt-1 text-sm text-slate-600">{v.d}</div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
