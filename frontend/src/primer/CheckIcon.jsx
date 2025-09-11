import React from 'react'
import { FiCheck } from 'react-icons/fi'

export default function CheckIcon({ className = '' }) {
  return <FiCheck className={className || 'h-6 w-6 text-blue-600'} />
}

