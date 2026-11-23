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
  /** Soft UI confirmation. Chunk 4 adds death stingers and the replicator ding. */
  blip() {
    this.tone(520, 0.08, 0.02);
  }
}
