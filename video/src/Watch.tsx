import React from 'react';
import { c } from './theme';

// El reloj de /historia en versión video: esfera al frente, mecanismo detrás.
// `flip` va de 0 (esfera) a 1 (mecanismo); `gearTurn` gira los engranajes.

const f = (n: number) => n.toFixed(2);
const at = (deg: number, r: number) => {
  const a = (deg * Math.PI) / 180;
  return [100 + r * Math.sin(a), 100 - r * Math.cos(a)] as const;
};

function gearPath(cx: number, cy: number, r: number, teeth: number, depth = 4) {
  const pts: string[] = [];
  const step = 360 / teeth;
  for (let t = 0; t < teeth; t++) {
    for (const [off, rr] of [
      [0, r - depth],
      [step * 0.18, r],
      [step * 0.5, r],
      [step * 0.68, r - depth],
    ] as const) {
      const a = ((t * step + off) * Math.PI) / 180;
      pts.push(`${f(cx + rr * Math.cos(a))},${f(cy + rr * Math.sin(a))}`);
    }
  }
  return `M${pts.join('L')}Z`;
}

const GEARS = [
  { cx: 82, cy: 92, r: 34, teeth: 30, speed: 1 },
  { cx: 128, cy: 70, r: 18, teeth: 16, speed: -1.9 },
  { cx: 126, cy: 124, r: 22, teeth: 20, speed: -1.5 },
  { cx: 92, cy: 140, r: 12, teeth: 12, speed: 2.8 },
].map((g) => ({ ...g, d: gearPath(g.cx, g.cy, g.r, g.teeth) }));

const INDICES = Array.from({ length: 60 }, (_, i) => {
  const hour = i % 5 === 0;
  const [x1, y1] = at(i * 6, hour ? 66 : 72);
  const [x2, y2] = at(i * 6, 77);
  return { x1, y1, x2, y2, hour, major: i % 15 === 0 };
});

interface Props {
  size: number;
  hour: number; // grados
  minute: number;
  second: number;
  flip?: number;
  gearTurn?: number;
}

const Case: React.FC<{ id: string }> = ({ id }) => (
  <>
    <circle cx="100" cy="100" r="98" fill={`url(#${id}-gold)`} />
  </>
);

export const Watch: React.FC<Props> = ({ size, hour, minute, second, flip = 0, gearTurn = 0 }) => {
  const id = 'vw';
  const angle = flip * 180;
  const showBack = angle > 90;
  // Simula el giro en 3D con un escalado horizontal (cos del ángulo).
  const scaleX = Math.max(0.02, Math.abs(Math.cos((angle * Math.PI) / 180)));
  const rot = (deg: number) => `rotate(${deg} 100 100)`;

  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{ transform: `scaleX(${scaleX})`, overflow: 'visible', filter: 'drop-shadow(0 30px 60px rgba(0,0,0,.6))' }}>
      <defs>
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f1dca2" />
          <stop offset="0.5" stopColor={c.gold} />
          <stop offset="1" stopColor="#7a5c24" />
        </linearGradient>
        <radialGradient id={`${id}-dial`} cx="0.5" cy="0.38" r="0.7">
          <stop offset="0" stopColor="#1e1b17" />
          <stop offset="1" stopColor={c.night} />
        </radialGradient>
      </defs>
      <Case id={id} />
      {!showBack ? (
        <g>
          <circle cx="100" cy="100" r="90" fill={c.night} />
          <circle cx="100" cy="100" r="86" fill={`url(#${id}-dial)`} />
          {INDICES.map((t, i) => (
            <line
              key={i}
              x1={f(t.x1)}
              y1={f(t.y1)}
              x2={f(t.x2)}
              y2={f(t.y2)}
              stroke={t.hour ? c.goldHi : '#6b5a3a'}
              strokeWidth={t.major ? 3.2 : t.hour ? 2 : 0.8}
              strokeLinecap="square"
            />
          ))}
          <text x="100" y="58" textAnchor="middle" fill={c.gold} fontFamily="Cinzel" fontSize="9" letterSpacing="2.5">
            CLOCK TIME
          </text>
          <text x="100" y="146" textAnchor="middle" fill="#8c7a58" fontFamily="Montserrat" fontSize="5" letterSpacing="2.2">
            CHILE · CONCEPCIÓN
          </text>
          <path d="M100 104 L97.4 100 L100 54 L102.6 100 Z" fill={c.goldHi} transform={rot(hour)} />
          <path d="M100 106 L98.2 100 L100 30 L101.8 100 Z" fill={c.ink} transform={rot(minute)} />
          <line x1="100" y1="114" x2="100" y2="26" stroke={c.gold} strokeWidth="0.9" transform={rot(second)} />
          <circle cx="100" cy="100" r="3.4" fill={c.gold} />
          <circle cx="100" cy="100" r="1.2" fill={c.night} />
        </g>
      ) : (
        <g transform="translate(200 0) scale(-1 1)">
          <circle cx="100" cy="100" r="90" fill="#16130f" />
          <circle cx="100" cy="100" r="88" fill="none" stroke="#3a3122" strokeWidth="0.8" />
          {GEARS.map((g, i) => {
            const rr = g.r * 0.62;
            return (
              <g key={i} transform={`rotate(${gearTurn * g.speed} ${g.cx} ${g.cy})`}>
                <path d={g.d} fill="#b8924d" stroke="#7a5c24" strokeWidth="0.6" />
                <circle cx={g.cx} cy={g.cy} r={rr} fill="#16130f" />
                {[0, 60, 120].map((a) => {
                  const rad = (a * Math.PI) / 180;
                  return (
                    <line
                      key={a}
                      x1={f(g.cx - rr * Math.cos(rad))}
                      y1={f(g.cy - rr * Math.sin(rad))}
                      x2={f(g.cx + rr * Math.cos(rad))}
                      y2={f(g.cy + rr * Math.sin(rad))}
                      stroke="#b8924d"
                      strokeWidth="1.6"
                    />
                  );
                })}
                <circle cx={g.cx} cy={g.cy} r="2.4" fill="#8f2b2b" stroke={c.goldHi} strokeWidth="0.6" />
              </g>
            );
          })}
          <g transform={`rotate(${Math.sin(gearTurn / 6) * 110} 62 142)`}>
            <circle cx="62" cy="142" r="15" fill="none" stroke={c.goldHi} strokeWidth="1.4" />
            <line x1="47" y1="142" x2="77" y2="142" stroke={c.goldHi} strokeWidth="1" />
            <line x1="62" y1="127" x2="62" y2="157" stroke={c.goldHi} strokeWidth="1" />
          </g>
          <circle cx="62" cy="142" r="2" fill="#8f2b2b" />
        </g>
      )}
    </svg>
  );
};
