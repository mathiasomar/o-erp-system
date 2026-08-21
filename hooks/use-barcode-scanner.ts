"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";

type ScannerState = {
  isScanning: boolean;
  error: string | null;
  hasCamera: boolean;
};

type UseBarcodeScanner = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  startScan: () => Promise<void>;
  stopScan: () => void;
  isScanning: boolean;
  error: string | null;
  hasCamera: boolean;
};

export const useBarcodeScanner = (
  onDetected: (barcode: string) => void,
): UseBarcodeScanner => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [state, setState] = useState<ScannerState>({
    isScanning: false,
    error: null,
    hasCamera: false,
  });

  // Check for camera on mount
  useEffect(() => {
    const check = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasVideo = devices.some((d) => d.kind === "videoinput");
        setState((s) => ({ ...s, hasCamera: hasVideo }));
      } catch {
        setState((s) => ({ ...s, hasCamera: false }));
      }
    };
    check();
  }, []);

  const stopScan = useCallback(() => {
    readerRef.current?.reset();
    readerRef.current = null;
    setState((s) => ({ ...s, isScanning: false, error: null }));
  }, []);

  const startScan = useCallback(async () => {
    if (!videoRef.current) return;

    try {
      setState((s) => ({ ...s, isScanning: true, error: null }));

      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      console.log("Starting barcode scan...");

      try {
        await reader.decodeFromVideoDevice(
          null, // use default camera
          videoRef.current,
          (result, err) => {
            if (result) {
              console.log("Barcode detected:", result.getText());
              const barcode = result.getText();
              setState((s) => ({ ...s, isScanning: false }));
              reader.reset();
              readerRef.current = null;
              onDetected(barcode);
              return;
            }
            if (err && !(err instanceof NotFoundException)) {
              console.error("Scanner error:", err);
            }
          },
        );
        console.log("Scanning active");
      } catch (scanErr) {
        console.error("Scan initialization error:", scanErr);
        const message =
          scanErr instanceof Error
            ? scanErr.message
            : "Failed to access camera";
        setState((s) => ({ ...s, isScanning: false, error: message }));
      }
    } catch (err) {
      console.error("Camera error:", err);
      const message = err instanceof Error ? err.message : "Camera error";
      setState((s) => ({ ...s, isScanning: false, error: message }));
    }
  }, [onDetected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      readerRef.current?.reset();
    };
  }, []);

  return {
    videoRef,
    startScan,
    stopScan,
    isScanning: state.isScanning,
    error: state.error,
    hasCamera: state.hasCamera,
  };
};
