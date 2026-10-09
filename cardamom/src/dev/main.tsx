/** Test harness only — NOT the website design. Hosts the section in a plain page. */
import { StrictMode, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CardamomTown, type CardamomTownHandle } from '../react/CardamomTown';

function Harness() {
  const ref = useRef<CardamomTownHandle>(null);
  const [log, setLog] = useState<string[]>([]);
  const note = (s: string) => setLog((l) => [`${new Date().toLocaleTimeString()}  ${s}`, ...l].slice(0, 6));
  const btn = { padding: '6px 10px', fontSize: 13, cursor: 'pointer' } as const;
  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px' }}>
      <p style={{ fontSize: 13, color: '#777' }}>Dev harness · surrounding page content (placeholder)</p>
      <div style={{ height: 120, background: '#e6e6e2', borderRadius: 6, marginBottom: 20 }} />
      <CardamomTown
        ref={ref}
        height="min(70vh, 600px)"
        onStart={() => note('onStart')}
        onExit={() => note('onExit')}
      />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        <button style={btn} onClick={() => ref.current?.start()}>start()</button>
        <button style={btn} onClick={() => ref.current?.pause()}>pause()</button>
        <button style={btn} onClick={() => ref.current?.resume()}>resume()</button>
        <button style={btn} onClick={() => ref.current?.exit()}>exit()</button>
        <button style={btn} onClick={() => void ref.current?.enterFullscreen()}>enterFullscreen()</button>
      </div>
      <pre style={{ fontSize: 12, color: '#555', minHeight: 60 }}>{log.join('\n')}</pre>
      <div style={{ height: 900, background: 'linear-gradient(#e6e6e2, #f4f4f2)', borderRadius: 6 }} />
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Harness />
  </StrictMode>,
);
