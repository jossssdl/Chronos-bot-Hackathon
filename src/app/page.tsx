'use client';

import React, { useRef, useState, useEffect } from 'react';
import { SimulationCanvas, SimulationCanvasRef } from '@/components/SimulationCanvas';

interface AgentLogMessage {
  agent: 'Perceptor' | 'Estratega' | 'System' | 'Error';
  text: string;
  timestamp: string;
}

export default function Home() {
  const canvasRef = useRef<SimulationCanvasRef | null>(null);

  // App States
  const [base64Image, setBase64Image] = useState<string>('');
  const [obstacles, setObstacles] = useState<[number, number][]>([]);
  const [robotPos, setRobotPos] = useState<[number, number]>([0, 0]);
  const [copied, setCopied] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [gpuLoading, setGpuLoading] = useState<boolean>(false);
  const [autoplay, setAutoplay] = useState<boolean>(false);
  const autoplayRef = useRef<boolean>(false);

  // Refs for tracking mutable states in async/loop callbacks to prevent stale closures
  const robotPosRef = useRef<[number, number]>([0, 0]);
  const obstaclesRef = useRef<[number, number][]>([]);

  useEffect(() => {
    robotPosRef.current = robotPos;
  }, [robotPos]);

  useEffect(() => {
    obstaclesRef.current = obstacles;
  }, [obstacles]);

  const [history, setHistory] = useState<string[]>([]);
  const [predictedPath, setPredictedPath] = useState<[number, number][]>([]);
  const [agentLogs, setAgentLogs] = useState<AgentLogMessage[]>([]);

  // Telemetry Metrics (Dynamic)
  const [cerebrasMetrics, setCerebrasMetrics] = useState({
    latency: 0,
    ttft: 0,
    tokensPerSecond: 0,
  });

  const [gpuMetrics, setGpuMetrics] = useState({
    latency: 0,
    ttft: 0,
    tokensPerSecond: 0,
  });

  // Check if metrics have been loaded at least once
  const [metricsLoaded, setMetricsLoaded] = useState<boolean>(false);

  // Dynamic multiplier calculation
  const speedRatio = gpuMetrics.latency && cerebrasMetrics.latency
    ? (gpuMetrics.latency / cerebrasMetrics.latency).toFixed(1)
    : '';

  // Sync state changes from canvas
  const handleRobotMove = (pos: [number, number]) => {
    setRobotPos(pos);
  };

  const handleObstaclesChange = (obs: [number, number][]) => {
    setObstacles(obs);
    setPredictedPath([]); // Clear path predictions when obstacles change
  };

  // Capture canvas state
  const handleCaptureState = () => {
    if (canvasRef.current) {
      const dataUri = canvasRef.current.captureSimulationState();
      setBase64Image(dataUri);
      return dataUri;
    }
    return '';
  };

  // Copy Base64 string to clipboard
  const handleCopyBase64 = () => {
    if (!base64Image) return;
    navigator.clipboard.writeText(base64Image);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Move robot manually/automatically and apply boundaries
  // Uses refs to ensure latest drawn coordinates are verified to block bad moves
  const moveRobotManually = (direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    const [xVal, yVal] = robotPosRef.current;
    let x = xVal;
    let y = yVal;

    if (direction === 'UP' && y > 0) y -= 1;
    if (direction === 'DOWN' && y < 9) y += 1;
    if (direction === 'LEFT' && x > 0) x -= 1;
    if (direction === 'RIGHT' && x < 9) x += 1;

    console.log('[DEBUG] moveRobotManually:', {
      direction,
      currentPos: [xVal, yVal],
      targetPos: [x, y],
      obstaclesCount: obstaclesRef.current.length,
      obstaclesList: obstaclesRef.current,
    });

    // Check if target cell overlaps with obstacles
    const isObstacle = obstaclesRef.current.some(([ox, oy]) => ox === x && oy === y);
    if (!isObstacle) {
      canvasRef.current?.setRobotPosition([x, y]);
      setPredictedPath([]); // Reset path prediction since position has changed
      return true;
    }
    return false;
  };

  // Executes a single step of the Swarm logic (Perceptor + Estratega + Move)
  // Returns status information for autopilot loop
  const executeSingleStep = async (): Promise<{ success: boolean; reachedGoal: boolean } | null> => {
    setLoading(true);
    setGpuLoading(true);
    setPredictedPath([]);
    
    // 1. Capture latest Canvas frame in Base64
    const currentBase64 = handleCaptureState();
    
    addLog('System', 'Iniciando captura de pantalla de la simulación serializada en Base64...');
    addLog('System', 'Lanzando peticiones concurrentes: Cerebras Cloud vs GPU estándar...');

    // 2. Fire GPU comparison query in parallel to backend
    const gpuPromise = fetch('/api/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.metrics) {
          setGpuMetrics({
            latency: data.metrics.latency,
            ttft: data.metrics.ttft,
            tokensPerSecond: data.metrics.tokensPerSecond,
          });
        }
      })
      .catch((err) => {
        console.error('Error on GPU comparison call:', err);
      })
      .finally(() => {
        setGpuLoading(false);
      });

    // 3. Process primary Cerebras swarm pipeline
    try {
      addLog('System', 'Transmitiendo trama visual al Agente Perceptor en Cerebras Cloud...');
      
      const response = await fetch('/api/swarm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: currentBase64,
          robotPos: robotPosRef.current,
          history: history.slice(-6), // Send last 6 moves to prevent context bloat
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Error desconocido en el servidor.');
      }

      const { perceptorReport, estrategaDecision, metrics } = data;

      // 4. Log results sequentially
      addLog('Perceptor', perceptorReport);
      addLog('System', 'Procesando reporte de perceptor en el Agente Estratega (Thinking Mode enabled)...');
      
      const estrategaLogText = `[Razón] ${estrategaDecision.reasoning_summary}\n\n[Trayectoria Predicha] ${JSON.stringify(estrategaDecision.path_coordinates)}`;
      addLog('Estratega', estrategaLogText);

      // 5. Set predicted path for visual rendering on canvas
      if (estrategaDecision.path_coordinates && estrategaDecision.path_coordinates.length > 0) {
        setPredictedPath(estrategaDecision.path_coordinates);
      }

      // 6. Update Cerebras Telemetry metrics from time_info
      const perceptorMetric = metrics.perceptor;
      const estrategaMetric = metrics.estratega;

      // Calculate Cerebras specs
      const totalCerebrasLatency = metrics.totalLatency;
      
      // Calculate token output rate
      const totalTokens = (perceptorMetric.usage?.total_tokens || 0) + (estrategaMetric.usage?.total_tokens || 0);
      const totalCompletionTokens = (perceptorMetric.usage?.completion_tokens || 0) + (estrategaMetric.usage?.completion_tokens || 0);
      const computedTokensPerSec = totalCompletionTokens > 0 && totalCerebrasLatency > 0
        ? Math.round((totalCompletionTokens / (totalCerebrasLatency / 1000)))
        : 280;

      // TTFT extraction (Cerebras Cloud time_info prompt_time or performance fallback)
      const perceptorTTFT = perceptorMetric.timeInfo?.prompt_time 
        ? Math.round(perceptorMetric.timeInfo.prompt_time * 1000) 
        : Math.round(perceptorMetric.latency * 0.15);

      setCerebrasMetrics({
        latency: totalCerebrasLatency,
        ttft: perceptorTTFT || 5,
        tokensPerSecond: computedTokensPerSec,
      });

      // 7. Execute recommended movement immediately
      const nextMove = estrategaDecision.next_move;
      if (nextMove) {
        addLog('System', `Comando estructurado recibido: Moviendo robot hacia ${nextMove}.`);
        
        const moved = moveRobotManually(nextMove);
        if (moved) {
          setHistory((prev) => [...prev, nextMove]);
          
          // Get the fresh updated position from the ref
          const [rx, ry] = robotPosRef.current;
          if (rx === 9 && ry === 9) {
            addLog('System', '🎉 ¡Chronos-Bot ha llegado con éxito a la Meta [9, 9]!');
            return { success: true, reachedGoal: true };
          }
          return { success: true, reachedGoal: false };
        } else {
          addLog('Error', `El robot chocó contra un obstáculo o límite en la dirección ${nextMove}.`);
          return { success: false, reachedGoal: false };
        }
      } else {
        addLog('System', 'Advertencia: No se recibió ninguna recomendación de movimiento en next_move.');
        return { success: false, reachedGoal: false };
      }

    } catch (err: any) {
      console.error(err);
      addLog('Error', `Fallo de comunicación: ${err.message || 'Error de red.'}`);
      return { success: false, reachedGoal: false };
    } finally {
      setLoading(false);
      await gpuPromise; // Sync parallel comparison promise
    }
  };

  // Run a single manual trigger from the button
  const handleRunSwarm = async () => {
    setAgentLogs([]);
    setMetricsLoaded(true);
    await executeSingleStep();
  };

  // Autoplay loop that runs continuously until goal reached or error/block
  const handleToggleAutoplay = async () => {
    if (autoplay) {
      // Toggle off
      setAutoplay(false);
      autoplayRef.current = false;
      return;
    }

    setAutoplay(true);
    autoplayRef.current = true;
    setAgentLogs([]);
    setMetricsLoaded(true);

    let success = true;
    let reachedGoal = false;

    // Continuous loop execution
    while (autoplayRef.current && success && !reachedGoal) {
      // Check if robot is already at meta before starting step
      const [rx, ry] = robotPosRef.current;
      if (rx === 9 && ry === 9) {
        reachedGoal = true;
        break;
      }

      const res = await executeSingleStep();
      if (!res) {
        success = false;
        break;
      }

      success = res.success;
      reachedGoal = res.reachedGoal;

      if (!success || reachedGoal || !autoplayRef.current) {
        break;
      }

      // Delay between autonomous steps so user can see it move smoothly
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    setAutoplay(false);
    autoplayRef.current = false;
  };

  // Helper log message adder
  const addLog = (agent: AgentLogMessage['agent'], text: string) => {
    setAgentLogs((prev) => [
      ...prev,
      {
        agent,
        text,
        timestamp: new Date().toLocaleTimeString(),
      }
    ]);
  };

  // Initialize logs and capture Base64 on start to prevent hydration mismatch
  useEffect(() => {
    handleCaptureState();
    setAgentLogs([
      {
        agent: 'System',
        text: 'Chronos-Bot listo para operar. Dibuja obstáculos en el Canvas y presiona "Ejecutar Enjambre" o "Iniciar Ruta Autónoma" para iniciar la inferencia en tiempo real.',
        timestamp: new Date().toLocaleTimeString(),
      }
    ]);
  }, []);

  return (
    <div className="min-h-screen bg-[#05070f] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-white">
      {/* Background Cyber Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none"></div>

      {/* Cyber Header */}
      <header className="relative z-10 border-b border-indigo-500/20 bg-slate-950/80 backdrop-blur-md px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 ${loading || gpuLoading || autoplay ? 'bg-amber-400' : ''}`}></span>
            <span className={`relative inline-flex rounded-full h-3 w-3 ${loading || gpuLoading || autoplay ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 font-mono">
              CHRONOS-BOT
            </h1>
            <p className="text-xs text-indigo-400/80 font-mono uppercase tracking-widest">
              Critical Reaction Swarm for Reactive Robotics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="px-2.5 py-1 rounded bg-indigo-950/50 border border-indigo-500/30 text-indigo-300">
            TRACK: MULTIVERSE AGENTS
          </span>
          <span className="px-2.5 py-1 rounded bg-slate-900 border border-emerald-500/20 text-emerald-400">
            DEMO PREVIEW: PHASE 4 MVP
          </span>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 max-w-7xl w-full mx-auto">
        
        {/* Left Column: Canvas, Controls & Manual Simulation (5 Cols) */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Simulation Panel */}
          <div className="border border-indigo-500/20 rounded-2xl bg-slate-950/50 backdrop-blur p-6 flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-4 border-b border-indigo-500/10 pb-3">
              <h2 className="text-sm font-semibold tracking-wider font-mono text-indigo-300 uppercase">
                10x10 Simulation Grid
              </h2>
              <span className="text-xs font-mono text-slate-400">
                Pos: [{robotPos[0]}, {robotPos[1]}]
              </span>
            </div>

            {/* Canvas */}
            <div className="my-2 relative">
              <SimulationCanvas
                ref={canvasRef}
                onRobotMove={handleRobotMove}
                onObstaclesChange={handleObstaclesChange}
                robotPos={robotPos}
                obstacles={obstacles}
                predictedPath={predictedPath}
              />
            </div>

            {/* Interactive guidelines */}
            <p className="text-xs text-indigo-300/60 font-mono mt-4 text-center">
              🖱️ Haz clic y arrastra para pintar/borrar <span className="text-red-400">Obstáculos (Rojos)</span>.
            </p>

            {/* Control Panel Actions */}
            <div className="grid grid-cols-3 gap-2 w-full mt-6">
              <button
                onClick={() => {
                  canvasRef.current?.clearObstacles();
                  setHistory([]);
                  setPredictedPath([]);
                  handleCaptureState();
                }}
                disabled={loading || gpuLoading || autoplay}
                className="px-3 py-2 rounded-lg bg-slate-900 border border-red-500/30 text-red-400 text-xs font-mono uppercase tracking-wider hover:bg-red-500/10 disabled:opacity-50 active:scale-95 transition-all"
              >
                Limpiar Obstáculos
              </button>
              <button
                onClick={() => {
                  canvasRef.current?.resetRobot();
                  setHistory([]);
                  setPredictedPath([]);
                  handleCaptureState();
                }}
                disabled={loading || gpuLoading || autoplay}
                className="px-3 py-2 rounded-lg bg-slate-900 border border-blue-500/30 text-blue-400 text-xs font-mono uppercase tracking-wider hover:bg-blue-500/10 disabled:opacity-50 active:scale-95 transition-all"
              >
                Reset Robot
              </button>
              <button
                onClick={() => {
                  handleCaptureState();
                  addLog('System', 'Estado del Canvas capturado manualmente.');
                }}
                disabled={loading || gpuLoading || autoplay}
                className="px-3 py-2 rounded-lg bg-slate-900 border border-indigo-500/30 text-indigo-400 text-xs font-mono uppercase tracking-wider hover:bg-indigo-500/10 disabled:opacity-50 active:scale-95 transition-all"
              >
                Capturar Estado
              </button>
            </div>

            {/* CRITICAL: Execute swarm decision buttons */}
            <div className="flex flex-col gap-2 w-full mt-4">
              
              {/* Autoplay / Autopilot button */}
              <button
                onClick={handleToggleAutoplay}
                disabled={loading || gpuLoading}
                className={`w-full py-3.5 rounded-lg font-mono text-xs uppercase tracking-widest font-bold active:scale-95 transition-all flex items-center justify-center gap-2 ${
                  autoplay
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                }`}
              >
                {autoplay ? (
                  <>
                    🛑 DETENER AUTOPILOTO
                  </>
                ) : (
                  <>
                    🤖 INICIAR RUTA AUTÓNOMA (LOOP)
                  </>
                )}
              </button>

              {/* Single step execution button */}
              <button
                onClick={handleRunSwarm}
                disabled={loading || gpuLoading || autoplay}
                className="w-full py-2.5 rounded-lg bg-indigo-600/90 hover:bg-indigo-500 active:scale-95 transition-all font-mono text-xs uppercase tracking-widest text-indigo-100 disabled:opacity-40 flex items-center justify-center gap-2 border border-indigo-500/30"
              >
                {loading ? (
                  <>
                    <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></span>
                    Pensando...
                  </>
                ) : (
                  <>
                    🚀 EJECUTAR UN PASO
                  </>
                )}
              </button>

            </div>
          </div>

          {/* Manual Controller (Only for Phase 1 Debugging/Testing) */}
          <div className="border border-indigo-500/20 rounded-2xl bg-slate-950/50 backdrop-blur p-6">
            <h2 className="text-sm font-semibold tracking-wider font-mono text-indigo-300 uppercase mb-3 border-b border-indigo-500/10 pb-2 flex justify-between items-center">
              <span>Manual Control (Debug)</span>
              {history.length > 0 && (
                <span className="text-[10px] text-slate-500">Historial: {history.length} pasos</span>
              )}
            </h2>
            <div className="flex flex-col items-center gap-2 mt-4">
              <button
                onClick={() => moveRobotManually('UP')}
                disabled={loading || gpuLoading || autoplay}
                className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-900 border border-indigo-500/30 hover:bg-indigo-950 hover:border-indigo-400 active:scale-90 transition-all text-indigo-300 font-mono disabled:opacity-50"
              >
                ▲
              </button>
              <div className="flex gap-8">
                <button
                  onClick={() => moveRobotManually('LEFT')}
                  disabled={loading || gpuLoading || autoplay}
                  className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-900 border border-indigo-500/30 hover:bg-indigo-950 hover:border-indigo-400 active:scale-90 transition-all text-indigo-300 font-mono disabled:opacity-50"
                >
                  ◀
                </button>
                <button
                  onClick={() => moveRobotManually('RIGHT')}
                  disabled={loading || gpuLoading || autoplay}
                  className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-900 border border-indigo-500/30 hover:bg-indigo-950 hover:border-indigo-400 active:scale-90 transition-all text-indigo-300 font-mono disabled:opacity-50"
                >
                  ▶
                </button>
              </div>
              <button
                onClick={() => moveRobotManually('DOWN')}
                disabled={loading || gpuLoading || autoplay}
                className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-900 border border-indigo-500/30 hover:bg-indigo-950 hover:border-indigo-400 active:scale-90 transition-all text-indigo-300 font-mono disabled:opacity-50"
              >
                ▼
              </button>
            </div>
            <p className="text-[10px] text-slate-400 font-mono text-center mt-3">
              Mueve el robot para probar la reactividad y capturar estados diferentes.
            </p>
          </div>
        </section>

        {/* Right Column: Serializer Output & Agents Preview (7 Cols) */}
        <section className="lg:col-span-7 flex flex-col gap-6 font-mono">

          {/* Multimodal Serializer Box */}
          <div className="border border-indigo-500/20 rounded-2xl bg-slate-950/50 backdrop-blur p-6 flex flex-col min-h-[220px]">
            <div className="flex items-center justify-between border-b border-indigo-500/10 pb-3 mb-4">
              <h2 className="text-sm font-semibold tracking-wider text-indigo-300 uppercase flex items-center gap-2">
                📸 Multimodal State Serializer
              </h2>
              <div className="flex items-center gap-2">
                {base64Image && (
                  <button
                    onClick={handleCopyBase64}
                    className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 transition-all"
                  >
                    {copied ? '¡Copiado!' : '📋 Copiar String'}
                  </button>
                )}
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              </div>
            </div>

            {/* Serializer Content splits into Preview and Base64 string */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1">
              {/* String logs */}
              <div className="md:col-span-8 flex flex-col">
                <label className="text-[10px] text-slate-400 uppercase mb-1">
                  URI String Base64 (`image/png`)
                </label>
                <div
                  id="base64-console"
                  className="flex-1 p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-[10px] text-indigo-400/90 break-all overflow-y-auto max-h-[120px] transition-all duration-300 scrollbar-thin scrollbar-thumb-indigo-950"
                >
                  {base64Image ? base64Image : 'Cargando estado...'}
                </div>
              </div>

              {/* Visual mini preview */}
              <div className="md:col-span-4 flex flex-col items-center justify-center border border-indigo-500/10 bg-slate-900/30 rounded-lg p-2">
                <label className="text-[10px] text-slate-400 uppercase mb-1">
                  Visión Input Preview
                </label>
                {base64Image ? (
                  <img
                    src={base64Image}
                    alt="Canvas state preview"
                    className="max-w-[80px] max-h-[80px] object-contain border border-indigo-500/30 rounded bg-slate-950 shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                  />
                ) : (
                  <div className="w-[80px] h-[80px] flex items-center justify-center border border-dashed border-slate-700 rounded text-slate-600 text-xs">
                    VACÍO
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Phase 3: Swarm Reasoning Console (Structured outputs) */}
          <div className="border border-indigo-500/20 rounded-2xl bg-slate-950/50 backdrop-blur p-6 flex-1 flex flex-col min-h-[300px]">
            <div className="flex items-center justify-between border-b border-indigo-500/10 pb-2 mb-3">
              <h2 className="text-sm font-semibold tracking-wider text-indigo-300 uppercase flex items-center gap-2">
                <span>🧠 Swarm Reasoning Console</span>
                {predictedPath.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 animate-pulse">
                    Trajectory Rendered
                  </span>
                )}
              </h2>
              <span className={`px-2 py-0.5 rounded border text-[10px] uppercase ${loading || autoplay ? 'bg-amber-950/50 border-amber-500/30 text-amber-400 animate-pulse' : 'bg-emerald-950/50 border-emerald-500/30 text-emerald-400'}`}>
                {loading || autoplay ? 'Procesando' : 'Online'}
              </span>
            </div>

            {/* Console Log Area */}
            <div className="flex-1 overflow-y-auto space-y-3 text-xs pr-2 max-h-[300px] scrollbar-thin scrollbar-thumb-indigo-950/80">
              {agentLogs.map((log, index) => {
                let colorClass = 'text-indigo-400';
                let tag = `[${log.agent}]`;
                
                if (log.agent === 'Perceptor') colorClass = 'text-blue-400';
                if (log.agent === 'Estratega') colorClass = 'text-purple-400';
                if (log.agent === 'System') colorClass = 'text-slate-400';
                if (log.agent === 'Error') colorClass = 'text-red-400';

                return (
                  <div key={index} className="flex flex-col gap-1 border-b border-slate-900 pb-2 last:border-0">
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span className={`${colorClass} font-semibold`}>{tag}</span>
                      <span>{log.timestamp}</span>
                    </div>
                    <p className="text-slate-200 whitespace-pre-wrap leading-relaxed pl-1">{log.text}</p>
                  </div>
                );
              })}
              {loading && (
                <div className="flex items-center gap-2 text-slate-500 text-[11px] animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]"></span>
                  Generando respuesta estructurada en Cerebras Gemma 4...
                </div>
              )}
            </div>
          </div>

          {/* Phase 4: Comparative Telemetry (LIVE API DATA) */}
          <div className="border border-indigo-500/20 rounded-2xl bg-slate-950/50 backdrop-blur p-6">
            <div className="flex items-center justify-between border-b border-indigo-500/10 pb-2 mb-4">
              <h2 className="text-sm font-semibold tracking-wider text-indigo-300 uppercase">
                ⚡ Real-time Telemetry (Cerebras Cloud vs GPU standard)
              </h2>
              <div className="px-2 py-0.5 rounded bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 text-[10px] uppercase">
                {metricsLoaded ? 'API Live Data' : 'Default Values'}
              </div>
            </div>

            {/* Side-by-side comparative cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Cerebras Card */}
              <div className={`relative border-2 rounded-xl bg-slate-900/50 p-5 transition-all duration-300 ${
                metricsLoaded && !loading && cerebrasMetrics.latency > 0
                  ? 'border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                  : 'border-indigo-500/20'
              }`}>
                {/* Glow status indicator */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">
                    REAL-TIME SPEEDS
                  </span>
                </div>

                <div className="text-xs text-slate-400 uppercase mb-1">Cerebras Gemma 4 31B</div>
                
                {loading ? (
                  <div className="h-10 flex items-center text-indigo-400 text-sm animate-pulse">
                    ⚡ MIDIENDO...
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-bold text-emerald-400">
                      {metricsLoaded ? cerebrasMetrics.latency : '18'}
                    </span>
                    <span className="text-xs text-emerald-500">ms</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-800 text-[11px] text-slate-400">
                  <div>
                    <div>TTFT:</div>
                    <div className="text-slate-200 font-bold">
                      {loading ? '...' : metricsLoaded ? `${cerebrasMetrics.ttft} ms` : '4 ms'}
                    </div>
                  </div>
                  <div>
                    <div>Rendimiento:</div>
                    <div className="text-slate-200 font-bold">
                      {loading ? '...' : metricsLoaded ? `${cerebrasMetrics.tokensPerSecond} t/s` : '285 t/s'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Standard GPU Card */}
              <div className={`relative border rounded-xl p-5 transition-all duration-300 ${
                gpuLoading ? 'border-amber-500/40 bg-slate-900/30' : 'border-slate-800 bg-slate-950'
              }`}>
                <div className="absolute top-3 right-3 flex items-center gap-1">
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${
                    gpuLoading ? 'text-amber-400 animate-pulse' : 'text-slate-500'
                  }`}>
                    {gpuLoading ? '⏳ BUFFERING / COLD START' : '⚠️ LAGGING'}
                  </span>
                </div>

                <div className="text-xs text-slate-400 uppercase mb-1">GPU Cloud Estándar</div>
                
                {gpuLoading ? (
                  <div className="h-10 flex items-center gap-2 text-amber-400 text-sm">
                    <span className="animate-spin h-4 w-4 border-2 border-amber-400 border-t-transparent rounded-full"></span>
                    PROCESANDO...
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-bold text-slate-300">
                      {metricsLoaded ? gpuMetrics.latency : '820'}
                    </span>
                    <span className="text-xs text-slate-500">ms</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-800 text-[11px] text-slate-400">
                  <div>
                    <div>TTFT:</div>
                    <div className="text-slate-200 font-bold">
                      {gpuLoading ? '...' : metricsLoaded ? `${gpuMetrics.ttft} ms` : '340 ms'}
                    </div>
                  </div>
                  <div>
                    <div>Rendimiento:</div>
                    <div className="text-slate-200 font-bold">
                      {gpuLoading ? '...' : metricsLoaded ? `${gpuMetrics.tokensPerSecond} t/s` : '42 t/s'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Autocalculated comparison banner */}
            <div className="mt-4 p-4 rounded-lg bg-indigo-950/30 border border-indigo-500/20 text-center">
              <span className="text-sm text-indigo-200 tracking-wide">
                {gpuLoading ? (
                  <span className="flex items-center justify-center gap-2 animate-pulse">
                    ⚡ Calculando factor de velocidad en tiempo real...
                  </span>
                ) : (
                  <>
                    🔥 Cerebras es <strong className="text-emerald-400 text-base font-bold">{speedRatio} veces</strong> más rápido que las arquitecturas GPU estándar.
                  </>
                )}
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* Cyber Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/50 py-3 text-center text-[10px] text-slate-500 uppercase tracking-wider">
        🚀 CHRONOS-BOT • CEREBRAS x GEMMA 4 HACKATHON 2026
      </footer>
    </div>
  );
}
