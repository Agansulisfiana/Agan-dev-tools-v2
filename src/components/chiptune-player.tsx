"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Music, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ─── Extended original chiptune melody (8-bit retro adventure vibe) ───
// [frequencyHz, durationBeats] — 0 = rest
const MELODY: [number, number][] = [
  // ── INTRO (8 beats) ──
  [523, 0.5], [0, 0.25], [523, 0.25], [659, 0.5], [784, 0.5],
  [880, 1], [0, 0.25], [784, 0.75],
  [698, 0.5], [659, 0.25], [698, 0.25], [784, 1],

  // ── VERSE 1 (16 beats) ──
  [659, 0.5], [587, 0.5], [523, 0.5], [587, 0.5],
  [659, 0.5], [784, 0.5], [880, 1],
  [784, 0.5], [659, 0.5], [587, 0.5], [523, 0.5],
  [587, 0.5], [659, 0.5], [523, 1],
  [494, 0.5], [523, 0.5], [587, 0.5], [659, 0.5],
  [784, 0.5], [880, 0.5], [784, 1],
  [659, 0.5], [587, 0.5], [523, 0.5], [494, 0.5],
  [440, 0.5], [494, 0.5], [523, 1],

  // ── PRE-CHORUS (8 beats) ──
  [523, 0.5], [587, 0.5], [659, 0.5], [784, 0.5],
  [880, 0.5], [988, 0.5], [880, 1],
  [784, 0.5], [659, 0.5], [587, 0.5], [523, 0.5],
  [587, 1.5], [0, 0.5],

  // ── CHORUS (16 beats) ──
  [659, 0.5], [784, 0.5], [880, 0.5], [988, 0.5],
  [880, 0.5], [784, 0.5], [659, 0.5], [784, 1],
  [880, 0.5], [988, 0.5], [1047, 0.5], [988, 0.5],
  [880, 0.5], [784, 0.5], [659, 1],
  [587, 0.5], [659, 0.5], [784, 0.5], [659, 0.5],
  [587, 0.5], [523, 0.5], [587, 0.5], [659, 1],
  [523, 0.5], [494, 0.5], [440, 0.5], [494, 0.5],
  [523, 1.5], [0, 0.5],

  // ── VERSE 2 (16 beats) ──
  [440, 0.5], [523, 0.5], [587, 0.5], [659, 0.5],
  [587, 0.5], [523, 0.5], [440, 1],
  [392, 0.5], [440, 0.5], [523, 0.5], [587, 0.5],
  [659, 0.5], [587, 0.5], [523, 1],
  [494, 0.5], [523, 0.5], [587, 0.5], [659, 0.5],
  [784, 0.5], [880, 0.5], [784, 1],
  [659, 0.5], [587, 0.5], [494, 0.5], [523, 0.5],
  [440, 1.5], [0, 0.5],

  // ── BRIDGE (12 beats) ──
  [349, 0.5], [392, 0.5], [440, 0.5], [494, 0.5],
  [523, 1], [494, 0.5], [440, 0.5],
  [392, 0.5], [440, 0.5], [494, 0.5], [523, 0.5],
  [587, 1], [523, 0.5], [494, 0.5],
  [440, 0.5], [494, 0.5], [523, 0.5], [587, 0.5],
  [659, 0.5], [784, 0.5], [880, 1.5],

  // ── FINAL CHORUS (16 beats) ──
  [659, 0.5], [784, 0.5], [880, 0.5], [988, 0.5],
  [1047, 0.5], [988, 0.5], [880, 0.5], [784, 1],
  [880, 0.5], [988, 0.5], [1047, 0.5], [1175, 0.5],
  [1047, 0.5], [988, 0.5], [880, 1],
  [784, 0.5], [880, 0.5], [784, 0.5], [659, 0.5],
  [587, 0.5], [523, 0.5], [587, 0.5], [659, 1],
  [523, 0.5], [587, 0.5], [523, 0.5], [494, 0.5],
  [440, 0.5], [392, 0.5], [440, 1],

  // ── OUTRO (8 beats, fades into loop) ──
  [523, 0.5], [0, 0.25], [523, 0.25], [659, 0.5], [587, 0.5],
  [523, 0.5], [494, 0.5], [440, 1],
  [392, 0.5], [440, 0.5], [523, 0.5], [440, 0.5],
  [392, 1.5], [0, 0.5],
];

const BASS: [number, number][] = [
  // Intro
  [131, 2], [110, 2],
  // Verse 1
  [131, 2], [110, 2], [131, 2], [98, 2],
  [110, 2], [131, 2], [110, 2], [98, 2],
  // Pre-chorus
  [131, 2], [147, 2], [165, 2], [131, 2],
  // Chorus
  [165, 2], [131, 2], [147, 2], [131, 2],
  [110, 2], [131, 2], [98, 2], [110, 2],
  // Verse 2
  [110, 2], [98, 2], [87, 2], [98, 2],
  [110, 2], [131, 2], [98, 2], [110, 2],
  // Bridge
  [87, 2], [98, 2], [110, 2], [131, 2],
  [131, 2], [110, 2],
  // Final chorus
  [165, 2], [131, 2], [147, 2], [165, 2],
  [131, 2], [110, 2], [98, 2], [131, 2],
  // Outro
  [131, 2], [110, 2], [98, 2], [110, 2],
];

// Arpeggio pattern for extra richness
const ARPEGGIO: [number, number][] = [
  [262, 0.25], [330, 0.25], [392, 0.25], [330, 0.25],
  [294, 0.25], [370, 0.25], [440, 0.25], [370, 0.25],
  [330, 0.25], [415, 0.25], [494, 0.25], [415, 0.25],
  [262, 0.25], [330, 0.25], [392, 0.25], [330, 0.25],
  [294, 0.25], [370, 0.25], [440, 0.25], [370, 0.25],
  [349, 0.25], [440, 0.25], [523, 0.25], [440, 0.25],
  [392, 0.25], [494, 0.25], [587, 0.25], [494, 0.25],
  [330, 0.25], [415, 0.25], [494, 0.25], [415, 0.25],
];

