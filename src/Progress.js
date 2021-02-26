import './progress.css'

export default function Progress({ value = 0 }) {
  return (
    <div className="progress">
      <div className="progress-bar" style={{ width: `${value * 100}%` }}></div>
    </div>
  )
}
