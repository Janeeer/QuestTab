import '@testing-library/jest-dom';

let storage: Record<string, unknown> = {};

beforeEach(() => {
  storage = {};
  vi.clearAllMocks();
});

(global as any).chrome = {
  storage: {
    local: {
      get: vi.fn((keys: string | string[] | null, callback: (r: Record<string, unknown>) => void) => {
        if (typeof keys === 'string') {
          callback({ [keys]: storage[keys] });
        } else if (Array.isArray(keys)) {
          const result: Record<string, unknown> = {};
          (keys as string[]).forEach(k => { result[k] = storage[k]; });
          callback(result);
        } else {
          callback({ ...storage });
        }
      }),
      set: vi.fn((items: Record<string, unknown>, callback?: () => void) => {
        Object.assign(storage, items);
        callback?.();
      }),
    },
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  tabs: {
    query: vi.fn(),
    create: vi.fn(),
    onActivated: { addListener: vi.fn() },
    onUpdated: { addListener: vi.fn() },
    onRemoved: { addListener: vi.fn() },
  },
  windows: {
    onFocusChanged: { addListener: vi.fn() },
    WINDOW_ID_NONE: -1,
  },
  scripting: {
    executeScript: vi.fn(),
  },
};
