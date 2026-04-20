import { describe, it, expect, vi, beforeEach } from "vite-plus/test";
import { renderHook } from "@testing-library/react";
import { useSwipeNavigation } from "./useSwipeNavigation";

const mockNavigate = vi.fn();
let mockPathname = "/";

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: mockPathname }),
}));

function createRef(el: HTMLElement) {
  return { current: el };
}

function swipe(el: HTMLElement, startX: number, endX: number, startY = 200, endY = 200) {
  el.dispatchEvent(
    new TouchEvent("touchstart", {
      touches: [{ clientX: startX, clientY: startY } as Touch],
    }),
  );
  el.dispatchEvent(
    new TouchEvent("touchend", {
      changedTouches: [{ clientX: endX, clientY: endY } as Touch],
    }),
  );
}

describe("useSwipeNavigation", () => {
  let el: HTMLElement;

  beforeEach(() => {
    mockNavigate.mockClear();
    mockPathname = "/";
    el = document.createElement("div");
    document.body.appendChild(el);
  });

  afterEach(() => {
    el.remove();
  });

  it("navigates to /watchlist on swipe left from dashboard", () => {
    const ref = createRef(el);
    renderHook(() => useSwipeNavigation(ref));

    swipe(el, 300, 100);
    expect(mockNavigate).toHaveBeenCalledWith("/watchlist");
  });

  it("navigates to / on swipe right from watchlist", () => {
    mockPathname = "/watchlist";
    const ref = createRef(el);
    renderHook(() => useSwipeNavigation(ref));

    swipe(el, 100, 300);
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("does not navigate on swipe right from dashboard (already first)", () => {
    const ref = createRef(el);
    renderHook(() => useSwipeNavigation(ref));

    swipe(el, 100, 300);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("does not navigate on swipe left from watchlist (already last)", () => {
    mockPathname = "/watchlist";
    const ref = createRef(el);
    renderHook(() => useSwipeNavigation(ref));

    swipe(el, 300, 100);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("ignores swipe below distance threshold", () => {
    const ref = createRef(el);
    renderHook(() => useSwipeNavigation(ref));

    swipe(el, 300, 270);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("ignores swipe with too much vertical movement", () => {
    const ref = createRef(el);
    renderHook(() => useSwipeNavigation(ref));

    swipe(el, 300, 100, 200, 350);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("ignores swipe on non-swipeable routes", () => {
    mockPathname = "/settings";
    const ref = createRef(el);
    renderHook(() => useSwipeNavigation(ref));

    swipe(el, 300, 100);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("ignores swipe on show detail pages", () => {
    mockPathname = "/show/123";
    const ref = createRef(el);
    renderHook(() => useSwipeNavigation(ref));

    swipe(el, 300, 100);
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
