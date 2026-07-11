import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { debounce } from "./debounce";

describe("debounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("waits for the delay before calling the function", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 400);

    debounced("x");
    vi.advanceTimersByTime(399);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("x");
  });

  it("only fires once for rapid repeated calls, using the final call's arguments", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 400);

    debounced("a");
    vi.advanceTimersByTime(100);
    debounced("b");
    vi.advanceTimersByTime(100);
    debounced("c");

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(400);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("c");
  });

  it("cancel() prevents a pending call from firing (e.g. on component unmount)", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 400);

    debounced("x");
    debounced.cancel();
    vi.advanceTimersByTime(1000);

    expect(fn).not.toHaveBeenCalled();
  });

  it("cancel() is a no-op when nothing is pending", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 400);

    expect(() => debounced.cancel()).not.toThrow();
  });
});
