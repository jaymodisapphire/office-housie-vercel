'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { NICK, PRIZES } from '../lib/constants.js';

const post = b => fetch('/api/game', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) }).then(r => r.json());
const speak = n => {
  if (!window.speechSynthesis) return;
  speechSynthesis.cancel();
  speechSynthesis.speak(new SpeechSynthesisUtterance(n > 9 ? `${[...String(n)].join(' ')}, ${n}` : `Number ${n}`));
};

function Mark({ size = 64 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Office Housie logo">
      <circle cx="32" cy="32" r="29" fill="none" stroke="#f2a516" strokeWidth="3" />
      <circle cx="32" cy="32" r="23" fill="#d6336c" />
      <ellipse cx="23.5" cy="21.5" rx="7" ry="4" fill="#fff" opacity=".22" transform="rotate(-35 23.5 21.5)" />
      <circle cx="32" cy="32" r="13" fill="#fbf6e6" />
      <path fill="#d6336c" d="M26 25h3.6v5.2h4.8V25H38v14h-3.6v-5.4h-4.8V39H26z" />
    </svg>
  );
}
const Logo = ({ small }) => <div className={small ? 'logo sm' : 'logo'}><Mark size={small ? 40 : 64} /><span>Office Housie</span></div>;

export default function Page() {
  const [ready, setReady] = useState(false);
  const [me, setMe] = useState(null);
  const [S, setS] = useState(null);
  const [marks, setMarks] = useState([]);
  const [voice, setVoice] = useState(true);
  const [auto, setAuto] = useState(false);
  const [flash, setFlash] = useState('');
  const [err, setErr] = useState('');
  const [name, setName] = useState('');
  const [codeIn, setCodeIn] = useState('');
  const [busy, setBusy] = useState(false);
  const vRef = useRef(0), callsRef = useRef(null), roundRef = useRef(null), voiceRef = useRef(true), endedRef = useRef(false);

  useEffect(() => {
    try { setMe(JSON.parse(localStorage.housie || 'null')); } catch {}
    setName(localStorage.hname || '');
    setCodeIn((new URLSearchParams(location.search).get('room') || '').toUpperCase());
    setReady(true);
  }, []);

  const reset = msg => {
    localStorage.removeItem('housie');
    vRef.current = 0; callsRef.current = null; roundRef.current = null;
    setMe(null); setS(null); setAuto(false); setMarks([]); setErr(msg || '');
  };

  const poll = useCallback(async () => {
    if (!me) return;
    try {
      const r = await fetch(`/api/game?code=${me.code}&pid=${me.pid}&v=${vRef.current}`, { cache: 'no-store' }).then(x => x.json());
      if (r.gone) return reset('That game has ended or expired.');
      if (r.same) return;
      vRef.current = r.v;
      if (roundRef.current !== null && roundRef.current !== r.round) setMarks([]);
      roundRef.current = r.round;
      if (callsRef.current !== null && r.called.length > callsRef.current && voiceRef.current) speak(r.called.at(-1));
      callsRef.current = r.called.length;
      endedRef.current = r.ended;
      setS(r);
    } catch {}
  }, [me]);

  useEffect(() => {
    if (!me) return;
    let t, dead = false;
    // Poll every 3 s (8 s once the game is over) and pause while the tab is hidden, to save Redis commands.
    const loop = async () => { if (dead) return; if (!document.hidden) await poll(); t = setTimeout(loop, endedRef.current ? 8000 : 3000); };
    const wake = () => { if (!document.hidden) poll(); };
    loop();
    document.addEventListener('visibilitychange', wake);
    return () => { dead = true; clearTimeout(t); document.removeEventListener('visibilitychange', wake); };
  }, [me, poll]);

  const act = async (action, extra = {}) => {
    const r = await post({ action, code: me.code, pid: me.pid, ...extra });
    if (r.error) { setFlash(r.error); setTimeout(() => setFlash(''), 4000); }
    poll();
    return r;
  };

  useEffect(() => {
    if (!auto || !S || S.ended) return;
    const t = setInterval(() => act('call'), 6000);
    return () => clearInterval(t);
  }, [auto, S && S.ended]);

  const enter = async action => {
    const n = name.trim();
    if (busy) return;
    if (!n) return setErr('Enter your name first.');
    setBusy(true); localStorage.hname = n;
    const r = await post({ action, name: n, code: codeIn.trim() });
    setBusy(false);
    if (r.error) return setErr(r.error);
    const m = { code: r.code, pid: r.pid };
    localStorage.housie = JSON.stringify(m);
    history.replaceState(null, '', '/');
    setErr(''); setMe(m);
  };

  if (!ready) return null;

  if (!me) return (
    <>
      <Logo />
      <p className="muted">One person hosts, everyone else joins with the room code.</p>
      <div className="card"><h2>Your name</h2>
        <input maxLength={20} placeholder="e.g. Jay" value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div className="grid">
        <div className="card"><h2>Host a game</h2>
          <p className="muted">You get a room code to share. You call the numbers.</p>
          <button disabled={busy} onClick={() => enter('create')}>Host new game</button>
        </div>
        <div className="card"><h2>Join a game</h2>
          <input maxLength={4} placeholder="Room code" value={codeIn} onChange={e => setCodeIn(e.target.value.toUpperCase())} />
          <button disabled={busy} onClick={() => enter('join')}>Join game</button>
        </div>
      </div>
      <div className="err">{err}</div>
    </>
  );

  if (!S) return <p className="muted">Loading game...</p>;

  const host = S.hostId === me.pid, last = S.called.at(-1), called = new Set(S.called);
  const toggle = n => setMarks(m => (m.includes(n) ? m.filter(x => x !== n) : [...m, n]));
  const link = `${location.origin}/?room=${S.code}`;

  return (
    <>
      <div style={{ marginBottom: 14 }}><Logo small /></div>
      <div className="top">
        <div><div className="muted">Room code</div><div className="code">{S.code}</div></div>
        <div className="share"><span className="muted">Colleagues open:</span><br />{link}</div>
        <div className="row">
          <button className="alt" onClick={() => { const v = !voice; setVoice(v); voiceRef.current = v; if (!v && window.speechSynthesis) speechSynthesis.cancel(); }}>Voice: {voice ? 'on' : 'off'}</button>
          <button className="alt" onClick={() => { post({ action: 'leave', code: me.code, pid: me.pid }); reset(); }}>Leave</button>
        </div>
      </div>
      <div className="notice" style={{ marginTop: 14 }}>
        {flash || S.notice || (S.started ? 'Game on. Mark your numbers!' : host ? 'Wait for everyone to join, then call the first number.' : 'Waiting for the host to start...')}
      </div>
      <div className="grid">
        <div>
          <div className="card" style={{ textAlign: 'center' }}>
            <h2>Current number</h2>
            <div key={last || 0} className="ball pop">{last || '–'}</div>
            <div className="nick">{last ? NICK[last] : ''}</div>
            <div className="recent">{S.called.slice(-6, -1).reverse().map(n => <span key={n}>{n}</span>)}</div>
            <p className="muted">{S.called.length} of 90 called</p>
            {host && (
              <div className="row" style={{ justifyContent: 'center' }}>
                <button disabled={S.ended} onClick={() => act('call')}>Call next number</button>
                <button className="alt" disabled={S.ended} onClick={() => { if (!auto) act('call'); setAuto(!auto); }}>{auto ? 'Stop auto-call' : 'Auto-call (6 s)'}</button>
                <button className="alt" onClick={() => { if (confirm('Start a new game with fresh tickets for everyone?')) { setAuto(false); act('reset'); } }}>New game</button>
              </div>
            )}
          </div>
          <div className="card"><h2>Players ({S.players.length})</h2>
            <div className="players">{S.players.map(p => <span key={p.id}>{p.name}{p.id === S.hostId ? ' (host)' : ''}</span>)}</div>
          </div>
        </div>
        <div>
          <div className="card"><h2>Your ticket</h2>
            <table className="ticket"><tbody>
              {S.ticket.map((row, r) => (
                <tr key={r}>{row.map((n, c) => n
                  ? <td key={c} className={marks.includes(n) ? 'm' : ''} onClick={() => toggle(n)}>{n}</td>
                  : <td key={c} className="e" />)}</tr>
              ))}
            </tbody></table>
            <p className="muted" style={{ margin: '8px 0 0' }}>Tap a number to mark it when it is called.</p>
          </div>
          <div className="card"><h2>Claim a prize</h2>
            <div className="claims">
              {PRIZES.map(([k, t, d]) => (
                <button key={k} disabled={!!S.winners[k] || S.ended} onClick={() => act('claim', { prize: k })}>
                  {t}<small>{S.winners[k] ? 'Won by ' + S.winners[k] : d}</small>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="card"><h2>Board</h2>
        <div className="board">
          {Array.from({ length: 90 }, (_, i) => i + 1).map(n => <div key={n} className={n === last ? 'last' : called.has(n) ? 'on' : ''}>{n}</div>)}
        </div>
      </div>
    </>
  );
}
