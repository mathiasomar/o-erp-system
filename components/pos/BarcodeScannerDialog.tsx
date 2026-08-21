"use client";

import { useEffect } from "react";
import { useBarcodeScanner } from "@/hooks/use-barcode-scanner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Scan, ScanLine, CameraOff, X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  onDetected: (barcode: string) => void;
};

export const BarcodeScannerDialog = ({ open, onClose, onDetected }: Props) => {
  const { videoRef, startScan, stopScan, isScanning, error, hasCamera } =
    useBarcodeScanner((barcode) => {
      onDetected(barcode);
      onClose();
    });

  // Start scanning when dialog opens
  useEffect(() => {
    if (open && hasCamera) {
      startScan();
    }
    return () => {
      stopScan();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, hasCamera]);

  const handleClose = () => {
    stopScan();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm p-0 overflow-hidden gap-0">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="flex items-center gap-2">
            <Scan size={16} />
            Scan barcode
          </DialogTitle>
          <DialogDescription>
            Point your camera at a product barcode
          </DialogDescription>
        </DialogHeader>

        {/* Camera viewport */}
        <div className="relative bg-black aspect-video overflow-hidden">
          {hasCamera ? (
            <>
              {/* Video feed */}
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />

              {/* Scan overlay */}
              {isScanning && (
                <div
                  className="absolute inset-0 flex items-center
                                justify-center pointer-events-none"
                >
                  {/* Corner marks */}
                  <div className="relative w-52 h-36">
                    {/* TL */}
                    <div
                      className="absolute top-0 left-0 w-6 h-6
                                    border-t-2 border-l-2 border-white"
                    />
                    {/* TR */}
                    <div
                      className="absolute top-0 right-0 w-6 h-6
                                    border-t-2 border-r-2 border-white"
                    />
                    {/* BL */}
                    <div
                      className="absolute bottom-0 left-0 w-6 h-6
                                    border-b-2 border-l-2 border-white"
                    />
                    {/* BR */}
                    <div
                      className="absolute bottom-0 right-0 w-6 h-6
                                    border-b-2 border-r-2 border-white"
                    />

                    {/* Animated scan line */}
                    <div
                      className="absolute left-0 right-0 h-0.5
                                    bg-green-400 animate-scan-line"
                    />
                  </div>
                </div>
              )}

              {/* Status badge */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2">
                <Badge
                  variant="secondary"
                  className="bg-black/60 text-white border-0 gap-1.5"
                >
                  <ScanLine size={11} className="animate-pulse" />
                  {isScanning ? "Scanning..." : "Starting..."}
                </Badge>
              </div>
            </>
          ) : (
            /* No camera fallback */
            <div
              className="flex flex-col items-center justify-center
                            h-full gap-3 p-6 text-center"
            >
              <CameraOff size={32} className="text-muted-foreground/50" />
              <div>
                <p className="text-sm font-medium text-white">
                  No camera found
                </p>
                <p className="text-xs text-white/60 mt-1">
                  Enter the barcode manually in the search box
                </p>
              </div>
            </div>
          )}

          {/* Error overlay */}
          {error && (
            <div
              className="absolute inset-0 flex items-center justify-center
                            bg-black/80 p-4 text-center"
            >
              <div>
                <CameraOff
                  size={24}
                  className="text-destructive mx-auto mb-2"
                />
                <p className="text-sm text-white font-medium">Camera error</p>
                <p className="text-xs text-white/60 mt-1">{error}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={startScan}
                >
                  Try again
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 flex justify-between items-center">
          <p className="text-xs text-muted-foreground">
            Supported: EAN-13, Code 128, QR, UPC-A
          </p>
          <Button variant="outline" size="sm" onClick={handleClose}>
            <X size={13} className="mr-1.5" /> Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
