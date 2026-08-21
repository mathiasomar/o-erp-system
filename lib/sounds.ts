"use client";

// Generates a pleasant success chime using the Web Audio API.
// No external files needed — pure synthesis.

type SoundOptions = {
  volume?: number; // 0–1, default 0.4
};

export const playSuccessSound = (options: SoundOptions = {}) => {
  const { volume = 0.4 } = options;

  // Guard: only runs in browser
  if (typeof window === "undefined") return;
  if (!window.AudioContext) return;

  try {
    const ctx = new AudioContext();

    // A pleasant two-note "ding-dong" chime
    const notes = [
      { freq: 1046.5, start: 0, duration: 0.25 }, // C6
      { freq: 1318.5, start: 0.1, duration: 0.35 }, // E6
      { freq: 1567.9, start: 0.22, duration: 0.5 }, // G6
    ];

    notes.forEach(({ freq, start, duration }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);

      // Envelope: quick attack, smooth decay
      gainNode.gain.setValueAtTime(0, ctx.currentTime + start);
      gainNode.gain.linearRampToValueAtTime(
        volume,
        ctx.currentTime + start + 0.02,
      );
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + start + duration,
      );

      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration + 0.05);
    });

    // Close context after all notes finish
    setTimeout(() => ctx.close(), 900);
  } catch {
    // Fail silently — sound is a nice-to-have
  }
};

export const playErrorSound = (options: SoundOptions = {}) => {
  const { volume = 0.3 } = options;
  if (typeof window === "undefined" || !window.AudioContext) return;

  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.35);

    setTimeout(() => ctx.close(), 500);
  } catch {}
};
