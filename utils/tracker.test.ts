import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ActiveTimeTracker } from './tracker';

describe('ActiveTimeTracker', () => {
  let tracker: ActiveTimeTracker;

  beforeEach(() => {
    tracker = new ActiveTimeTracker();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reports not tracking before startTick', () => {
    expect(tracker.isTracking('task-1')).toBe(false);
  });

  it('reports tracking after startTick', () => {
    tracker.startTick('task-1');
    expect(tracker.isTracking('task-1')).toBe(true);
  });

  it('returns 0 for a task never tracked', () => {
    expect(tracker.stopTick('task-1')).toBe(0);
  });

  it('returns elapsed seconds on stopTick', () => {
    tracker.startTick('task-1');
    vi.advanceTimersByTime(5000);
    expect(tracker.stopTick('task-1')).toBe(5);
  });

  it('stops tracking after stopTick', () => {
    tracker.startTick('task-1');
    tracker.stopTick('task-1');
    expect(tracker.isTracking('task-1')).toBe(false);
  });

  it('ignores duplicate startTick — counts from the first call', () => {
    tracker.startTick('task-1');
    vi.advanceTimersByTime(3000);
    tracker.startTick('task-1');
    vi.advanceTimersByTime(2000);
    expect(tracker.stopTick('task-1')).toBe(5);
  });

  it('stopAll returns seconds for every tracked task', () => {
    tracker.startTick('task-1');
    tracker.startTick('task-2');
    vi.advanceTimersByTime(4000);
    const results = tracker.stopAll();
    expect(results).toHaveLength(2);
    expect(results.every(r => r.seconds === 4)).toBe(true);
  });

  it('stopAll clears all tracking state', () => {
    tracker.startTick('task-1');
    tracker.stopAll();
    expect(tracker.isTracking('task-1')).toBe(false);
  });
});
