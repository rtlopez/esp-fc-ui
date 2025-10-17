
export default class TimedLock {

  private timer: ReturnType<typeof setTimeout> | null = null;

  acquire(durationMs: number = 100): boolean {
    if (this.timer !== null) return false
    this.timer = setTimeout(() => {
      this.timer = null;
    }, durationMs);
    return true
  }

  release(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  isActive(): boolean {
    return this.timer !== null;
  }
}
