import React from 'react'

export default function Footer() {
  return (
    <footer className="border-t bg-white">
      <div className="w-full px-4 py-4 text-sm text-gray-500">
        © {new Date().getFullYear()} Rabbit Panel · Demo
      </div>
    </footer>
  )
}
