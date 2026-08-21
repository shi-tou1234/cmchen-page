const ITEMS = [
  'Astro',
  'TypeScript',
  'Python',
  'C/C++',
  'Embedded',
  'PCB Design',
  '嘉立创 EDA',
  'Node.js',
  'Tailwind CSS',
  'SolidWorks',
]

export default function Marquee() {
  const row = [...ITEMS, ...ITEMS]
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
