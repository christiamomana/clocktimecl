import React from 'react';
import { AbsoluteFill, Img, Sequence, interpolate, staticFile, useCurrentFrame, Easing } from 'remotion';
import { Watch } from './Watch';
import { Body, Display, Eyebrow, KenBurns, Rise, Safe, SceneFade } from './parts';
import { c, fonts, s } from './theme';

// "Nuestra historia" de ClockTime Chile en formato reel (1080×1920). Textos del fundador.

const SCENES = [
  { id: 'titulo', d: s(5) },
  { id: 'pasiones', d: s(6) },
  { id: 'regalo', d: s(8.5) },
  { id: 'profesor', d: s(12) },
  { id: 'pausa', d: s(6) },
  { id: 'engranajes', d: s(8) },
  { id: 'historias', d: s(7) },
  { id: 'valores', d: s(6.5) },
  { id: 'dueno', d: s(6) },
  { id: 'cierre', d: s(8) },
] as const;

export const DURATION = SCENES.reduce((t, x) => t + x.d, 0);
const start = (id: (typeof SCENES)[number]['id']) => {
  let t = 0;
  for (const x of SCENES) {
    if (x.id === id) return t;
    t += x.d;
  }
  return t;
};
const dur = (id: (typeof SCENES)[number]['id']) => SCENES.find((x) => x.id === id)!.d;

/** Hora del reloj: avanza durante todo el video (continúa entre escenas), salvo en la pausa. */
function useClock(scene: (typeof SCENES)[number]['id']) {
  const frame = useCurrentFrame() + start(scene); // dentro de una escena el frame parte en 0
  const pauseFrom = start('pausa') + s(1.5);
  const pauseTo = start('pausa') + dur('pausa');
  const t = frame < pauseFrom ? frame : frame < pauseTo ? pauseFrom : frame - (pauseTo - pauseFrom);
  const minutes = 7 * 60 + 10 + t * 0.9; // ~27 minutos de reloj por segundo de video
  const secondTick = Math.floor(t / 30) * 6;
  return { hour: minutes * 0.5, minute: (minutes % 60) * 6, second: secondTick };
}

const Titulo: React.FC = () => (
  <SceneFade duration={dur('titulo')}>
    <Safe>
      <Rise at={6}>
        <Eyebrow>ClockTime Chile · Nuestra historia</Eyebrow>
      </Rise>
      <Rise at={18}>
        <Display style={{ fontSize: 104 }}>Hay cosas que el tiempo no puede borrar.</Display>
      </Rise>
      <Rise at={60} style={{ width: 160, height: 3, background: c.gold }}>
        <span />
      </Rise>
    </Safe>
  </SceneFade>
);

const Pasiones: React.FC = () => {
  const clock = useClock('pasiones');
  return (
    <SceneFade duration={dur('pasiones')}>
      <Safe justify="center" style={{ alignItems: 'center', textAlign: 'center' }}>
        <Rise at={0}>
          <Watch size={420} {...clock} />
        </Rise>
        <Rise at={20}>
          <Body>Hay pasiones que no nacen de una decisión,</Body>
        </Rise>
        <Rise at={60}>
          <Body style={{ color: c.goldHi, fontWeight: 600 }}>sino de un instante.</Body>
        </Rise>
      </Safe>
    </SceneFade>
  );
};

const Regalo: React.FC = () => (
  <SceneFade duration={dur('regalo')}>
    <KenBurns src="movado-50s-720.webp" duration={dur('regalo')} position="50% 40%" dim={0.35} />
    <Safe justify="flex-end">
      <Rise at={14}>
        <Body style={{ fontSize: 46 }}>
          Siendo apenas un niño, llegué al colegio llevando en mi muñeca un antiguo reloj enchapado en oro.
        </Body>
      </Rise>
      <Rise at={s(4)}>
        <Display style={{ color: c.goldHi, fontSize: 78 }}>Me lo había pasado mi madre.</Display>
      </Rise>
    </Safe>
  </SceneFade>
);

