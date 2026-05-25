export class ActiveTimeTracker {
  private tickMap = new Map<string, number>(); // taskId → start timestamp ms

  startTick(taskId: string): void {
    if (!this.tickMap.has(taskId)) {
      this.tickMap.set(taskId, Date.now());
    }
  }

  stopTick(taskId: string): number {
    const start = this.tickMap.get(taskId);
    if (start == null) return 0;
    this.tickMap.delete(taskId);
    return Math.floor((Date.now() - start) / 1000);
  }

  stopAll(): Array<{ taskId: string; seconds: number }> {
    const results: Array<{ taskId: string; seconds: number }> = [];
    for (const taskId of Array.from(this.tickMap.keys())) {
      results.push({ taskId, seconds: this.stopTick(taskId) });
    }
    return results;
  }

  isTracking(taskId: string): boolean {
    return this.tickMap.has(taskId);
  }
}
