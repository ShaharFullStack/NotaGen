import { useState } from 'react';

interface ControlPanelProps {
  onCalibrate: () => void;
  onScaleChange: (root: string, scaleType: string) => void;
  onPresetChange: (preset: string) => void;
  onTestSound?: () => void;
}

export default function ControlPanel({ onCalibrate, onScaleChange, onPresetChange, onTestSound }: ControlPanelProps) {
  const [root, setRoot] = useState('C');
  const [scaleType, setScaleType] = useState('major');

  const handleRootChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRoot = e.target.value;
    setRoot(newRoot);
    onScaleChange(newRoot, scaleType);
  };

  const handleScaleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newScale = e.target.value;
    setScaleType(newScale);
    onScaleChange(root, newScale);
  };

  return (
    <aside id="control-panel">
      <div className="panel-section">
        <h3>Musical Settings</h3>
        <label>
          Root Note:
          <select value={root} onChange={handleRootChange}>
            <option value="C">C</option>
            <option value="C#">C#</option>
            <option value="D">D</option>
            <option value="D#">D#</option>
            <option value="E">E</option>
            <option value="F">F</option>
            <option value="F#">F#</option>
            <option value="G">G</option>
            <option value="G#">G#</option>
            <option value="A">A</option>
            <option value="A#">A#</option>
            <option value="B">B</option>
          </select>
        </label>
        <label>
          Scale:
          <select value={scaleType} onChange={handleScaleChange}>
            <option value="major">Major</option>
            <option value="minor">Minor</option>
            <option value="pentatonic">Pentatonic</option>
            <option value="blues">Blues</option>
            <option value="dorian">Dorian</option>
            <option value="mixolydian">Mixolydian</option>
          </select>
        </label>
      </div>

      <div className="panel-section">
        <h3>Sound Preset</h3>
        <select onChange={(e) => onPresetChange(e.target.value)}>
          <option value="synth">Synth</option>
          <option value="piano">Piano</option>
          <option value="pad">Pad</option>
          <option value="pluck">Pluck</option>
        </select>
      </div>

      <div className="panel-section">
        <button onClick={onCalibrate} className="primary-btn">
          Calibrate Position
        </button>
        {onTestSound && (
          <button onClick={onTestSound} style={{ marginTop: '10px' }}>
            Test Sound
          </button>
        )}
      </div>

      <div className="panel-section">
        <h3>Instructions</h3>
        <p className="help-text">
          1. Click "Calibrate Position" to start<br />
          2. Stand in view of camera<br />
          3. Left leg controls melody notes<br />
          4. Right leg controls harmony chords<br />
          5. Move legs to different slices to play
        </p>
      </div>
    </aside>
  );
}