const Line: React.FC<{ at: number; who: string; text: string; final?: boolean; indent?: boolean }> = ({ at, who, text, final, indent }) => (
  <Rise at={at} style={{ marginLeft: indent ? 80 : 0, borderLeft: `4px solid ${final ? c.gold : c.line}`, paddingLeft: 36 }}>
    <Eyebrow color={c.gold}>{who}</Eyebrow>
    <div
      style={
        final
          ? { fontFamily: fonts.display, fontWeight: 600, fontSize: 92, lineHeight: 1.1, color: c.goldHi, marginTop: 14 }
          : { fontFamily: fonts.italic, fontStyle: 'italic', fontWeight: 500, fontSize: 64, color: c.ink, marginTop: 10 }
      }
    >
      —{text}
    </div>
  </Rise>
);

const Profesor: React.FC = () => (
  <SceneFade duration={dur('profesor')}>
    <Safe>
      <Rise at={4}>
        <Body style={{ color: c.muted, fontSize: 42 }}>Aquel día, un profesor observó mi muñeca y me preguntó:</Body>
      </Rise>
      <Line at={s(1.2)} who="El profesor" text="¿Qué llevas ahí?" />
      <Line at={s(3.8)} who="El niño" text="Un reloj, profesor." indent />
      <Line at={s(6.6)} who="El profesor" text="No. Lo que tú llevas ahí es arte." final />
    </Safe>
  </SceneFade>
);

const Pausa: React.FC = () => {
  const clock = useClock('pausa');
  return (
    <SceneFade duration={dur('pausa')}>
      <Safe style={{ alignItems: 'center', textAlign: 'center' }}>
        <Watch size={620} {...clock} />
        <Rise at={s(1.5)}>
          <Body style={{ fontSize: 46 }}>
            Aquella frase quedó suspendida en mi memoria, como si el tiempo hubiese decidido
            <span style={{ color: c.goldHi }}> detenerse por un instante.</span>
          </Body>
        </Rise>
      </Safe>
    </SceneFade>
  );
};

const Engranajes: React.FC = () => {
  const frame = useCurrentFrame();
  const clock = useClock('engranajes');
  const flip = interpolate(frame, [s(0.6), s(1.8)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) });
  return (
    <SceneFade duration={dur('engranajes')}>
      <Safe style={{ alignItems: 'center', textAlign: 'center' }}>
        <Watch size={560} {...clock} flip={flip} gearTurn={frame * 1.2} />
        <Rise at={s(1.6)}>
          <Body style={{ fontSize: 44 }}>Descubrí que detrás de una esfera, de unas agujas y de cientos de pequeños engranajes,</Body>
        </Rise>
        <Rise at={s(4)}>
          <Body style={{ fontSize: 50, color: c.goldHi, fontWeight: 600 }}>
            existe algo extraordinario: el talento humano intentando darle forma al tiempo.
          </Body>
        </Rise>
      </Safe>
    </SceneFade>
  );
};

const PHOTOS = [
  { src: 'radiomir-slc-1100.webp', pos: '50% 45%' },
  { src: 'longines-moonphase-1100.webp', pos: '50% 35%' },
  { src: 'tag-formula1-1100.webp', pos: '50% 40%' },
  { src: 'radiomir-gmt-1100.webp', pos: '48% 40%' },
];

