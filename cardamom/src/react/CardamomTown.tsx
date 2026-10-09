/**
 * <CardamomTown /> — drop-in React section for the Cardamom City overworld.
 *
 * Self-contained: inline styles only (no global CSS), keyboard input only while the
 * section is focused, auto-pauses when scrolled out of view or when focus leaves,
 * and tears the Phaser game down completely on exit/unmount.
 */
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState, type CSSProperties } from 'react';
import type { TownGame } from '../game/TownGame';
import type { Button } from '../game/input';
import poster from '../game/assets/gen/town_ground.png';

export interface CardamomTownHandle {
  start(): void;
  pause(): void;
  resume(): void;
  exit(): void;
  enterFullscreen(): Promise<void>;
  exitFullscreen(): Promise<void>;
}

export interface CardamomTownProps {
  width?: CSSProperties['width'];
  height?: CSSProperties['height'];
  className?: string;
  style?: CSSProperties;
  /** Boot straight into the game instead of showing the title card. */
  autoStart?: boolean;
  /** Override automatic integer pixel scaling (1–8). */
  pixelScale?: number;
  allowFullscreen?: boolean;
  /** Pause automatically when the section scrolls out of view or loses focus. */
  autoPause?: boolean;
  /** 'auto' shows the on-screen pad on touch devices. */
  touchControls?: 'auto' | 'always' | 'never';
  onStart?: () => void;
  onExit?: () => void;
}

type Status = 'idle' | 'loading' | 'playing' | 'paused';

const font = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";

