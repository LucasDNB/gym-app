import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Play, Pause, RotateCcw, Settings, Volume2, VolumeX, X, ClipboardList } from 'lucide-react';

const PRESETS = {
  tabata: { name: 'Tabata', work: 20, rest: 10, rounds: 8, sets: 1, prepTime: 10, description: '20s trabajo / 10s descanso x 8 rondas' },
  hiit30: { name: 'HIIT 30/30', work: 30, rest: 30, rounds: 10, sets: 1, prepTime: 10, description: '30s trabajo / 30s descanso x 10 rondas' },
  hiit45: { name: 'HIIT 45/15', work: 45, rest: 15, rounds: 8, sets: 1, prepTime: 10, description: '45s trabajo / 15s descanso x 8 rondas' },
  emom: { name: 'EMOM 10min', work: 60, rest: 0, rounds: 10, sets: 1, prepTime: 10, description: 'Every Minute On the Minute x 10 min' },
  emom15: { name: 'EMOM 15min', work: 60, rest: 0, rounds: 15, sets: 1, prepTime: 10, description: 'Every Minute On the Minute x 15 min' },
  emom20: { name: 'EMOM 20min', work: 60, rest: 0, rounds: 20, sets: 1, prepTime: 10, description: 'Every Minute On the Minute x 20 min' },
  amrap10: { name: 'AMRAP 10min', work: 600, rest: 0, rounds: 1, sets: 1, prepTime: 10, description: 'As Many Reps As Possible en 10 min' },
  amrap15: { name: 'AMRAP 15min', work: 900, rest: 0, rounds: 1, sets: 1, prepTime: 10, description: 'As Many Reps As Possible en 15 min' },
  amrap20: { name: 'AMRAP 20min', work: 1200, rest: 0, rounds: 1, sets: 1, prepTime: 10, description: 'As Many Reps As Possible en 20 min' },
  fortime: { name: 'For Time (cuenta)', work: 0, rest: 0, rounds: 1, sets: 1, prepTime: 3, description: 'Cronómetro ascendente' },
  custom: { name: 'Personalizado', work: 40, rest: 20, rounds: 5, sets: 1, prepTime: 10, description: 'Configuralo a tu medida' },
};

function playBeep(frequency = 800, duration = 200, volume = 0.5) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = frequency;
    gain.gain.value = volume;
    osc.start();
    osc.stop(ctx.currentTime + duration / 1000);
  } catch {}
}

function playCountdown() { playBeep(600, 150, 0.4); }
function playWorkStart() { playBeep(1000, 300, 0.6); }
function playRestStart() { playBeep(500, 300, 0.5); }
function playFinish() {
  playBeep(1200, 200, 0.7);
  setTimeout(() => playBeep(1200, 200, 0.7), 250);
  setTimeout(() => playBeep(1600, 400, 0.7), 500);
}