const PhotoIn: React.FC<{ fade: boolean; children: React.ReactNode }> = ({ fade, children }) => {
  const frame = useCurrentFrame();
  const opacity = fade ? interpolate(frame, [0, 14], [0, 1], { extrapolateRight: 'clamp' }) : 1;
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

const Historias: React.FC = () => {
  const each = Math.round(dur('historias') / PHOTOS.length);
  return (
    <SceneFade duration={dur('historias')}>
      {PHOTOS.map((p, i) => (
        <Sequence key={p.src} from={i * each} durationInFrames={i === PHOTOS.length - 1 ? dur('historias') - i * each : each + 14}>
          <PhotoIn fade={i > 0}>
            <KenBurns src={p.src} duration={each + 14} position={p.pos} dim={0.5} />
          </PhotoIn>
        </Sequence>
      ))}
      <Safe justify="flex-end">
        <Rise at={10}>
          <Body style={{ fontSize: 50 }}>Los relojes no solamente cuentan las horas.</Body>
        </Rise>
        <Rise at={s(2.6)}>
          <Display style={{ color: c.goldHi, fontSize: 104 }}>Guardan historias.</Display>
        </Rise>
      </Safe>
    </SceneFade>
  );
};

const VALORES = ['La confianza', 'La transparencia', 'La autenticidad', 'El respeto por su historia'];

const Valores: React.FC = () => (
  <SceneFade duration={dur('valores')}>
    <Safe>
      <Rise at={4}>
        <Body style={{ color: c.muted, fontSize: 42 }}>Un proyecto nacido de la pasión por la alta relojería, basado en</Body>
      </Rise>
      {VALORES.map((v, i) => (
        <Rise key={v} at={s(1.2) + i * s(0.9)} style={{ borderTop: `2px solid ${c.line}`, paddingTop: 26 }}>
          <Display style={{ fontSize: 66, color: i === VALORES.length - 1 ? c.goldHi : c.ink }}>{v}</Display>
        </Rise>
      ))}
    </Safe>
  </SceneFade>
);

const Dueno: React.FC = () => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, dur('dueno')], [1.04, 1.14]);
  return (
    <SceneFade duration={dur('dueno')}>
      <Safe style={{ alignItems: 'center', gap: 56 }}>
        <Rise at={0} dist={16}>
          <div style={{ width: 760, height: 900, borderRadius: 28, overflow: 'hidden', boxShadow: `0 0 0 2px ${c.line}, 0 40px 80px rgba(0,0,0,.6)` }}>
            <Img src={staticFile('hero-radiomir-tall-1440.webp')} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 48%', transform: `scale(${zoom})` }} />
          </div>
        </Rise>
        <div style={{ alignSelf: 'stretch', display: 'grid', gap: 18 }}>
          <Rise at={10}>
            <Body style={{ fontSize: 52 }}>Un reloj puede cambiar de dueño,</Body>
          </Rise>
          <Rise at={s(1.8)}>
            <Display style={{ color: c.goldHi, fontSize: 76 }}>pero jamás pierde el tiempo que ha vivido.</Display>
          </Rise>
        </div>
      </Safe>
    </SceneFade>
  );
};

const Cierre: React.FC = () => (
  <SceneFade duration={dur('cierre')}>
    <Safe style={{ alignItems: 'center', textAlign: 'center' }}>
      <Rise at={4}>
        <Img src={staticFile('logo-150.webp')} style={{ width: 210, height: 210, borderRadius: 999, boxShadow: `0 0 0 2px ${c.gold}, 0 0 60px rgba(201,164,92,.35)` }} />
      </Rise>
      <Rise at={16}>
        <div style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 84, letterSpacing: '0.12em', color: c.goldHi }}>CLOCKTIME CHILE</div>
      </Rise>
      <Rise at={s(1.4)}>
        <Body style={{ fontSize: 50, fontWeight: 600 }}>No vendemos solamente relojes. Damos continuidad a sus historias.</Body>
      </Rise>
      <Rise at={s(3)}>
        <Body style={{ fontSize: 38, color: c.muted, lineHeight: 1.6 }}>
          Porque el tiempo pasa. El arte permanece.
          <br />Y las historias merecen continuar.
        </Body>
      </Rise>
      <Rise at={s(4.6)}>
        <Eyebrow>Concepción · Todo Chile · @clocktimechile</Eyebrow>
      </Rise>
    </Safe>
  </SceneFade>
);

const COMPONENTS: Record<(typeof SCENES)[number]['id'], React.FC> = {
  titulo: Titulo,
  pasiones: Pasiones,
  regalo: Regalo,
  profesor: Profesor,
  pausa: Pausa,
  engranajes: Engranajes,
  historias: Historias,
  valores: Valores,
  dueno: Dueno,
  cierre: Cierre,
};

export const Historia: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: c.night }}>
    {SCENES.map((x) => {
      const Scene = COMPONENTS[x.id];
      return (
        <Sequence key={x.id} from={start(x.id)} durationInFrames={x.d} name={x.id}>
          <Scene />
        </Sequence>
      );
    })}
  </AbsoluteFill>
);
