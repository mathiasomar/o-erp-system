"use client";

import { useEffect, useRef, useCallback } from "react";

// USB barcode scanners act as a "keyboard wedge" — they type each
// character extremely fast (< 50ms between chars) then send Enter.
// Human typing is > 100ms between keystrokes, so we can reliably tell them apart.

const SCANNER_CHAR_DELAY_MS = 100; // scanners type faster than this (relaxed to 100ms)
const BUFFER_RESET_MS = 500; // clear buffer after this much inactivity (relaxed to 500ms)
const MIN_BARCODE_LENGTH = 1; // minimum barcode length (relaxed to 1 for testing)

export const useKeyboardScanner = (
  onDetected: (barcode: string) => void | Promise<void>,
  enabled = true,
) => {
  const bufferRef = useRef<string>("");
  const lastKeyTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const onDetectedRef = useRef(onDetected);

  // Update the ref when callback changes
  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);

  const handler = useCallback(
    (e: KeyboardEvent) => {
      const now = Date.now();
      const elapsed = now - lastKeyTimeRef.current;

      // If gap too large — human typing started, reset buffer
      if (elapsed > BUFFER_RESET_MS && bufferRef.current.length > 0) {
        console.log("[Scanner] Buffer reset due to inactivity, elapsed:", elapsed);
        bufferRef.current = "";
      }

      // On Enter — if we have a buffered barcode from a scanner, fire it
      if (e.key === "Enter") {
        const barcode = bufferRef.current.trim();
        bufferRef.current = "";
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }

        console.log("[Scanner] Enter pressed, barcode:", barcode, "length:", barcode.length, "elapsed:", elapsed);

        if (barcode.length >= MIN_BARCODE_LENGTH && !isProcessingRef.current) {
          e.preventDefault(); // don't trigger form submits
          isProcessingRef.current = true;
          console.log("[Scanner] Processing barcode:", barcode);
          
          // Use the ref to get the current callback
          const result = onDetectedRef.current(barcode);
          if (result instanceof Promise) {
            result.finally(() => {
              isProcessingRef.current = false;
              console.log("[Scanner] Processing complete for:", barcode);
            });
          } else {
            isProcessingRef.current = false;
            console.log("[Scanner] Processing complete (sync) for:", barcode);
          }
        } else if (isProcessingRef.current) {
          console.log("[Scanner] Ignored - already processing");
        } else {
          console.log("[Scanner] Ignored - barcode too short:", barcode.length);
        }
        return;
      }

      // Only buffer single printable characters
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Relaxed timing check - just log it but still buffer
        if (elapsed > SCANNER_CHAR_DELAY_MS) {
          console.log("[Scanner] Slower keystroke, elapsed:", elapsed, "but buffering anyway");
        }

        // Buffer the character regardless of timing (more lenient)
        bufferRef.current += e.key;
        lastKeyTimeRef.current = now;
        console.log("[Scanner] Buffered char:", e.key, "elapsed:", elapsed, "buffer:", bufferRef.current);

        // Auto-reset buffer if no Enter comes within BUFFER_RESET_MS
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(() => {
          console.log("[Scanner] Buffer timeout reset");
          bufferRef.current = "";
          timerRef.current = null;
        }, BUFFER_RESET_MS);
      }
    },
    [], // Empty dependency array - handler never changes
  );

  useEffect(() => {
    if (!enabled) return;
    console.log("[Scanner] Keyboard scanner enabled");
    window.addEventListener("keydown", handler);
    return () => {
      console.log("[Scanner] Keyboard scanner disabled");
      window.removeEventListener("keydown", handler);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [enabled, handler]);
};
