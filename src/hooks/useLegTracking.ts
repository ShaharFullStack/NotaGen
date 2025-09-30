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

      // Calculate distance from center (normalized screen coordinates)
      const distance = Math.sqrt(x * x + y * y);

      // Calculate angle for slice selection
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

        // Check if video is ready (has dimensions and has loaded enough data)
        const video = videoRef.current;
        if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
          animationFrameId = requestAnimationFrame(detect);
          return;
        }

        const currentTime = performance.now();

        if (video.currentTime !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = video.currentTime;

          const results = poseLandmarkerRef.current.detectForVideo(
            video,
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

            // Minimum distance threshold to activate (about 5% of screen)
            const minDistance = 0.05;

            if (leftVisible) {
              const pos = calculateLegPosition(leftAnkle, leftHip);
              // Only activate if leg moved beyond minimum threshold
              const isActive = pos.distance > minDistance;
              setLeftLegData({ ...pos, isActive });
            } else {
              setLeftLegData(prev => ({ ...prev, isActive: false }));
            }

            if (rightVisible) {
              const pos = calculateLegPosition(rightAnkle, rightHip);
              // Only activate if leg moved beyond minimum threshold
              const isActive = pos.distance > minDistance;
              setRightLegData({ ...pos, isActive });
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