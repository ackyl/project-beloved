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
  impact(broken: boolean, hard: boolean) {
    this.tone(hard ? 210 : 145, broken ? 0.15 : 0.09, 0.052, 0, "triangle", 43);
    this.tone(670, 0.038, 0.011, 0, "square", 190);
  }
  pulse() {
    [0, 0.21, 0.42].forEach((delay, i) =>
      this.tone(370 + (i % 2) * 70, 0.2, 0.032, delay),
    );
  }
  item() {
    this.tone(630, 0.12, 0.025);
    this.tone(840, 0.16, 0.02, 0.08);
  }
}
