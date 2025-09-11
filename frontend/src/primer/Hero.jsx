import React from 'react'
import Button from './Button'
import GridPattern from './GridPattern'
import StarRating from './StarRating'

function Testimonial() {
  return (
    <figure className="relative mx-auto max-w-md text-center lg:mx-0 lg:text-left">
      <div className="flex justify-center text-blue-600 lg:justify-start">
        <StarRating />
      </div>
      <blockquote className="mt-2">
        <p className="font-display text-xl font-medium text-slate-900">
          “官方原版安装包 + 仅网络优化，体验和直连官网一模一样。
          海外网络也稳定很多，团队协作顺畅了。”
        </p>
      </blockquote>
      <figcaption className="mt-2 text-sm text-slate-500">
        <strong className="font-semibold text-blue-600 before:content-['—_']">叶峻</strong>，后端工程师
      </figcaption>
    </figure>
  )
}

export default function Hero() {
  return (
    <header className="overflow-hidden bg-slate-100 lg:bg-transparent lg:px-5">
      <div className="mx-auto grid max-w-6xl grid-cols-1 grid-rows-[auto_1fr] gap-y-16 pt-16 md:pt-20 lg:grid-cols-12 lg:gap-y-20 lg:px-3 lg:pt-20 lg:pb-36 xl:py-32">
        <div className="relative flex items-end lg:col-span-5 lg:row-span-2">
          <div className="absolute -top-20 right-1/2 -bottom-12 left-0 z-10 rounded-br-6xl bg-blue-600 text-white/10 md:bottom-8 lg:-inset-y-32 lg:right-full lg:left-[-100vw] lg:-mr-40">
            <GridPattern x="100%" y="100%" />
          </div>
          <div className="relative z-10 mx-auto w-64 aspect-[3/4] rounded-xl bg-slate-600 shadow-xl md:w-80 lg:w-auto" />
        </div>
        <div className="relative px-4 sm:px-6 lg:col-span-7 lg:pr-0 lg:pb-14 lg:pl-16 xl:pl-20">
          <div className="hidden lg:absolute lg:-top-32 lg:right-[-100vw] lg:bottom-0 lg:left-[-100vw] lg:block lg:bg-slate-100" />
          <Testimonial />
        </div>
        <div className="bg-white pt-16 lg:col-span-7 lg:bg-transparent lg:pt-0 lg:pl-16 xl:pl-20">
          <div className="mx-auto px-4 sm:px-6 md:max-w-2xl md:px-4 lg:px-0">
            <h1 className="font-display text-5xl font-extrabold text-slate-900 sm:text-6xl leading-tight">
              <span className="block">RabbitRelay</span>
              <span className="block">官方体验</span>
              <span className="block">网络更稳更快</span>
            </h1>
            <p className="mt-4 text-2xl sm:text-3xl text-slate-600">
              为用户提供稳定、安全、优惠的 Claude Code、Codex、Gemini CLI、Gork Code 等，使用体验与直连官网完全相同。
              确保使用官方原版安装包，仅优化网络，不做其他任何处理。
            </p>
            <div className="mt-8 flex gap-4">
              <Button href="#free-chapters" color="blue">立即开始</Button>
              <Button href="#pricing" variant="outline" color="blue">了解价格</Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
