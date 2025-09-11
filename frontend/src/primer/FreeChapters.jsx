import React from 'react'
import Container from './Container'
import Button from './Button'
import GridPattern from './GridPattern'

export default function FreeChapters() {
  return (
    <section id="free-chapters" className="py-20">
      <div className="relative">
        <div className="absolute inset-0 mask-[linear-gradient(white,transparent)] text-blue-600/10">
          <GridPattern x="50%" />
        </div>
        <Container className="relative">
          <div className="rounded-3xl bg-white/80 backdrop-blur supports-[backdrop-filter:blur(0)]:bg-white/70 p-8 ring-1 ring-slate-200">
            <h3 className="text-2xl font-extrabold tracking-tight text-slate-900">立即体验 RabbitRelay</h3>
            <p className="mt-2 text-slate-600">使用官方原版安装包，仅优化网络，不做任何其他处理。与直连官网完全一致的使用体验。</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button href="/dashboard" color="blue">进入用户控制台</Button>
              <Button href="/admin" variant="outline" color="blue">进入管理控制台</Button>
            </div>
          </div>
        </Container>
      </div>
    </section>
  )
}
