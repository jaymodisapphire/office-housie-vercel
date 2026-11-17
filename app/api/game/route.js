import { NextResponse } from 'next/server';
import { redis } from '../../../lib/redis.js';
import { PRIZE_NAME } from '../../../lib/constants.js';
import { complete, genCode, genId, makeTicket, newSeq } from '../../../lib/game.js';

export const dynamic = 'force-dynamic';

const TTL = 60 * 60 * 24; // rooms vanish after 24h
const K = c => ({ meta: `h:${c}:meta`, players: `h:${c}:p`, win: `h:${c}:w`, ver: `h:${c}:v` });
const json = (o, status = 200) => NextResponse.json(o, { status });
const err = (m, s = 400) => json({ error: m }, s);
const clean = n => String(n || '').trim().slice(0, 20) || 'Player';

// Every change bumps a version number. Clients poll only that tiny key and fetch full state when it moves.
const touch = c => redis.incr(K(c).ver);

export async function GET(req) {
  const q = new URL(req.url).searchParams;
  const code = (q.get('code') || '').toUpperCase(), pid = q.get('pid'), v = Number(q.get('v') || 0), k = K(code);
  const ver = await redis.get(k.ver);
  if (ver === null) return json({ gone: true });
  if (Number(ver) === v) return json({ same: true });
  const [meta, players, winners] = await Promise.all([redis.hgetall(k.meta), redis.hgetall(k.players), redis.hgetall(k.win)]);
  if (!meta || !players || !players[pid]) return json({ gone: true });
  const n = Math.min(Number(meta.n || 0), 90);
  return json({
    v: Number(ver), code, round: meta.round, hostId: meta.hostId, ended: !!meta.ended, notice: String(meta.notice || ''),
    called: meta.seq.slice(0, n), started: n > 0, winners: winners || {},
    players: Object.entries(players).map(([id, p]) => ({ id, name: p.name, at: p.at })).sort((a, b) => a.at - b.at),
    ticket: players[pid].ticket,
  });
}

export async function POST(req) {
  const b = await req.json().catch(() => ({}));
  const code = String(b.code || '').toUpperCase(), k = K(code), pid = b.pid;

  if (b.action === 'create') {
    const id = genId();
    let c = null;
    for (let i = 0; i < 20 && !c; i++) { const t = genCode(); if (await redis.hsetnx(K(t).meta, 'hostId', id)) c = t; }
    if (!c) return err('Could not create a room. Try again.', 500);
    const kc = K(c);
    await Promise.all([
      redis.hset(kc.meta, { seq: newSeq(), round: 1, ended: false, notice: '', n: 0 }),
      redis.hset(kc.players, { [id]: { name: clean(b.name), ticket: makeTicket(), at: Date.now() } }),
      touch(c),
    ]);
    await Promise.all([kc.meta, kc.players, kc.ver].map(x => redis.expire(x, TTL)));
    return json({ code: c, pid: id });
  }

  if (b.action === 'join') {
    if ((await redis.get(k.ver)) === null) return err('Room not found. Check the code.', 404);
    const id = genId(), name = clean(b.name);
    await redis.hset(k.players, { [id]: { name, ticket: makeTicket(), at: Date.now() } });
    await redis.hset(k.meta, { notice: name + ' joined' });
    await touch(code);
    return json({ code, pid: id });
  }

  const [meta, me] = await Promise.all([redis.hgetall(k.meta), redis.hget(k.players, pid)]);
  if (!meta || !me) return err('You are not in this game', 404);
  const isHost = meta.hostId === pid;

  switch (b.action) {
    case 'call': {
      if (!isHost) return err('Only the host can call numbers', 403);
      if (meta.ended) return err('Game is over');
      const n = await redis.hincrby(k.meta, 'n', 1);
      if (n > 90) return err('All numbers are called');
      if (n === 90) await redis.hset(k.meta, { ended: true, notice: 'All 90 numbers are called. Game over!' });
      else if (meta.notice) await redis.hset(k.meta, { notice: '' });
      await touch(code);
      return json({ ok: true, number: meta.seq[n - 1] });
    }
    case 'claim': {
      const prize = b.prize;
      if (!PRIZE_NAME[prize] || meta.ended) return err('Invalid claim');
      const n = Math.min(Number(meta.n) || 0, 90);
      if (!complete(me.ticket, meta.seq.slice(0, n), prize)) {
        await redis.hset(k.meta, { notice: `${me.name} made a wrong claim for ${PRIZE_NAME[prize]}` });
        await touch(code);
        return err('Not complete yet. Wrong claim!');
      }
      if (!(await redis.hsetnx(k.win, prize, me.name))) return err(`${PRIZE_NAME[prize]} is already won`);
      await redis.expire(k.win, TTL);
      await redis.hset(k.meta, { notice: `${me.name} won ${PRIZE_NAME[prize]}!`, ...(prize === 'full' ? { ended: true } : {}) });
      await touch(code);
      return json({ ok: true });
    }
    case 'reset': {
      if (!isHost) return err('Only the host can start a new game', 403);
      const players = await redis.hgetall(k.players);
      const fresh = Object.fromEntries(Object.entries(players).map(([id, p]) => [id, { ...p, ticket: makeTicket() }]));
      await Promise.all([
        redis.hset(k.players, fresh),
        redis.hset(k.meta, { seq: newSeq(), round: Number(meta.round) + 1, ended: false, n: 0, notice: 'New game started. Fresh tickets!' }),
        redis.del(k.win),
      ]);
      await touch(code);
      return json({ ok: true });
    }
    case 'leave': {
      if (!isHost) { await redis.hdel(k.players, pid); await touch(code); }
      return json({ ok: true });
    }
  }
  return err('Unknown action');
}
