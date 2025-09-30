import { useState, useRef } from 'react';
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

  // Handle leg position updates for audio
  if (leftLegData.isActive && isCalibrated) {
    const expression = Math.min(leftLegData.distance / 300, 1.0);
    playMelodyNote(leftLegData.slice, expression);
  } else {
    stopMelodyNote();
  }

  if (rightLegData.isActive && isCalibrated) {
    const expression = Math.min(rightLegData.distance / 300, 1.0);
    playHarmonyChord(rightLegData.slice, expression);
  } else {
    stopHarmonyChord();
  }

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
      />
    </div>
  );
}

export default App;