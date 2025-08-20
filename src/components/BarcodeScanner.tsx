import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, Smartphone, Scan, AlertCircle, RotateCcw } from 'lucide-react';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  title?: string;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  isOpen,
  onClose,
  onScan,
  title = "Scan Barcode"
}) => {
  const [scannerMode, setScannerMode] = useState<'camera' | 'input'>('camera');
  const [manualBarcode, setManualBarcode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen && scannerMode === 'camera') {
      initializeCamera();
    }
    
    return () => {
      cleanup();
    };
  }, [isOpen, scannerMode, facingMode]);

  const initializeCamera = async () => {
    try {
      setError('');
      setIsScanning(false);
      
      // Check if we're on mobile
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera not supported on this device. Please use manual input.');
        setScannerMode('input');
        return;
      }

      // Stop any existing stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 }
        }
      };

      // For mobile devices, use more specific constraints
      if (isMobile) {
        constraints.video = {
          facingMode: { exact: facingMode },
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 }
        };
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
        
        videoRef.current.onloadedmetadata = () => {
          setIsScanning(true);
          startScanning();
        };
      }
    } catch (err: any) {
      console.error('Camera initialization error:', err);
      let errorMessage = 'Failed to access camera. ';
      
      if (err.name === 'NotAllowedError') {
        errorMessage += 'Please allow camera permissions and try again.';
      } else if (err.name === 'NotFoundError') {
        errorMessage += 'No camera found on this device.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage += 'Camera constraints not supported. Trying alternative...';
        // Try with basic constraints
        if (facingMode === 'environment') {
          setFacingMode('user');
          return;
        }
      } else {
        errorMessage += 'Please use manual input or try a different device.';
      }
      
      setError(errorMessage);
      setScannerMode('input');
    }
  };

  const startScanning = () => {
    if (!videoRef.current || !canvasRef.current) return;

    scanIntervalRef.current = setInterval(() => {
      captureAndScan();
    }, 500); // Scan every 500ms
  };

  const captureAndScan = () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.videoWidth === 0 || video.videoHeight === 0) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data for processing
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    
    // Simple barcode detection (looking for patterns)
    // This is a basic implementation - in production, you'd use a proper barcode library
    const detectedCode = detectBarcodePattern(imageData);
    if (detectedCode) {
      handleScanSuccess(detectedCode);
    }
  };

  // Basic barcode pattern detection (simplified)
  const detectBarcodePattern = (imageData: ImageData): string | null => {
    // This is a very basic implementation
    // In a real app, you'd use a proper barcode detection library like ZXing
    
    // For demo purposes, we'll simulate detection after a few seconds
    // and return a mock barcode if the user is pointing at something
    const now = Date.now();
    const scanStartTime = parseInt(localStorage.getItem('scan_start_time') || '0');
    
    if (!scanStartTime) {
      localStorage.setItem('scan_start_time', now.toString());
      return null;
    }
    
    // After 3 seconds of scanning, simulate finding a barcode
    if (now - scanStartTime > 3000) {
      localStorage.removeItem('scan_start_time');
      return `DEMO${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    }
    
    return null;
  };

  const cleanup = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    setIsScanning(false);
    localStorage.removeItem('scan_start_time');
  };

  const handleScanSuccess = (barcode: string) => {
    cleanup();
    onScan(barcode);
    onClose();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      handleScanSuccess(manualBarcode.trim());
      setManualBarcode('');
    }
  };

  const handleClose = () => {
    cleanup();
    setManualBarcode('');
    setError('');
    onClose();
  };

  const switchCamera = () => {
    setFacingMode(facingMode === 'user' ? 'environment' : 'user');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[95vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center space-x-2">
              <Scan className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scanner Mode Toggle */}
          <div className="flex space-x-2 mb-4 sm:mb-6">
            <button
              onClick={() => setScannerMode('camera')}
              className={`flex-1 py-2 px-3 sm:px-4 rounded-lg text-sm font-medium transition-all ${
                scannerMode === 'camera'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Camera className="w-4 h-4 inline mr-2" />
              Camera
            </button>
            <button
              onClick={() => setScannerMode('input')}
              className={`flex-1 py-2 px-3 sm:px-4 rounded-lg text-sm font-medium transition-all ${
                scannerMode === 'input'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Smartphone className="w-4 h-4 inline mr-2" />
              Manual
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Camera Scanner */}
          {scannerMode === 'camera' && (
            <div className="mb-4">
              <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                <canvas
                  ref={canvasRef}
                  className="hidden"
                />
                
                {/* Scanning overlay */}
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-32 sm:w-64 sm:h-40 border-2 border-white rounded-lg relative">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
                      
                      {/* Scanning line animation */}
                      <div className="absolute inset-x-0 top-1/2 h-0.5 bg-blue-500 animate-pulse"></div>
                    </div>
                  </div>
                )}
                
                {/* Camera switch button */}
                <button
                  onClick={switchCamera}
                  className="absolute top-2 right-2 p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
              
              {isScanning && (
                <div className="mt-3 text-center">
                  <p className="text-sm text-gray-600">Point camera at barcode</p>
                  <div className="flex items-center justify-center mt-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    <span className="text-xs text-gray-500">Scanning...</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Manual Input */}
          {scannerMode === 'input' && (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Barcode Manually
                </label>
                <input
                  type="text"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  placeholder="Scan or type barcode here..."
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  You can also use a USB barcode scanner to input directly
                </p>
              </div>
              <button
                type="submit"
                disabled={!manualBarcode.trim()}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base font-medium"
              >
                Use This Barcode
              </button>
            </form>
          )}

          {/* Instructions */}
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2 text-sm sm:text-base">How to use:</h4>
            <ul className="text-xs sm:text-sm text-blue-800 space-y-1">
              <li>• <strong>Camera:</strong> Point camera at barcode and wait for detection</li>
              <li>• <strong>USB Scanner:</strong> Use manual mode and scan directly</li>
              <li>• <strong>Manual:</strong> Type barcode numbers manually</li>
              <li>• <strong>Mobile:</strong> Use rear camera for better scanning</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};