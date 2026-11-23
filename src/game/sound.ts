// Short synthesized cues. Audio never drives simulation or conveys a clue alone.
export class Sound {
  private ctx: AudioContext | null = null;
  enabled = false;
  async toggle() {
    if (this.enabled) {
      this.enabled = false;
      await this.ctx?.suspend();
      return;
    }
    if (!window.AudioContext) return;
    this.ctx ??= new AudioContext();
    await this.ctx.resume();
    this.enabled = true;
    this.tone(370, 0.07, 0.026);
  }
  silence() {
    if (this.ctx?.state === "running") void this.ctx.suspend();
  }
  wake() {
    if (this.enabled && this.ctx?.state === "suspended")
      void this.ctx.resume().catch(() => {});
  }
  private tone(
    freq: number,
    dur: number,
    level: number,
    at = 0,
    type: OscillatorType = "sine",
    end = freq,
  ) {
    const c = this.ctx;
    if (!this.enabled || !c || c.state !== "running") return;
    const o = c.createOscillator(),
      v = c.createGain(),
      start = c.currentTime + at;
    o.type = type;
    o.frequency.setValueAtTime(freq, start);
    o.frequency.exponentialRampToValueAtTime(end, start + dur);
    v.gain.setValueAtTime(0.0001, start);
    v.gain.exponentialRampToValueAtTime(level, start + 0.006);
    v.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(v);
    v.connect(c.destination);
    o.start(start);
    o.stop(start + dur + 0.01);
    o.onended = () => {
      o.disconnect();
      v.disconnect();
    };
  }
  /** Soft UI confirmation. */
  blip() {
    this.tone(520, 0.08, 0.02);
  }
  jump() {
    this.tone(330, 0.09, 0.018, 0, "triangle", 520);
  }
  land() {
    this.tone(120, 0.08, 0.03, 0, "triangle", 60);
  }
  grab() {
    this.tone(260, 0.05, 0.02, 0, "square", 320);
  }
  throw() {
    this.tone(420, 0.12, 0.018, 0, "triangle", 200);
  }
  bonk() {
    this.tone(700, 0.06, 0.03, 0, "square", 350);
    this.tone(500, 0.08, 0.02, 0.06, "square", 260);
  }
  /** A comic slide-whistle and clunk. New deaths get a little fanfare on top. */
  death(isNew: boolean) {
    this.tone(880, 0.45, 0.03, 0, "triangle", 140);
    this.tone(90, 0.16, 0.05, 0.42, "square", 50);
    if (isNew)
      [0, 0.12, 0.24].forEach((at, i) => this.tone([523, 659, 784][i], 0.16, 0.025, 0.7 + at, "triangle"));
  }
  ding() {
    this.tone(1046, 0.5, 0.025);
    this.tone(1568, 0.4, 0.012, 0.02);
  }
  bell() {
    this.tone(1318, 0.25, 0.02, 0, "triangle");
    this.tone(1318, 0.25, 0.02, 0.3, "triangle");
  }
  warn() {
    this.tone(440, 0.15, 0.02, 0, "square");
    this.tone(440, 0.15, 0.02, 0.3, "square");
  }
  slam() {
    this.tone(70, 0.3, 0.06, 0, "square", 35);
  }
  speak() {
    this.tone(600, 0.04, 0.012, 0, "triangle", 680);
    this.tone(560, 0.04, 0.012, 0.06, "triangle", 500);
  }
}
