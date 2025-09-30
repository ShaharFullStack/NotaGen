import { useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import ControlPanel from './components/ControlPanel';
import Visualizer from './components/Visualizer';
import CameraFeed from './components/CameraFeed';
import StatusBar from './components/StatusBar';
import { useLegTracking } from './hooks/useLegTracking';
import { useAudioSystem } from './hooks/useAudioSystem';

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [status, setStatus] = useState('Initializing...');
  const [error, setError] = useState('');

  // Initialize audio system
  const {
    audioReady,
    currentScale,
    currentChords,
    playMelodyNote,
    stopMelodyNote,
    playHarmonyChord,
    stopHarmonyChord,
    changeScale,
    changeSoundPreset
  } = useAudioSystem();

  // Initialize leg tracking
  const {
    leftLegData,
    rightLegData,
    calibrate,
    trackingReady
  } = useLegTracking(videoRef, isCalibrated);

  // Handle left leg audio updates
  useEffect(() => {
    if (leftLegData.isActive && isCalibrated && audioReady) {
      // Map distance to expression (0.05-0.3 range normalized to 0-1)
      const normalizedDistance = Math.max(0, (leftLegData.distance - 0.05) / 0.25);
      const expression = Math.min(normalizedDistance, 1.0) * 0.7 + 0.3; // 0.3-1.0 range
      playMelodyNote(leftLegData.slice, expression);
    } else {
      stopMelodyNote();
    }
  }, [leftLegData.isActive, leftLegData.slice, leftLegData.distance, isCalibrated, audioReady, playMelodyNote, stopMelodyNote]);

  // Handle right leg audio updates
  useEffect(() => {
    if (rightLegData.isActive && isCalibrated && audioReady) {
      // Map distance to expression (0.05-0.3 range normalized to 0-1)
      const normalizedDistance = Math.max(0, (rightLegData.distance - 0.05) / 0.25);
      const expression = Math.min(normalizedDistance, 1.0) * 0.7 + 0.3; // 0.3-1.0 range
      playHarmonyChord(rightLegData.slice, expression);
    } else {
      stopHarmonyChord();
    }
  }, [rightLegData.isActive, rightLegData.slice, rightLegData.distance, isCalibrated, audioReady, playHarmonyChord, stopHarmonyChord]);

  // Update status based on initialization
  if (audioReady && trackingReady && !isCalibrated) {
    if (status === 'Initializing...') {
      setStatus('Ready! Click "Calibrate Position" to begin.');
    }
  }

  const handleCalibrate = async () => {
    setStatus('Calibrating... Please stand in view with legs centered.');
    await calibrate();
    setIsCalibrated(true);
    setStatus('Calibration complete! Move your legs to play music.');
  };

  const handleScaleChange = (root: string, scaleType: string) => {
    changeScale(root, scaleType);
    setStatus(`Changed to ${root} ${scaleType}`);
  };

  const handlePresetChange = (preset: string) => {
    changeSoundPreset(preset);
    setStatus(`Sound preset: ${preset}`);
  };

  const handleTestSound = async () => {
    if (!audioReady) return;
    setStatus('Testing sound...');
    // Play a test note (C4) for 1 second
    await playMelodyNote(0, 0.8);
    setTimeout(() => {
      stopMelodyNote();
      setStatus('Sound test complete');
    }, 1000);
  };

  return (
    <div className="app-container">
      <header>
        <h1>LegSynth</h1>
        <p>Control music with your legs</p>
      </header>

      <main>
        <CameraFeed videoRef={videoRef} />

        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2 }}>
          <Canvas camera={{ position: [0, 0, 10], fov: 75 }}>
            <Visualizer
              leftLegData={leftLegData}
              rightLegData={rightLegData}
              scaleNotes={currentScale}
              chords={currentChords}
            />
          </Canvas>
        </div>

        <StatusBar status={status} error={error} />
      </main>

      <ControlPanel
        onCalibrate={handleCalibrate}
        onScaleChange={handleScaleChange}
        onPresetChange={handlePresetChange}
        onTestSound={handleTestSound}
      />
    </div>
  );
}

export default App;