export const CardamomTown = forwardRef<CardamomTownHandle, CardamomTownProps>(function CardamomTown(
  {
    width = '100%',
    height = 540,
    className,
    style,
    autoStart = false,
    pixelScale,
    allowFullscreen = true,
    autoPause = true,
    touchControls = 'auto',
    onStart,
    onExit,
  },
  ref,
) {
  const hostRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<TownGame | null>(null);
  const autoPausedRef = useRef(false);
  const loadingRef = useRef(false);
  const mountedRef = useRef(true);
  const [status, setStatus] = useState<Status>('idle');
  const [isFs, setIsFs] = useState(false);
  const [coarse, setCoarse] = useState(false);
  const cbs = useRef({ onStart, onExit });
  cbs.current = { onStart, onExit };

  const start = useCallback(() => {
    const host = hostRef.current;
    if (!host) return;
    if (gameRef.current?.running) {
      gameRef.current.resume();
      setStatus('playing');
      return;
    }
    if (loadingRef.current) return;
    loadingRef.current = true;
    setStatus('loading');
    // Phaser + game code are fetched only when the visitor actually presses start.
    void import('../game/TownGame').then(({ createTownGame }) => {
      loadingRef.current = false;
      if (!mountedRef.current || !hostRef.current) return;
      gameRef.current = createTownGame(hostRef.current, {
        pixelScale,
        onReady: () => setStatus('playing'),
        onExit: () => {
          gameRef.current = null;
          if (document.fullscreenElement === host) void document.exitFullscreen();
          setStatus('idle');
          cbs.current.onExit?.();
        },
      });
      gameRef.current.start();
      cbs.current.onStart?.();
    });
  }, [pixelScale]);

  const pause = useCallback(() => {
    if (!gameRef.current?.running) return;
    gameRef.current.pause();
    setStatus('paused');
  }, []);
  const resume = useCallback(() => {
    if (!gameRef.current?.running) return;
    autoPausedRef.current = false;
    gameRef.current.resume();
    setStatus('playing');
  }, []);
  const exit = useCallback(() => {
    const host = hostRef.current;
    gameRef.current?.exit();
    gameRef.current = null;
    if (host && document.fullscreenElement === host) void document.exitFullscreen();
    setStatus('idle');
    cbs.current.onExit?.();
  }, []);
  const enterFullscreen = useCallback(async () => {
    const host = hostRef.current;
    if (host && !document.fullscreenElement) await host.requestFullscreen?.({ navigationUI: 'hide' });
    gameRef.current?.focus();
  }, []);
  const exitFullscreen = useCallback(async () => {
    if (document.fullscreenElement === hostRef.current) await document.exitFullscreen();
  }, []);

  useImperativeHandle(ref, () => ({ start, pause, resume, exit, enterFullscreen, exitFullscreen }), [
    start, pause, resume, exit, enterFullscreen, exitFullscreen,
  ]);

  useEffect(() => {
    mountedRef.current = true;
    if (autoStart) start();
    return () => {
      mountedRef.current = false;
      gameRef.current?.exit();
      gameRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onFs = () => setIsFs(document.fullscreenElement === hostRef.current);
    document.addEventListener('fullscreenchange', onFs);
    const mq = window.matchMedia?.('(pointer: coarse)');
    setCoarse(!!mq?.matches);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  // Auto-pause when scrolled out of view; auto-resume when it comes back.
  useEffect(() => {
    const host = hostRef.current;
    if (!autoPause || !host || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => {
      const g = gameRef.current;
      if (!g?.running) return;
      if (!e.isIntersecting && !g.paused) {
        autoPausedRef.current = true;
        g.pause();
        setStatus('paused');
      } else if (e.isIntersecting && autoPausedRef.current) {
        autoPausedRef.current = false;
        g.resume();
        setStatus('playing');
      }
    }, { threshold: 0.15 });
    io.observe(host);
    return () => io.disconnect();
  }, [autoPause]);

  const onBlur = (e: React.FocusEvent) => {
    if (!autoPause || status !== 'playing') return;
    if (hostRef.current?.contains(e.relatedTarget as Node)) return;
    pause();
  };

  const showPad = status === 'playing' && (touchControls === 'always' || (touchControls === 'auto' && coarse));
  const vb = (b: Button, down: boolean) => gameRef.current?.setVirtualButton(b, down);

  return (
    <div
      ref={hostRef}
      className={className}
      tabIndex={0}
      role="application"
      aria-label="Cardamom City — an explorable pixel-art town. Arrow keys or WASD to move, Z or Space to talk, X or Shift to run, Escape for the menu."
      onBlur={onBlur}
      onPointerDown={() => status === 'playing' && gameRef.current?.focus()}
      style={{
        position: 'relative',
        width: isFs ? '100%' : width,
        height: isFs ? '100%' : height,
        overflow: 'hidden',
        background: '#0c0c14',
        outline: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: status === 'playing' ? 'none' : 'auto',
        contain: 'strict',
        isolation: 'isolate',
        ...style,
      }}
    >
      {(status === 'idle' || status === 'loading') && (
        <TitleCard loading={status === 'loading'} onStart={start} />
      )}
      {status === 'paused' && (
        <button type="button" onClick={resume} style={overlayBtn}>
          <span style={panel}>
            <strong style={{ fontSize: 16, letterSpacing: 2 }}>PAUSED</strong>
            <span style={{ opacity: 0.8, fontSize: 12, marginTop: 6 }}>Click or tap to keep exploring</span>
          </span>
        </button>
      )}
      {(status === 'playing' || status === 'paused') && (
        <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6, zIndex: 3 }}>
          {allowFullscreen && (
            <IconBtn label={isFs ? 'Exit full screen' : 'Full screen'} onClick={() => void (isFs ? exitFullscreen() : enterFullscreen())}>
              {isFs ? '⤡' : '⤢'}
            </IconBtn>
          )}
          <IconBtn label="Leave town" onClick={exit}>✕</IconBtn>
        </div>
      )}
      {showPad && <TouchPad onButton={vb} />}
    </div>
  );
});

function TitleCard({ loading, onStart }: { loading: boolean; onStart: () => void }) {
  return (
    <button
      type="button"
      onClick={onStart}
      disabled={loading}
      style={{
        ...overlayBtn,
        backgroundImage: `linear-gradient(rgba(10,10,24,.25), rgba(10,10,24,.55)), url(${poster})`,
        backgroundSize: 'auto, 2048px auto',
        backgroundPosition: 'center, 46% 40%',
        imageRendering: 'pixelated',
        cursor: loading ? 'progress' : 'pointer',
      }}
    >
      <span style={panel}>
        <span style={{ fontSize: 11, letterSpacing: 3, opacity: 0.75 }}>WELCOME TO</span>
        <strong style={{ fontSize: 22, letterSpacing: 3, margin: '4px 0 2px' }}>CARDAMOM CITY</strong>
        <span style={{ fontSize: 12, opacity: 0.85 }}>Where the backwaters meet the boulevard.</span>
        <span style={{ marginTop: 14, padding: '6px 14px', background: '#e04838', color: '#fff', borderRadius: 4, fontWeight: 700, fontSize: 13, letterSpacing: 1 }}>
          {loading ? 'LOADING…' : '▶  START EXPLORING'}
        </span>
        <span style={{ fontSize: 11, opacity: 0.7, marginTop: 12, lineHeight: 1.6 }}>
          Arrows / WASD move · Z / Space talk · hold X / Shift to run · Esc menu
        </span>
      </span>
    </button>
  );
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      style={{
        width: 30, height: 30, borderRadius: 6, border: '2px solid #383848', background: 'rgba(248,248,248,.92)',
        color: '#383848', fontSize: 15, fontWeight: 700, lineHeight: 1, cursor: 'pointer', padding: 0, fontFamily: font,
      }}
    >
      {children}
    </button>
  );
}

