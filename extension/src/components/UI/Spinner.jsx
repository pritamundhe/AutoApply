import React from 'react'

export default function Spinner({ size = 'md', className = '' }) {
  const sizeMap = {
    xs:  'w-3 h-3 border',
    sm:  'w-5 h-5 border-2',
    md:  'w-8 h-8 border-2',
    lg:  'w-12 h-12 border-[3px]',
    xl:  'w-16 h-16 border-4',
  }
  return (
    <div
      className={`${sizeMap[size] ?? sizeMap.md} rounded-full border-purple-500/25 border-t-purple-500 animate-spin ${className}`}
    />
  )
}
