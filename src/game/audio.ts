import { AudioSettings, BreathingStyleId, DemonSfxTheme, MapId } from './types';

interface MapMusicSpec {
  bpm: number;
  scale: number[]; // Frequencies in Hz (Japanese pentatonic & modal themes)
  pattern: number[]; // Indices into scale (-1 = rest)
  bassPattern: number[];
  leadWave: OscillatorType;
  subBassFreq: number;
  taikoPulse: boolean;
}

// Original Japanese-inspired pentatonic motifs per arena
const MAP_MUSIC_THEMES: Record<MapId | 'menu' | 'char_select' | 'final_boss', MapMusicSpec> = {
  menu: {
    bpm: 78,
    scale: [220, 233.08, 293.66, 329.63, 349.23, 440, 466.16, 587.33],
    pattern: [0, 2, 3, 5, 4, 3, 2, 1],
    bassPattern: [0, -1, 0, -1, 2, -1, 1, -1],
    leadWave: 'triangle',
    subBassFreq: 110,
    taikoPulse: false,
  },
  char_select: {
    bpm: 92,
    scale: [246.94, 293.66, 329.63, 369.99, 440, 493.88, 587.33, 659.25],
    pattern: [0, 2, 4, 5, 6, 5, 4, 2],
    bassPattern: [0, -1, 2, -1, 3, -1, 2, -1],
    leadWave: 'triangle',
    subBassFreq: 123.47,
    taikoPulse: true,
  },
  bamboo_forest: {
    bpm: 96,
    scale: [220, 233.08, 293.66, 329.63, 392.0, 440, 466.16, 587.33],
    pattern: [0, 1, 3, 5, 4, 3, 1, 0],
    bassPattern: [0, -1, 2, -1, 0, -1, 1, -1],
    leadWave: 'triangle',
    subBassFreq: 110,
    taikoPulse: true,
  },
  mountain_training: {
    bpm: 108,
    scale: [246.94, 277.18, 329.63, 369.99, 440, 493.88, 554.37, 659.25],
    pattern: [0, 2, 3, 4, 5, 4, 3, 2],
    bassPattern: [0, 0, 2, -1, 3, 3, 2, -1],
    leadWave: 'triangle',
    subBassFreq: 123.47,
    taikoPulse: true,
  },
  snowy_mountain: {
    bpm: 88,
    scale: [261.63, 293.66, 311.13, 392.0, 415.3, 523.25, 587.33, 622.25],
    pattern: [5, 3, 2, 0, 3, 4, 2, 1],
    bassPattern: [0, -1, -1, 3, 0, -1, 2, -1],
    leadWave: 'sine',
    subBassFreq: 130.81,
    taikoPulse: false,
  },
  japanese_village: {
    bpm: 114,
    scale: [246.94, 261.63, 329.63, 369.99, 392.0, 493.88, 523.25, 659.25],
    pattern: [0, 3, 2, 4, 5, 4, 3, 1],
    bassPattern: [0, -1, 0, 2, 0, -1, 3, 1],
    leadWave: 'triangle',
    subBassFreq: 123.47,
    taikoPulse: true,
  },
  dark_forest: {
    bpm: 104,
    scale: [196.0, 207.65, 261.63, 293.66, 311.13, 392.0, 415.3, 523.25],
    pattern: [0, 1, 4, 3, 2, 1, 0, -1],
    bassPattern: [0, 0, -1, 1, 0, 0, -1, 2],
    leadWave: 'sawtooth',
    subBassFreq: 98.0,
    taikoPulse: true,
  },
  abandoned_temple: {
    bpm: 100,
    scale: [220, 246.94, 261.63, 329.63, 349.23, 440, 493.88, 523.25],
    pattern: [0, 4, 3, 1, 2, 5, 4, 3],
    bassPattern: [0, -1, 3, -1, 0, -1, 1, -1],
    leadWave: 'triangle',
    subBassFreq: 110,
    taikoPulse: true,
  },
  spider_mountain: {
    bpm: 122,
    scale: [207.65, 220, 277.18, 311.13, 329.63, 415.3, 440, 554.37],
    pattern: [0, 5, 4, 2, 3, 4, 1, 0],
    bassPattern: [0, 0, 2, 0, 3, 0, 1, 0],
    leadWave: 'sawtooth',
    subBassFreq: 103.83,
    taikoPulse: true,
  },
  entertainment_district: {
    bpm: 130,
    scale: [261.63, 277.18, 349.23, 392.0, 466.16, 523.25, 554.37, 698.46],
    pattern: [0, 3, 5, 4, 3, 2, 1, 3],
    bassPattern: [0, 3, 0, 3, 1, 4, 2, 3],
    leadWave: 'sawtooth',
    subBassFreq: 130.81,
    taikoPulse: true,
  },
  swordsmith_village: {
    bpm: 126,
    scale: [246.94, 293.66, 329.63, 369.99, 440, 493.88, 587.33, 659.25],
    pattern: [0, 2, 4, 5, 4, 3, 2, 1],
    bassPattern: [0, 0, 3, 3, 2, 2, 4, 3],
    leadWave: 'triangle',
    subBassFreq: 123.47,
    taikoPulse: true,
  },
  hashira_grounds: {
    bpm: 134,
    scale: [293.66, 329.63, 392.0, 440, 523.25, 587.33, 659.25, 783.99],
    pattern: [0, 3, 4, 5, 6, 5, 4, 2],
    bassPattern: [0, 0, 2, 0, 3, 3, 4, 2],
    leadWave: 'triangle',
    subBassFreq: 146.83,
    taikoPulse: true,
  },
  infinity_castle: {
    bpm: 142,
    scale: [196.0, 207.65, 246.94, 293.66, 311.13, 392.0, 415.3, 493.88],
    pattern: [0, 3, 4, 6, 5, 4, 3, 1],
    bassPattern: [0, 0, 3, 0, 4, 0, 1, 2],
    leadWave: 'sawtooth',
    subBassFreq: 98.0,
    taikoPulse: true,
  },
  final_boss: {
    bpm: 156,
    scale: [220, 233.08, 277.18, 329.63, 349.23, 440, 466.16, 554.37],
    pattern: [0, 5, 4, 3, 6, 5, 4, 1],
    bassPattern: [0, 0, 3, 0, 4, 4, 1, 2],
    leadWave: 'sawtooth',
    subBassFreq: 110,
    taikoPulse: true,
  },
};

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private settings: AudioSettings = {
    muted: false,
    masterVolume: 0.8,
    musicVolume: 0.55,
    sfxVolume: 0.85,
    subtitlesEnabled: false,
  };

  private currentThemeKey: MapId | 'menu' | 'char_select' | 'final_boss' = 'menu';
  private musicIntervalId: ReturnType<typeof setInterval> | null = null;
  private musicStep = 0;

  public getSettings(): AudioSettings {
    return { ...this.settings };
  }

  public applySettings(settings: AudioSettings): void {
    this.settings = { ...settings };
    this.syncGainNodes();
  }

  public isMuted(): boolean {
    return this.settings.muted;
  }

  public setMuted(muted: boolean): void {
    this.settings.muted = muted;
    this.syncGainNodes();
  }

  public toggleMute(): boolean {
    this.settings.muted = !this.settings.muted;
    this.syncGainNodes();
    return this.settings.muted;
  }

  private syncGainNodes(): void {
    if (!this.ctx || !this.masterGain || !this.musicGain || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const master = this.settings.muted ? 0 : Math.max(0, Math.min(1, this.settings.masterVolume));
    const music = Math.max(0, Math.min(1, this.settings.musicVolume)) * 0.42;
    const sfx = Math.max(0, Math.min(1, this.settings.sfxVolume));

    this.masterGain.gain.setTargetAtTime(master, now, 0.03);
    this.musicGain.gain.setTargetAtTime(music, now, 0.05);
    this.sfxGain.gain.setTargetAtTime(sfx, now, 0.03);
  }

  public unlock(): void {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
      this.noiseBuffer = this.createNoiseBuffer(this.ctx);
      this.syncGainNodes();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    if (this.musicIntervalId === null) {
      this.startMusicSequencer();
    }
  }

  public setMapTheme(mapId: MapId | 'menu' | 'char_select', isBoss = false): void {
    const target: MapId | 'menu' | 'char_select' | 'final_boss' =
      mapId === 'infinity_castle' && isBoss ? 'final_boss' : mapId;
    if (this.currentThemeKey === target && this.musicIntervalId !== null) return;
    this.currentThemeKey = target;
    this.musicStep = 0;
    if (this.ctx) {
      this.startMusicSequencer();
    }
  }

  public stopMusic(): void {
    if (this.musicIntervalId !== null) {
      clearInterval(this.musicIntervalId);
      this.musicIntervalId = null;
    }
  }

  private startMusicSequencer(): void {
    this.stopMusic();
    if (typeof window === 'undefined') return;
    const spec = MAP_MUSIC_THEMES[this.currentThemeKey] ?? MAP_MUSIC_THEMES.bamboo_forest;
    const eighthMs = Math.round((60 / spec.bpm / 2) * 1000);

    this.musicIntervalId = setInterval(() => {
      if (!this.ctx || !this.musicGain || this.ctx.state === 'suspended' || this.settings.muted) {
        return;
      }
      if (this.settings.musicVolume <= 0.01 || this.settings.masterVolume <= 0.01) return;

      const theme = MAP_MUSIC_THEMES[this.currentThemeKey] ?? MAP_MUSIC_THEMES.bamboo_forest;
      const stepIdx = this.musicStep % theme.pattern.length;
      const noteIdx = theme.pattern[stepIdx];
      const bassIdx = theme.bassPattern[stepIdx];
      const now = this.ctx.currentTime;

      // Pluck / Shakuhachi lead + Koto octave pluck shimmer
      if (noteIdx >= 0) {
        const freq = theme.scale[noteIdx % theme.scale.length];
        const osc = this.ctx.createOscillator();
        osc.type = theme.leadWave;
        osc.frequency.setValueAtTime(freq, now);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(theme.leadWave === 'sawtooth' ? 1450 : 2200, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.13, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);
        osc.start(now);
        osc.stop(now + 0.36);

        if (stepIdx % 2 === 0) {
          const koto = this.ctx.createOscillator();
          koto.type = 'triangle';
          koto.frequency.setValueAtTime(freq * 2, now);
          const kGain = this.ctx.createGain();
          kGain.gain.setValueAtTime(0.001, now);
          kGain.gain.linearRampToValueAtTime(0.055, now + 0.008);
          kGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
          koto.connect(kGain);
          kGain.connect(this.musicGain);
          koto.start(now);
          koto.stop(now + 0.18);
        }
      }

      // Drone / shamisen bass
      if (bassIdx >= 0) {
        const bFreq = theme.subBassFreq * (1 + bassIdx * 0.125);
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(bFreq, now);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.16, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(now);
        osc.stop(now + 0.3);
      }

      // Taiko drum hit on strong beats
      if (theme.taikoPulse && (stepIdx === 0 || stepIdx === 4 || (this.currentThemeKey === 'final_boss' && stepIdx % 2 === 0))) {
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(stepIdx === 0 ? 96 : 82, now);
        osc.frequency.exponentialRampToValueAtTime(36, now + 0.18);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.24, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(now);
        osc.stop(now + 0.22);
      }

      this.musicStep += 1;
    }, eighthMs);
  }

  private createNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const length = ctx.sampleRate * 1.4;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  private ensureSfxReady(): { ctx: AudioContext; out: AudioNode } | null {
    if (this.settings.muted || this.settings.sfxVolume <= 0.01) return null;
    if (!this.ctx) this.unlock();
    if (!this.ctx || !this.sfxGain || this.ctx.state === 'suspended') return null;
    return { ctx: this.ctx, out: this.sfxGain };
  }

  public playSwordSlash(heavy = false): void {
    const ready = this.ensureSfxReady();
    if (!ready || !this.noiseBuffer) return;
    const { ctx, out } = ready;

    const now = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(heavy ? 880 : 1680, now);
    filter.frequency.exponentialRampToValueAtTime(heavy ? 220 : 440, now + (heavy ? 0.24 : 0.14));
    filter.Q.value = heavy ? 1.8 : 2.5;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(heavy ? 0.26 : 0.17, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (heavy ? 0.26 : 0.15));

    src.connect(filter);
    filter.connect(gain);
    gain.connect(out);
    src.start(now);
    src.stop(now + (heavy ? 0.28 : 0.17));
  }

  public playShotgunBlast(): void {
    const ready = this.ensureSfxReady();
    if (!ready || !this.noiseBuffer) return;
    const { ctx, out } = ready;
    const now = ctx.currentTime;

    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(2400, now);
    lp.frequency.exponentialRampToValueAtTime(180, now + 0.26);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.36, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    src.connect(lp);
    lp.connect(gain);
    gain.connect(out);
    src.start(now);
    src.stop(now + 0.3);
  }

  public playHit(heavy = false): void {
    const ready = this.ensureSfxReady();
    if (!ready) return;
    const { ctx, out } = ready;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = heavy ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(heavy ? 150 : 215, now);
    osc.frequency.exponentialRampToValueAtTime(36, now + (heavy ? 0.22 : 0.12));

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(heavy ? 0.34 : 0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (heavy ? 0.24 : 0.14));

    osc.connect(gain);
    gain.connect(out);
    osc.start(now);
    osc.stop(now + (heavy ? 0.25 : 0.15));

    if (this.noiseBuffer) {
      const nSrc = ctx.createBufferSource();
      nSrc.buffer = this.noiseBuffer;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 1400;
      const nGain = ctx.createGain();
      nGain.gain.setValueAtTime(heavy ? 0.22 : 0.14, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      nSrc.connect(hp);
      hp.connect(nGain);
      nGain.connect(out);
      nSrc.start(now);
      nSrc.stop(now + 0.1);
    }
  }

  public playParry(): void {
    const ready = this.ensureSfxReady();
    if (!ready) return;
    const { ctx, out } = ready;
    const now = ctx.currentTime;
    const freqs = [1180, 1790, 2640];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.exponentialRampToValueAtTime(f * 0.96, now + 0.28);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.11 / (idx + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc.connect(gain);
      gain.connect(out);
      osc.start(now);
      osc.stop(now + 0.34);
    });
  }

  public playSwordClash(): void {
    const ready = this.ensureSfxReady();
    if (!ready) return;
    const { ctx, out } = ready;
    const now = ctx.currentTime;
    const freqs = [920, 1520, 2380, 3150];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.exponentialRampToValueAtTime(f * 0.88, now + 0.34);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.14 / (idx + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
      osc.connect(gain);
      gain.connect(out);
      osc.start(now);
      osc.stop(now + 0.38);
    });
  }

  public playBreathingStyle(style: BreathingStyleId, formIndex: 1 | 2 | 3 | 4 | 5): void {
    const ready = this.ensureSfxReady();
    if (!ready || !this.noiseBuffer) return;
    const { ctx, out } = ready;
    const now = ctx.currentTime;
    const dur = 0.42 + formIndex * 0.06;

    const nSrc = ctx.createBufferSource();
    nSrc.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = style === 'thunder' || style === 'sound' ? 'highpass' : 'bandpass';

    const baseFreq =
      style === 'flame' || style === 'sun'
        ? 340
        : style === 'thunder'
          ? 1800
          : style === 'stone'
            ? 200
            : 650;
    filter.frequency.setValueAtTime(baseFreq, now);
    filter.frequency.exponentialRampToValueAtTime(baseFreq * 2.6, now + 0.16);
    filter.frequency.exponentialRampToValueAtTime(Math.max(120, baseFreq * 0.7), now + dur);

    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.01, now);
    nGain.gain.linearRampToValueAtTime(0.28, now + 0.05);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    nSrc.connect(filter);
    filter.connect(nGain);
    nGain.connect(out);
    nSrc.start(now);
    nSrc.stop(now + dur + 0.02);

    const osc = ctx.createOscillator();
    osc.type = style === 'thunder' || style === 'sound' ? 'sawtooth' : 'sine';
    const pitch =
      style === 'thunder'
        ? 780
        : style === 'sound'
          ? 240
          : style === 'stone'
            ? 120
            : 440 + formIndex * 65;
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(pitch * (style === 'thunder' ? 0.35 : 1.4), now + dur * 0.85);

    const oGain = ctx.createGain();
    oGain.gain.setValueAtTime(0.001, now);
    oGain.gain.linearRampToValueAtTime(0.15, now + 0.04);
    oGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(oGain);
    oGain.connect(out);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  public playBdaCast(): void {
    this.playDemonAttackSound('muzan', false);
  }

  public playDemonAttackSound(theme: DemonSfxTheme, isUltimate = false): void {
    const ready = this.ensureSfxReady();
    if (!ready) return;
    const { ctx, out } = ready;
    const now = ctx.currentTime;
    const dur = isUltimate ? 0.56 : 0.34;

    if (theme === 'biwa') {
      [196, 293.66].forEach((f, idx) => {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f * (isUltimate ? 1.25 : 1), now + idx * 0.02);
        osc.frequency.exponentialRampToValueAtTime(f * 0.92, now + dur);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.24, now + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
        osc.connect(gain);
        gain.connect(out);
        osc.start(now + idx * 0.02);
        osc.stop(now + dur + 0.04);
      });
      return;
    }

    if (theme === 'drum') {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(isUltimate ? 145 : 118, now);
      osc.frequency.exponentialRampToValueAtTime(38, now + dur);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.32, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
      osc.connect(gain);
      gain.connect(out);
      osc.start(now);
      osc.stop(now + dur + 0.03);
      return;
    }

    if (theme === 'ice') {
      [1320, 1980, 2640].forEach((f, idx) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * 0.025);
        osc.frequency.exponentialRampToValueAtTime(f * 1.18, now + dur);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.09, now + idx * 0.025);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
        osc.connect(gain);
        gain.connect(out);
        osc.start(now + idx * 0.025);
        osc.stop(now + dur + 0.04);
      });
      return;
    }

    const base =
      theme === 'thunder'
        ? 620
        : theme === 'moon_blade'
          ? 340
          : theme === 'sickle' || theme === 'obi_silk'
            ? 420
            : theme === 'martial'
              ? 190
              : 160;
    const osc = ctx.createOscillator();
    osc.type = theme === 'thunder' || theme === 'muzan' ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(base, now);
    osc.frequency.exponentialRampToValueAtTime(base * (isUltimate ? 2.4 : 1.7), now + 0.12);
    osc.frequency.exponentialRampToValueAtTime(Math.max(60, base * 0.55), now + dur);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = theme === 'thunder' ? 2400 : 1050;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(isUltimate ? 0.24 : 0.18, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(out);
    osc.start(now);
    osc.stop(now + dur + 0.04);
  }

  public playTransformation(): void {
    const ready = this.ensureSfxReady();
    if (!ready) return;
    const { ctx, out } = ready;
    const now = ctx.currentTime;
    [98, 146.83, 220, 329.63].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = i % 2 === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.04);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.12, now + 0.65);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 1100;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, now + i * 0.04);
      gain.gain.linearRampToValueAtTime(0.14, now + i * 0.04 + 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.72);
      osc.connect(lp);
      lp.connect(gain);
      gain.connect(out);
      osc.start(now + i * 0.04);
      osc.stop(now + 0.75);
    });
  }

  public playDemonRoar(): void {
    const ready = this.ensureSfxReady();
    if (!ready) return;
    const { ctx, out } = ready;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(52, now + 0.48);

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 460;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.24, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.52);

    osc.connect(lp);
    lp.connect(gain);
    gain.connect(out);
    osc.start(now);
    osc.stop(now + 0.54);
  }

  public playBossEntrance(): void {
    const ready = this.ensureSfxReady();
    if (!ready) return;
    const { ctx, out } = ready;
    const now = ctx.currentTime;
    [110, 164.81, 220].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.05);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, now + i * 0.05);
      gain.gain.linearRampToValueAtTime(0.2, now + i * 0.05 + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
      osc.connect(gain);
      gain.connect(out);
      osc.start(now + i * 0.05);
      osc.stop(now + 0.78);
    });
  }

  public playRockCrack(split = false): void {
    const ready = this.ensureSfxReady();
    if (!ready) return;
    const { ctx, out } = ready;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(split ? 130 : 190, now);
    osc.frequency.exponentialRampToValueAtTime(split ? 34 : 65, now + (split ? 0.45 : 0.16));

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(split ? 0.35 : 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (split ? 0.48 : 0.18));

    osc.connect(gain);
    gain.connect(out);
    osc.start(now);
    osc.stop(now + (split ? 0.5 : 0.2));
  }

  public playWoodBreak(): void {
    const ready = this.ensureSfxReady();
    if (!ready) return;
    const { ctx, out } = ready;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(85, now + 0.14);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(out);
    osc.start(now);
    osc.stop(now + 0.17);
  }

  public playFootstep(): void {
    const ready = this.ensureSfxReady();
    if (!ready) return;
    const { ctx, out } = ready;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(86, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.05);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
    osc.connect(gain);
    gain.connect(out);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  public playJump(): void {
    const ready = this.ensureSfxReady();
    if (!ready) return;
    const { ctx, out } = ready;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.11);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(out);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  public playDodge(): void {
    const ready = this.ensureSfxReady();
    if (!ready || !this.noiseBuffer) return;
    const { ctx, out } = ready;
    const now = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(900, now);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(out);
    src.start(now);
    src.stop(now + 0.12);
  }

  public playDemonTelegraph(): void {
    const ready = this.ensureSfxReady();
    if (!ready) return;
    const { ctx, out } = ready;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(95, now);
    osc.frequency.linearRampToValueAtTime(72, now + 0.25);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 380;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(out);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  public playRagdollThump(): void {
    const ready = this.ensureSfxReady();
    if (!ready) return;
    const { ctx, out } = ready;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.14);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(out);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playVictory(): void {
    const ready = this.ensureSfxReady();
    if (!ready) return;
    const { ctx, out } = ready;
    const now = ctx.currentTime;
    const notes = [392, 493.88, 587.33, 783.99];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.09);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, now + i * 0.09);
      gain.gain.linearRampToValueAtTime(0.14, now + i * 0.09 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.65);
      osc.connect(gain);
      gain.connect(out);
      osc.start(now + i * 0.09);
      osc.stop(now + i * 0.09 + 0.68);
    });
  }

  public playDefeat(): void {
    const ready = this.ensureSfxReady();
    if (!ready) return;
    const { ctx, out } = ready;
    const now = ctx.currentTime;
    const notes = [293.66, 261.63, 220, 164.81];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + i * 0.14);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 500;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, now + i * 0.14);
      gain.gain.linearRampToValueAtTime(0.11, now + i * 0.14 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.14 + 0.6);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(out);
      osc.start(now + i * 0.14);
      osc.stop(now + i * 0.14 + 0.62);
    });
  }
}