function wodToConfig(wod) {
  const t = (wod.wodType || '').toUpperCase();
  const cap = parseInt(wod.wodTimecap) || 0;
  const rounds = parseInt(wod.wodRounds) || 0;

  if (t.includes('AMRAP')) {
    const min = cap || 10;
    return { name: `AMRAP ${min}min`, work: min * 60, rest: 0, rounds: 1, sets: 1, prepTime: 10, description: `As Many Reps As Possible en ${min} min` };
  }
  if (t.includes('EMOM')) {
    const r = rounds || cap || 10;
    return { name: `EMOM ${r}min`, work: 60, rest: 0, rounds: r, sets: 1, prepTime: 10, description: `Every Minute On the Minute x ${r} min` };
  }
  if (t.includes('TABATA')) {
    const r = rounds || 8;
    return { name: 'Tabata', work: 20, rest: 10, rounds: r, sets: 1, prepTime: 10, description: `20s trabajo / 10s descanso x ${r} rondas` };
  }
  // For Time / RFT / Chipper / Otro → cronómetro ascendente
  return {
    name: wod.wodType || 'For Time',
    work: 0, rest: 0, rounds: 1, sets: 1, prepTime: 3,
    description: cap ? `Time cap: ${cap} min` : 'Cronómetro ascendente',
  };
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function WorkoutTimer() {
  const location = useLocation();
  const navigate = useNavigate();
  const incomingWod = location.state?.wod || null;

  const [wod, setWod] = useState(incomingWod);
  const [preset, setPreset] = useState(incomingWod ? 'custom' : 'tabata');
  const [config, setConfig] = useState(incomingWod ? wodToConfig(incomingWod) : PRESETS.tabata);
  const [phase, setPhase] = useState('idle'); // idle, prep, work, rest, finished, counting
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [currentSet, setCurrentSet] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showConfig, setShowConfig] = useState(false);

  const intervalRef = useRef(null);
  const prevTimeRef = useRef(null);

  const isForTime = config.work === 0 && config.rest === 0;

  const selectPreset = (key) => {
    setPreset(key);
    setConfig({ ...PRESETS[key] });
    setWod(null);
    reset();
  };

  // Clear router state so a refresh doesn't re-load the WOD
  useEffect(() => {
    if (incomingWod) {
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reset = useCallback(() => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    setPhase('idle');
    setTimeLeft(0);
    setTotalElapsed(0);
    setCurrentRound(1);
    setCurrentSet(1);
    prevTimeRef.current = null;
  }, []);

  const start = useCallback(() => {
    if (phase === 'idle') {
      if (isForTime) {
        setPhase('counting');
        setTimeLeft(0);
        if (soundEnabled) playWorkStart();
      } else {
        setPhase('prep');
        setTimeLeft(config.prepTime);
      }
    }
    setIsRunning(true);
  }, [phase, config, soundEnabled, isForTime]);

  const togglePause = useCallback(() => {
    setIsRunning(prev => !prev);
  }, []);

  // Timer tick
  useEffect(() => {
    if (!isRunning) {
      clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setTotalElapsed(prev => prev + 1);

      if (isForTime && phase === 'counting') {
        setTimeLeft(prev => prev + 1);
        return;
      }

      setTimeLeft(prev => {
        const next = prev - 1;

        // Countdown beeps at 3, 2, 1
        if (soundEnabled && next > 0 && next <= 3) {
          playCountdown();
        }

        if (next <= 0) {
          // Transition to next phase
          if (phase === 'prep') {
            setPhase('work');
            if (soundEnabled) playWorkStart();
            return config.work;
          }

          if (phase === 'work') {
            if (config.rest > 0) {
              // Check if this was the last round
              if (currentRound >= config.rounds && currentSet >= config.sets) {
                setPhase('finished');
                setIsRunning(false);
                if (soundEnabled) playFinish();
                return 0;
              }
              setPhase('rest');
              if (soundEnabled) playRestStart();
              return config.rest;
            } else {
              // No rest (EMOM style) - next round directly
              if (currentRound >= config.rounds && currentSet >= config.sets) {
                setPhase('finished');
                setIsRunning(false);
                if (soundEnabled) playFinish();
                return 0;
              }
              setCurrentRound(r => r + 1);
              if (soundEnabled) playWorkStart();
              return config.work;
            }
          }

          if (phase === 'rest') {
            if (currentRound >= config.rounds) {
              if (currentSet >= config.sets) {
                setPhase('finished');
                setIsRunning(false);
                if (soundEnabled) playFinish();
                return 0;
              }
              setCurrentSet(s => s + 1);
              setCurrentRound(1);
            } else {
              setCurrentRound(r => r + 1);
            }
            setPhase('work');
            if (soundEnabled) playWorkStart();
            return config.work;
          }
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [isRunning, phase, config, currentRound, currentSet, soundEnabled, isForTime]);

  const phaseColors = {
    idle: 'from-gray-700 to-gray-900',
    prep: 'from-yellow-500 to-yellow-700',
    work: 'from-green-500 to-green-700',
    rest: 'from-blue-500 to-blue-700',
    finished: 'from-purple-500 to-purple-700',
    counting: 'from-green-500 to-green-700',
  };

  const phaseLabels = {
    idle: 'Listo',
    prep: 'Preparate...',
    work: 'TRABAJO',
    rest: 'DESCANSO',
    finished: 'TERMINADO',
    counting: 'EN CURSO',
  };

  const progress = phase === 'work' && config.work > 0 ? ((config.work - timeLeft) / config.work) * 100
    : phase === 'rest' && config.rest > 0 ? ((config.rest - timeLeft) / config.rest) * 100
    : phase === 'prep' ? ((config.prepTime - timeLeft) / config.prepTime) * 100
    : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-brand-green-700">Timer de Entrenamiento</h1>
        <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-2 rounded-lg hover:bg-gray-100">
          {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} className="text-gray-400" />}
        </button>
      </div>

      {/* WOD Pizarra + Timer (fill mobile viewport) */}
      <div className={`flex flex-col gap-2 mb-4 ${wod ? 'min-h-[calc(100dvh-9rem)]' : ''}`}>
        {wod && (
          <div className="rounded-2xl border-2 border-brand-green-700 bg-[#1f3a2a] text-white shadow-lg overflow-hidden flex-shrink-0">
            <div className="flex items-center justify-between px-4 py-1.5 bg-brand-green-700/80 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ClipboardList size={16} />
                <span className="text-xs font-semibold tracking-wide uppercase">Pizarra del WOD</span>
              </div>
              <button onClick={() => setWod(null)} className="p-1 rounded hover:bg-white/10" title="Cerrar pizarra">
                <X size={14} />
              </button>
            </div>
            <div className="p-3 sm:p-4 font-mono">
              {(wod.routineName || wod.dayName) && (
                <p className="text-[10px] sm:text-xs uppercase tracking-wider text-brand-cream/70 mb-1">
                  {wod.routineName}{wod.routineName && wod.dayName ? ' • ' : ''}{wod.dayName}
                </p>
              )}
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="text-xl font-bold text-brand-pink-500">{wod.wodType}</span>
                {wod.wodTimecap && (
                  <span className="text-xs bg-white/10 rounded px-2 py-0.5">Time Cap: {wod.wodTimecap} min</span>
                )}
                {wod.wodRounds && (
                  <span className="text-xs bg-white/10 rounded px-2 py-0.5">Rondas: {wod.wodRounds}</span>
                )}
              </div>
              {wod.wodContent && (
                <pre className="whitespace-pre-wrap text-sm sm:text-base leading-snug text-brand-cream">{wod.wodContent}</pre>
              )}
            </div>
          </div>
        )}

        {/* Timer display */}
        <div className={`bg-gradient-to-b ${phaseColors[phase]} rounded-2xl p-6 sm:p-8 text-white text-center transition-all duration-500 flex-1 flex flex-col justify-center`}>
          {/* Phase label */}
          <p className="text-lg font-medium opacity-80 mb-2">{phaseLabels[phase]}</p>

          {/* Time */}
          <p className="font-mono font-bold tracking-wider mb-4 leading-none" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)', fontSize: 'clamp(5rem, 24vw, 12rem)' }}>
            {formatTime(timeLeft)}
          </p>

          {/* Progress bar */}
          {phase !== 'idle' && phase !== 'finished' && phase !== 'counting' && (
            <div className="w-full bg-white/20 rounded-full h-2 mb-4">
              <div className="bg-white rounded-full h-2 transition-all duration-1000" style={{ width: `${progress}%` }} />
            </div>
          )}

          {/* Round info */}
          <div className="flex justify-center gap-6 sm:gap-8 text-sm opacity-80 flex-wrap mb-5">
            {!isForTime && <span>Ronda {currentRound} / {config.rounds}</span>}
            {config.sets > 1 && <span>Serie {currentSet} / {config.sets}</span>}
            <span>Total: {formatTime(totalElapsed)}</span>
          </div>

          {/* Integrated controls */}
          <div className="flex justify-center gap-3 flex-wrap">
            {phase === 'idle' ? (
              <button onClick={start}
                className="flex items-center gap-2 bg-white/95 text-brand-green-700 px-8 py-3 rounded-xl text-lg font-semibold hover:bg-white transition-colors shadow-lg">
                <Play size={24} /> Iniciar
              </button>
            ) : phase === 'finished' ? (
              <button onClick={reset}
                className="flex items-center gap-2 bg-white/95 text-brand-green-700 px-8 py-3 rounded-xl text-lg font-semibold hover:bg-white transition-colors shadow-lg">
                <RotateCcw size={24} /> Reiniciar
              </button>
            ) : (
              <>
                <button onClick={togglePause}
                  className="flex items-center gap-2 bg-white/95 text-brand-green-700 px-7 py-3 rounded-xl text-lg font-semibold hover:bg-white transition-colors shadow-lg">
                  {isRunning ? <><Pause size={24} /> Pausar</> : <><Play size={24} /> Reanudar</>}
                </button>
                <button onClick={reset}
                  className="flex items-center gap-2 bg-red-500/90 text-white px-5 py-3 rounded-xl text-lg font-semibold hover:bg-red-500 transition-colors shadow-lg"
                  title="Detener / reiniciar">
                  <RotateCcw size={24} />
                </button>
                {isForTime && phase === 'counting' && (
                  <button onClick={() => { setPhase('finished'); setIsRunning(false); if (soundEnabled) playFinish(); }}
                    className="flex items-center gap-2 bg-brand-pink-500 text-white px-5 py-3 rounded-xl text-lg font-semibold hover:bg-brand-pink-600 transition-colors shadow-lg">
                    Terminar
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Preset selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 mb-6">
        {Object.entries(PRESETS).map(([key, val]) => (
          <button key={key} onClick={() => selectPreset(key)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
              preset === key ? 'bg-brand-green-500 text-white border-indigo-600' : 'bg-white text-gray-700 border-brand-cream-dark hover:border-indigo-300'
            }`}>
            {val.name}
          </button>
        ))}
      </div>

      {/* Config panel */}
      <div className="bg-white rounded-xl shadow-sm border border-brand-cream-dark p-5">
        <button onClick={() => setShowConfig(!showConfig)} className="flex items-center gap-2 text-sm font-medium text-gray-700 w-full">
          <Settings size={16} /> Configuración
          <span className="ml-auto text-xs text-gray-400">{config.description}</span>
        </button>

        {showConfig && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Trabajo (seg)</label>
              <input type="number" value={config.work} min={0}
                onChange={e => { setConfig({ ...config, work: parseInt(e.target.value) || 0 }); reset(); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-brand-green-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Descanso (seg)</label>
              <input type="number" value={config.rest} min={0}
                onChange={e => { setConfig({ ...config, rest: parseInt(e.target.value) || 0 }); reset(); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-brand-green-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Rondas</label>
              <input type="number" value={config.rounds} min={1}
                onChange={e => { setConfig({ ...config, rounds: parseInt(e.target.value) || 1 }); reset(); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-brand-green-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Series</label>
              <input type="number" value={config.sets} min={1}
                onChange={e => { setConfig({ ...config, sets: parseInt(e.target.value) || 1 }); reset(); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-brand-green-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Preparación (seg)</label>
              <input type="number" value={config.prepTime} min={0}
                onChange={e => { setConfig({ ...config, prepTime: parseInt(e.target.value) || 0 }); reset(); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-brand-green-500 outline-none" />
            </div>
          </div>
        )}
      </div>

      {/* Quick reference */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Tabata', desc: '20s ON / 10s OFF x 8 rondas. Alta intensidad, mejora VO2max.', color: 'border-red-200 bg-red-50' },
          { title: 'EMOM', desc: 'Every Minute On the Minute. Completar el trabajo dentro del minuto.', color: 'border-blue-200 bg-blue-50' },
          { title: 'AMRAP', desc: 'As Many Reps/Rounds As Possible. Máximas repeticiones en el tiempo.', color: 'border-green-200 bg-green-50' },
          { title: 'For Time', desc: 'Completar el trabajo lo más rápido posible. Cronómetro ascendente.', color: 'border-purple-200 bg-purple-50' },
        ].map(({ title, desc, color }) => (
          <div key={title} className={`rounded-lg border p-4 ${color}`}>
            <h4 className="font-semibold text-sm mb-1">{title}</h4>
            <p className="text-xs text-gray-600">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
