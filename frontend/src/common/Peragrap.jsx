import React from 'react'

const Peragrap = ({peraText, className=""}) => {
  return (
    <p className={`text-sm text-stone-600 font-medium ${className}`}>{peraText}</p>
  )
}

export default Peragrap