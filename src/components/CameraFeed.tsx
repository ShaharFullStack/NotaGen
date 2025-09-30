import { useEffect, RefObject } from 'react';

interface CameraFeedProps {
  videoRef: RefObject<HTMLVideoElement>;
}

export default function CameraFeed({ videoRef }: CameraFeedProps) {
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Camera access failed:', error);
      }
    };

    startCamera();
  }, [videoRef]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        opacity: 0.3,
        zIndex: 1
      }}
    />
  );
}