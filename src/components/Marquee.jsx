import marquee from '../data/content/marquee.json'

export default function Marquee() {
  const row = [...marquee.items, ...marquee.items]
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {row.map((item, i) => (
          <span className="marquee-cell" key={i}>
            <span className="marquee-item">{item}</span>
            <span className="marquee-sep" />
          </span>
        ))}
      </div>
    </div>
  )
}
