import React from 'react'
import { FiStar } from 'react-icons/fi'

export default function StarRating({ count = 5, className = '' }) {
  return (
    <div className={`inline-flex ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <FiStar key={i} className="h-5 w-5 text-blue-600 fill-blue-600" />
      ))}
    </div>
  )
}

