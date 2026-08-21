"use client";

import { useState } from "react";
import { useKeyboardScanner } from "@/hooks/use-keyboard-scanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function BarcodeTest() {
  const [scannedCodes, setScannedCodes] = useState<string[]>([]);
  const [lastScan, setLastScan] = useState<string>("");

  useKeyboardScanner((barcode) => {
    console.log("[Test] Barcode scanned:", barcode);
    setLastScan(barcode);
    setScannedCodes(prev => [...prev, barcode]);
  });

  const clearHistory = () => {
    setScannedCodes([]);
    setLastScan("");
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Barcode Scanner Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground mb-2">Last scanned barcode:</p>
          <p className="text-2xl font-mono font-bold">{lastScan || "None"}</p>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm font-medium">Scan history:</p>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {scannedCodes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No scans yet</p>
            ) : (
              scannedCodes.map((code, index) => (
                <div key={index} className="text-sm font-mono bg-muted p-2 rounded">
                  {index + 1}. {code}
                </div>
              ))
            )}
          </div>
        </div>

        <Button onClick={clearHistory} variant="outline" className="w-full">
          Clear History
        </Button>

        <div className="text-xs text-muted-foreground">
          <p>Instructions:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Scan a barcode with your USB scanner</li>
            <li>Or type quickly and press Enter to simulate</li>
            <li>Check browser console for detailed logs</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
