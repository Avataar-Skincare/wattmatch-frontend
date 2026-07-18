import Reveal from './Reveal';
import { teamMembers } from '../data/content';

export default function Team() {
  return (
    <section id="team">
      <div className="wrap">
        <Reveal className="sec-head">
          <span className="eyebrow">Who's building this</span>
          <h2>A founding team built for exactly this platform</h2>
          <p>Institutional trust, energy-sector depth, and hands-on platform execution.</p>
        </Reveal>
        <div className="team-grid">
          {teamMembers.map((m) => (
            <Reveal className={`team-card${m.lead ? ' lead' : ''}`} key={m.name}>
              {m.photo && <img className="team-photo" src={m.photo} alt={m.name} />}
              <div className="team-card-body">
                {!m.photo && <div className="avatar">{m.initials}</div>}
                <h3>{m.name}</h3>
                <div className="role">{m.role}</div>
                <div className="bg">{m.bg}</div>
                <div className="why-label">WHY THIS FITS</div>
                <p className="why">{m.why}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <p className="team-note">Roles and titles above are working designations pending final confirmation.</p>
      </div>
    </section>
  );
}
