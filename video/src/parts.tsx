import React from 'react';
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing } from 'remotion';
import { c, fonts } from './theme';

/** Fundido de entrada y salida de cada escena. */
export const SceneFade: React.FC<{ duration: number; children: React.ReactNode; bg?: string }> = ({ duration, children, bg = c.night }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 12, duration - 12, duration], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return <AbsoluteFill style={{ backgroundColor: bg, opacity }}>{children}</AbsoluteFill>;
};

/** Texto que entra subiendo levemente, desde el frame `at`. */
export const Rise: React.FC<{ at?: number; children: React.ReactNode; style?: React.CSSProperties; dist?: number }> = ({ at = 0, children, style, dist = 28 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - at, fps, config: { damping: 200, mass: 0.9 }, durationInFrames: 28 });
  return <div style={{ opacity: p, transform: `translateY(${(1 - p) * dist}px)`, ...style }}>{children}</div>;
};

/** Foto a pantalla completa con un acercamiento lento (efecto Ken Burns). */
export const KenBurns: React.FC<{ src: string; duration: number; from?: number; to?: number; position?: string; dim?: number; origin?: string }> = ({
  src,
  duration,
  from = 1.06,
  to = 1.18,
  position = '50% 50%',
  dim = 0.45,
  origin = '50% 50%',
}) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, duration], [from, to], { easing: Easing.inOut(Easing.quad) });
  return (
    <AbsoluteFill>
      <Img src={staticFile(src)} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: position, transform: `scale(${scale})`, transformOrigin: origin }} />
      <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(11,11,12,${dim}) 0%, rgba(11,11,12,${dim * 0.6}) 40%, rgba(11,11,12,.92) 100%)` }} />
    </AbsoluteFill>
  );
};

export const Eyebrow: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = c.goldHi }) => (
  <div style={{ fontFamily: fonts.sans, fontWeight: 600, fontSize: 26, letterSpacing: '0.32em', textTransform: 'uppercase', color }}>{children}</div>
);

export const Body: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ fontFamily: fonts.sans, fontWeight: 500, fontSize: 52, lineHeight: 1.35, color: c.ink, letterSpacing: '-0.01em', ...style }}>{children}</div>
);

export const Display: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ fontFamily: fonts.display, fontWeight: 600, fontSize: 86, lineHeight: 1.12, color: c.ink, ...style }}>{children}</div>
);

/** Área segura para reels: deja libre arriba y abajo lo que tapa la interfaz de Instagram. */
export const Safe: React.FC<{ children: React.ReactNode; justify?: React.CSSProperties['justifyContent']; style?: React.CSSProperties }> = ({
  children,
  justify = 'center',
  style,
}) => (
  <AbsoluteFill style={{ padding: '260px 90px 380px', display: 'flex', flexDirection: 'column', justifyContent: justify, gap: 40, ...style }}>
    {children}
  </AbsoluteFill>
);
