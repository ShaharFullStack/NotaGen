import { useState, useEffect, useRef, RefObject } from 'react';
import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export interface LegData {
  slice: number;
  x: number;
  y: number;
  distance: number;
  isActive: boolean;
}

export function useLegTracking(
  videoRef: RefObject<HTMLVideoElement>,
  isCalibrated: boolean
) {
  const [leftLegData, setLeftLegData] = useState<LegData>({
    slice: -1,
    x: 0,
    y: 0,
    distance: 0,
    isActive: false
  });

  const [rightLegData, setRightLegData] = useState<LegData>({
    slice: -1,
    x: 0,
    y: 0,
    distance: 0,
    isActive: false
  });

  const [trackingReady, setTrackingReady] = useState(false);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const calibrationRef = useRef({ centerX: 0, centerY: 0, isCalibrated: false });
  const lastVideoTimeRef = useRef(-1);
  const numSlices = 8;

  useEffect(() => {
    let animationFrameId: number;

    const initializeMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        poseLandmarkerRef.current = poseLandmarker;
        setTrackingReady(true);

        // Start detection loop
        detectPose();
      } catch (error) {
        console.error('MediaPipe initialization failed:', error);
      }
    };

    const calculateLegPosition = (ankle: any, hip: any) => {
      let x = ankle.x;
      let y = ankle.y;

      if (calibrationRef.current.isCalibrated) {
        x -= calibrationRef.current.centerX;
        y -= calibrationRef.current.centerY;
      }

      const distance = Math.sqrt(x * x + y * y) * 1000;
      let angle = Math.atan2(y, x);
      let degrees = (angle * 180 / Math.PI + 360) % 360;
      const sliceAngle = 360 / numSlices;
      const slice = Math.floor(degrees / sliceAngle);

      return { slice, distance, x, y };
    };

    const detectPose = () => {
      const detect = async () => {
        if (!poseLandmarkerRef.current || !videoRef.current) {
          animationFrameId = requestAnimationFrame(detect);
          return;
        }

        const currentTime = performance.now();

        if (videoRef.current.currentTime !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = videoRef.current.currentTime;

          const results = poseLandmarkerRef.current.detectForVideo(
            videoRef.current,
            currentTime
          );

          if (!results.landmarks || results.landmarks.length === 0) {
            setLeftLegData(prev => ({ ...prev, isActive: false }));
            setRightLegData(prev => ({ ...prev, isActive: false }));
          } else {
            const landmarks = results.landmarks[0];
            const leftAnkle = landmarks[27];
            const rightAnkle = landmarks[28];
            const leftHip = landmarks[23];
            const rightHip = landmarks[24];

            const leftVisible = leftAnkle.visibility > 0.5;
            const rightVisible = rightAnkle.visibility > 0.5;

            if (leftVisible) {
              const pos = calculateLegPosition(leftAnkle, leftHip);
              setLeftLegData({ ...pos, isActive: true });
            } else {
              setLeftLegData(prev => ({ ...prev, isActive: false }));
            }

            if (rightVisible) {
              const pos = calculateLegPosition(rightAnkle, rightHip);
              setRightLegData({ ...pos, isActive: true });
            } else {
              setRightLegData(prev => ({ ...prev, isActive: false }));
            }
          }
        }

        animationFrameId = requestAnimationFrame(detect);
      };

      detect();
    };

    initializeMediaPipe();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [videoRef]);

  const calibrate = async () => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        let totalX = 0;
        let totalY = 0;
        let count = 0;

        if (leftLegData.isActive) {
          totalX += leftLegData.x;
          totalY += leftLegData.y;
          count++;
        }

        if (rightLegData.isActive) {
          totalX += rightLegData.x;
          totalY += rightLegData.y;
          count++;
        }

        if (count > 0) {
          calibrationRef.current = {
            centerX: totalX / count,
            centerY: totalY / count,
            isCalibrated: true
          };
        } else {
          calibrationRef.current = {
            centerX: 0.5,
            centerY: 0.5,
            isCalibrated: true
          };
        }

        resolve();
      }, 1000);
    });
  };

  return {
    leftLegData,
    rightLegData,
    calibrate,
    trackingReady
  };
}