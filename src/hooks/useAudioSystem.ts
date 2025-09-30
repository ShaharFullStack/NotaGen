import { useState, useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';

export function useAudioSystem() {
  const [audioReady, setAudioReady] = useState(false);
  const [currentScale, setCurrentScale] = useState<string[]>([]);
  const [currentChords, setCurrentChords] = useState<string[][]>([]);

  const melodySynthRef = useRef<Tone.Synth | null>(null);
  const harmonySynthRef = useRef<Tone.PolySynth | null>(null);
  const reverbRef = useRef<Tone.Reverb | null>(null);
  const compressorRef = useRef<Tone.Compressor | null>(null);

  const currentMelodyNoteRef = useRef<string | null>(null);
  const currentHarmonyChordRef = useRef<string[] | null>(null);

  const currentRootRef = useRef('C');
  const currentScaleTypeRef = useRef('major');

  useEffect(() => {
    const initializeAudio = async () => {
      try {
        // Create audio components (Tone.start will be called on first user interaction)
        reverbRef.current = new Tone.Reverb({
          decay: 2.5,
          wet: 0.3
        }).toDestination();

        compressorRef.current = new Tone.Compressor({
          threshold: -20,
          ratio: 4,
          attack: 0.005,
          release: 0.1
        });

        melodySynthRef.current = new Tone.Synth({
          oscillator: { type: 'sine' },
          envelope: { attack: 0.02, decay: 0.1, sustain: 0.7, release: 0.5 }
        }).chain(compressorRef.current, reverbRef.current);

        harmonySynthRef.current = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'triangle' },
          envelope: { attack: 0.05, decay: 0.2, sustain: 0.6, release: 0.8 }
        }).chain(compressorRef.current, reverbRef.current);

        // Generate initial scale
        const scale = generateScale('C', 'major');
        setCurrentScale(scale);
        setCurrentChords(generateChords(scale));

        setAudioReady(true);
      } catch (error) {
        console.error('Audio initialization failed:', error);
      }
    };

    initializeAudio();

    return () => {
      melodySynthRef.current?.dispose();
      harmonySynthRef.current?.dispose();
      reverbRef.current?.dispose();
      compressorRef.current?.dispose();
    };
  }, []);

  const generateScale = (root: string, scaleType: string): string[] => {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const rootIndex = notes.indexOf(root);

    const intervals: Record<string, number[]> = {
      major: [0, 2, 4, 5, 7, 9, 11],
      minor: [0, 2, 3, 5, 7, 8, 10],
      pentatonic: [0, 2, 4, 7, 9],
      blues: [0, 3, 5, 6, 7, 10],
      dorian: [0, 2, 3, 5, 7, 9, 10],
      mixolydian: [0, 2, 4, 5, 7, 9, 10]
    };

    const pattern = intervals[scaleType] || intervals.major;

    return pattern.map(interval => {
      const noteIndex = (rootIndex + interval) % 12;
      return notes[noteIndex] + '4';
    });
  };

  const generateChords = (scale: string[]): string[][] => {
    const chords: string[][] = [];

    for (let i = 0; i < scale.length; i++) {
      const root = scale[i];
      const third = scale[(i + 2) % scale.length];
      const fifth = scale[(i + 4) % scale.length];
      chords.push([root, third, fifth]);
    }

    return chords;
  };

  const playMelodyNote = useCallback(async (slice: number, expression: number) => {
    if (!melodySynthRef.current || slice < 0 || slice >= currentScale.length) return;

    // Ensure AudioContext is started
    if (Tone.context.state !== 'running') {
      await Tone.start();
    }

    const note = currentScale[slice];
    const volume = -20 + (expression * 15);

    if (currentMelodyNoteRef.current === note) {
      melodySynthRef.current.volume.value = volume;
      return;
    }

    if (currentMelodyNoteRef.current) {
      melodySynthRef.current.triggerRelease();
    }

    melodySynthRef.current.volume.value = volume;
    melodySynthRef.current.triggerAttack(note);
    currentMelodyNoteRef.current = note;
  }, [currentScale]);

  const stopMelodyNote = useCallback(() => {
    if (currentMelodyNoteRef.current && melodySynthRef.current) {
      melodySynthRef.current.triggerRelease();
      currentMelodyNoteRef.current = null;
    }
  }, []);

  const playHarmonyChord = useCallback(async (slice: number, expression: number) => {
    if (!harmonySynthRef.current || slice < 0 || slice >= currentChords.length) return;

    // Ensure AudioContext is started
    if (Tone.context.state !== 'running') {
      await Tone.start();
    }

    const chord = currentChords[slice];
    const volume = -25 + (expression * 15);

    if (currentHarmonyChordRef.current === chord) {
      harmonySynthRef.current.volume.value = volume;
      return;
    }

    if (currentHarmonyChordRef.current) {
      harmonySynthRef.current.releaseAll();
    }

    harmonySynthRef.current.volume.value = volume;
    harmonySynthRef.current.triggerAttack(chord);
    currentHarmonyChordRef.current = chord;
  }, [currentChords]);

  const stopHarmonyChord = useCallback(() => {
    if (currentHarmonyChordRef.current && harmonySynthRef.current) {
      harmonySynthRef.current.releaseAll();
      currentHarmonyChordRef.current = null;
    }
  }, []);

  const changeScale = (root: string, scaleType: string) => {
    currentRootRef.current = root;
    currentScaleTypeRef.current = scaleType;

    const scale = generateScale(root, scaleType);
    setCurrentScale(scale);
    setCurrentChords(generateChords(scale));
  };

  const changeSoundPreset = (presetName: string) => {
    if (!melodySynthRef.current || !harmonySynthRef.current || !reverbRef.current) return;

    switch (presetName) {
      case 'synth':
        melodySynthRef.current.set({
          oscillator: { type: 'sine' },
          envelope: { attack: 0.02, decay: 0.1, sustain: 0.7, release: 0.5 }
        });
        harmonySynthRef.current.set({
          oscillator: { type: 'triangle' },
          envelope: { attack: 0.05, decay: 0.2, sustain: 0.6, release: 0.8 }
        });
        break;

      case 'piano':
        melodySynthRef.current.set({
          oscillator: { type: 'triangle' },
          envelope: { attack: 0.001, decay: 0.2, sustain: 0.3, release: 1 }
        });
        harmonySynthRef.current.set({
          oscillator: { type: 'sine' },
          envelope: { attack: 0.001, decay: 0.3, sustain: 0.2, release: 1.5 }
        });
        break;

      case 'pad':
        melodySynthRef.current.set({
          oscillator: { type: 'sine' },
          envelope: { attack: 0.5, decay: 0.3, sustain: 0.9, release: 2 }
        });
        harmonySynthRef.current.set({
          oscillator: { type: 'sine' },
          envelope: { attack: 0.8, decay: 0.5, sustain: 0.9, release: 3 }
        });
        reverbRef.current.set({ wet: 0.5 });
        break;

      case 'pluck':
        melodySynthRef.current.set({
          oscillator: { type: 'square' },
          envelope: { attack: 0.001, decay: 0.1, sustain: 0.1, release: 0.3 }
        });
        harmonySynthRef.current.set({
          oscillator: { type: 'square' },
          envelope: { attack: 0.001, decay: 0.15, sustain: 0.1, release: 0.5 }
        });
        reverbRef.current.set({ wet: 0.2 });
        break;
    }
  };

  return {
    audioReady,
    currentScale,
    currentChords,
    playMelodyNote,
    stopMelodyNote,
    playHarmonyChord,
    stopHarmonyChord,
    changeScale,
    changeSoundPreset
  };
}