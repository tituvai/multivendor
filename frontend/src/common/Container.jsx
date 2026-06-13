

const Container = ({children, className=""}) => {
  return (
    <div className={`max-w-350 flex justify-between mx-auto ${className}`}>{children}</div>
  )
}

export default Container