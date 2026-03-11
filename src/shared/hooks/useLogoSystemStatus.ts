import { useCallback, useEffect, useRef, type MouseEvent } from "react";
import { useSystemStatusStore } from "../store/systemStatusStore";

type Options = {
  requiredClicks?: number;
  resetAfterMs?: number;
};

export const useLogoSystemStatus = ({ requiredClicks = 5, resetAfterMs = 900 }: Options = {}) => {
  const openModal = useSystemStatusStore((s) => s.openModal);
  const clickCountRef = useRef(0);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const onLogoClick = useCallback(
    (event: MouseEvent) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      clickCountRef.current += 1;

      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => {
        clickCountRef.current = 0;
      }, resetAfterMs);

      if (clickCountRef.current >= requiredClicks) {
        event.preventDefault();
        clickCountRef.current = 0;
        if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
        openModal();
      }
    },
    [openModal, requiredClicks, resetAfterMs],
  );

  return { onLogoClick };
};