function TouchPad({ onButton }: { onButton: (b: Button, down: boolean) => void }) {
  const hold = (b: Button) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      onButton(b, true);
    },
    onPointerUp: () => onButton(b, false),
    onPointerCancel: () => onButton(b, false),
    onLostPointerCapture: () => onButton(b, false),
    tabIndex: -1,
  });
  const k = (extra: CSSProperties): CSSProperties => ({
    position: 'absolute', width: 44, height: 44, borderRadius: 10, border: '2px solid rgba(56,56,72,.8)',
    background: 'rgba(248,248,248,.55)', color: '#383848', fontSize: 18, fontWeight: 700, padding: 0, touchAction: 'none', ...extra,
  });
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2 }}>
      <div style={{ position: 'absolute', left: 12, bottom: 12, width: 140, height: 140, pointerEvents: 'auto' }}>
        <button type="button" aria-label="Up" {...hold('up')} style={k({ left: 48, top: 0 })}>▲</button>
        <button type="button" aria-label="Left" {...hold('left')} style={k({ left: 0, top: 48 })}>◀</button>
        <button type="button" aria-label="Right" {...hold('right')} style={k({ left: 96, top: 48 })}>▶</button>
        <button type="button" aria-label="Down" {...hold('down')} style={k({ left: 48, top: 96 })}>▼</button>
      </div>
      <div style={{ position: 'absolute', right: 12, bottom: 24, width: 112, height: 96, pointerEvents: 'auto' }}>
        <button type="button" aria-label="A (talk)" {...hold('a')} style={k({ right: 0, top: 0, borderRadius: 22, background: 'rgba(224,72,56,.75)', color: '#fff' })}>A</button>
        <button type="button" aria-label="B (run)" {...hold('b')} style={k({ left: 0, top: 40, borderRadius: 22 })}>B</button>
      </div>
    </div>
  );
}

const overlayBtn: CSSProperties = {
  position: 'absolute', inset: 0, zIndex: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
  border: 0, padding: 16, margin: 0, background: 'rgba(8,8,20,.55)', cursor: 'pointer', fontFamily: font, color: '#383848',
  width: '100%', height: '100%',
};
const panel: CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', maxWidth: 420,
  background: '#f8f8f8', border: '3px solid #6890c8', outline: '2px solid #383848', borderRadius: 8,
  padding: '16px 22px', boxShadow: '0 6px 0 rgba(0,0,0,.25)', color: '#383848', fontFamily: font,
};

export default CardamomTown;