const BPM = 150;
const BEAT_DUR = 60 / BPM;

function getTotalBeats(notes: [number, number][]) {
  return notes.reduce((s, [, d]) => s + d, 0);
}

const MELODY_BEATS = getTotalBeats(MELODY);
const BASS_BEATS = getTotalBeats(BASS);
const ARP_BEATS = getTotalBeats(ARPEGGIO);
const LOOP_BEATS = Math.max(MELODY_BEATS, BASS_BEATS, ARP_BEATS);

export function ChiptunePlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const timerRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const loopCountRef = useRef(0);
  const playingRef = useRef(false);

  const stop = useCallback(() => {
    playingRef.current = false;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch { /* ignore */ }
      audioCtxRef.current = null;
    }
    gainRef.current = null;
  }, []);

  const scheduleNotes = useCallback((ctx: AudioContext, master: GainNode, loopStart: number) => {
    const scheduleAhead = 0.3; // seconds to schedule ahead

    // ── Melody (square wave) ──
    let mBeat = 0;
    for (const [freq, dur] of MELODY) {
      const t = loopStart + mBeat * BEAT_DUR;
      if (t > ctx.currentTime + scheduleAhead) break;
      if (t >= ctx.currentTime - 0.01 && freq > 0) {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "square";
        osc.frequency.value = freq;
        const d = dur * BEAT_DUR * 0.85;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.18, t + 0.01);
        g.gain.setValueAtTime(0.18, t + d * 0.6);
        g.gain.linearRampToValueAtTime(0, t + d);
        osc.connect(g).connect(master);
        osc.start(t);
        osc.stop(t + d + 0.02);
      }
      mBeat += dur;
    }

    // ── Bass (triangle wave) ──
    let bBeat = 0;
    for (const [freq, dur] of BASS) {
      const t = loopStart + bBeat * BEAT_DUR;
      if (t > ctx.currentTime + scheduleAhead) break;
      if (t >= ctx.currentTime - 0.01 && freq > 0) {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = freq;
        const d = dur * BEAT_DUR * 0.9;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.12, t + 0.02);
        g.gain.setValueAtTime(0.10, t + d * 0.5);
        g.gain.linearRampToValueAtTime(0, t + d);
        osc.connect(g).connect(master);
        osc.start(t);
        osc.stop(t + d + 0.02);
      }
      bBeat += dur;
    }

    // ── Arpeggio (pulse/square, quiet) ──
    let aBeat = 0;
    for (const [freq, dur] of ARPEGGIO) {
      const t = loopStart + aBeat * BEAT_DUR;
      if (t > ctx.currentTime + scheduleAhead) break;
      if (t >= ctx.currentTime - 0.01 && freq > 0) {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "square";
        osc.frequency.value = freq;
        const d = dur * BEAT_DUR * 0.7;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.04, t + 0.005);
        g.gain.linearRampToValueAtTime(0, t + d);
        osc.connect(g).connect(master);
        osc.start(t);
        osc.stop(t + d + 0.01);
      }
      aBeat += dur;
    }
  }, []);

  const scheduler = useCallback(() => {
    if (!playingRef.current || !audioCtxRef.current || !gainRef.current) return;

    const ctx = audioCtxRef.current;
    const loopDuration = LOOP_BEATS * BEAT_DUR;
    const elapsed = ctx.currentTime - startRef.current;

    // Calculate which loop iteration we're in
    const currentLoopIndex = Math.floor(elapsed / loopDuration);
    const loopStart = startRef.current + currentLoopIndex * loopDuration;

    // Schedule notes for current loop
    scheduleNotes(ctx, gainRef.current, loopStart);

    // If we've entered a new loop, schedule the next one too
    const nextLoopStart = startRef.current + (currentLoopIndex + 1) * loopDuration;
    if (nextLoopStart < ctx.currentTime + 0.5) {
      scheduleNotes(ctx, gainRef.current, nextLoopStart);
    }

    loopCountRef.current = currentLoopIndex;
    timerRef.current = window.setTimeout(scheduler, 80);
  }, [scheduleNotes]);

  const play = useCallback(() => {
    stop();
    const ctx = new AudioContext();
    const master = ctx.createGain();
    master.gain.value = isMuted ? 0 : 0.25;
    master.connect(ctx.destination);
    audioCtxRef.current = ctx;
    gainRef.current = master;
    startRef.current = ctx.currentTime + 0.05;
    loopCountRef.current = 0;
    playingRef.current = true;
    setIsPlaying(true);
    timerRef.current = window.setTimeout(scheduler, 30);
  }, [isMuted, stop, scheduler]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (gainRef.current) {
        gainRef.current.gain.value = next ? 0 : 0.25;
      }
      return next;
    });
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) { stop(); setIsPlaying(false); }
    else { play(); }
  }, [isPlaying, play, stop]);

  useEffect(() => () => stop(), [stop]);

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={togglePlay}>
              <Music className={`h-4 w-4 ${isPlaying ? "text-primary animate-pulse" : "text-muted-foreground"}`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{isPlaying ? "Stop Music" : "Play Music"}</TooltipContent>
        </Tooltip>

        {isPlaying && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleMute}>
                {isMuted
                  ? <VolumeX className="h-4 w-4 text-muted-foreground" />
                  : <Volume2 className="h-4 w-4 text-primary" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isMuted ? "Unmute" : "Mute"}</TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}