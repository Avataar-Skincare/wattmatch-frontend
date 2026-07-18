import { heroStats } from '../data/content';

export default function StatStrip() {
  return (
    <div className="stat-strip">
      <div className="wrap">
        {heroStats.map((s) => (
          <span key={s.label}><b>{s.value}</b> {s.label}</span>
        ))}
      </div>
    </div>
  );
}
