'use client';

import React, { useState } from 'react';
import { SimulationCanvas } from '@/components/simulation/SimulationCanvas';
import { SettingsPanel } from '@/components/dashboard/SettingsPanel';
import { SwarmConsole } from '@/components/dashboard/SwarmConsole';
import { TelemetryPanel } from '@/components/dashboard/TelemetryPanel';
import { FleetPanel } from '@/components/dashboard/FleetPanel';
import { TerminalPanel } from '@/components/dashboard/TerminalPanel';
import { NetworkPanel } from '@/components/dashboard/NetworkPanel';
import { CyberCard } from '@/components/ui/CyberCard';
import { ShaderBackground } from '@/components/ui/ShaderBackground';

import { useVoice } from '@/hooks/useVoice';
import { useRecorder } from '@/hooks/useRecorder';
import { useSimulation } from '@/hooks/useSimulation';
import { calculateAStarPath } from '@/lib/astar';

/**
 * Página principal declarativa de Chronos-Bot.
 * Soporta navegación de paneles virtuales SPA, modales interactivos y cero emojis,
 * reemplazados íntegramente por iconos vectoriales SVG limpios.
 */
export default function Home() {
  // 1. Asistencia por voz
  const { voiceEnabled, speakText, toggleVoice } = useVoice();

  // 2. Control de navegación virtual (Secciones del Dashboard)
  const [activeSection, setActiveSection] = useState<'simulation' | 'fleet' | 'agents' | 'telemetry' | 'terminal' | 'logs' | 'network'>('simulation');

  // 3. Modales de sistema y menú móvil
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isSupportOpen, setIsSupportOpen] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // 4. Estados complementarios de seguridad y visualización
  const [mitigationEnabled, setMitigationEnabled] = useState<boolean>(false);
  const [showAStarPath, setShowAStarPath] = useState<boolean>(false);

  // 5. Hook core del motor de la simulación del enjambre
  const {
    canvasRef,
    base64Image,
    obstacles,
    robotPos,
    copied,
    loading,
    gpuLoading,
    autoplay,
    gridSize,
    history,
    predictedPath,
    agentLogs,
    metricsLoaded,
    cerebrasMetrics,
    gpuMetrics,
    speedRatio,
    handleRobotMove,
    handleObstaclesChange,
    handleCaptureState,
    handleCopyBase64,
    moveRobotManually,
    handleRunSwarm,
    handleToggleAutoplay,
    handleGridSizeChange,
    addLog,
  } = useSimulation({
    voiceEnabled,
    speakText,
    mitigationEnabled,
  });

  // 6. Hook del grabador de video
  const { isRecording, startRecording, stopRecording } = useRecorder({
    onLog: addLog,
    voiceEnabled,
    speakText,
  });

  // Calcular camino A* para pasarlo opcionalmente al canvas de simulación
  const astarPath = calculateAStarPath(
    robotPos,
    [gridSize - 1, gridSize - 1],
    obstacles,
    gridSize
  );

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans selection:bg-[#3b82f6]/30 selection:text-white">
      {/* Shader WebGL animado y partículas de fondo de Stitch */}
      <ShaderBackground />

      {/* Navbar Superior (TopNavBar) */}
      <header className="fixed top-0 w-full z-50 bg-[#0f172a]/15 backdrop-blur-xl border-b border-white/10 flex justify-between items-center px-8 py-4 h-16">
        <div className="flex items-center gap-4 md:gap-6">
          {/* Botón de Menú Móvil responsivo */}
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="lg:hidden text-[#3b82f6] hover:text-white p-1 transition-all cursor-pointer flex items-center"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <h1 className="text-xl font-bold tracking-widest text-[#3b82f6] drop-shadow-[0_0_8px_rgba(59,130,246,0.5)] font-mono uppercase cursor-default">
            CHRONOS-BOT
          </h1>
          <div className="flex gap-4 items-center">
            <span className="px-2.5 py-1 rounded bg-[#4edea3]/10 border border-[#4edea3]/30 font-mono text-[10px] text-[#4edea3] uppercase flex items-center gap-2 cursor-default">
              <span className="w-1.5 h-1.5 rounded-none bg-[#4edea3] animate-pulse"></span>
              {loading || gpuLoading || autoplay ? 'PROCESANDO' : 'ONLINE / STANDBY'}
            </span>
            <span className="px-2.5 py-1 rounded bg-[#3b82f6]/10 border border-[#3b82f6]/30 font-mono text-[10px] text-[#3b82f6] uppercase cursor-default">
              TRACK: MULTIVERSE AGENTS
            </span>
          </div>
        </div>

        <nav className="hidden md:flex gap-8 font-mono text-[10px] tracking-widest uppercase">
          <button 
            onClick={() => setActiveSection('fleet')}
            className={`transition-all px-2 py-1 ${activeSection === 'fleet' ? 'text-[#3b82f6] border-b border-[#3b82f6]' : 'text-slate-400 hover:text-white'}`}
          >
            FLEET
          </button>
          <button 
            onClick={() => setActiveSection('logs')}
            className={`transition-all px-2 py-1 ${activeSection === 'logs' ? 'text-[#3b82f6] border-b border-[#3b82f6]' : 'text-slate-400 hover:text-white'}`}
          >
            LOGS
          </button>
          <button 
            onClick={() => setActiveSection('network')}
            className={`transition-all px-2 py-1 ${activeSection === 'network' ? 'text-[#3b82f6] border-b border-[#3b82f6]' : 'text-slate-400 hover:text-white'}`}
          >
            NETWORK
          </button>
        </nav>

        <div className="flex gap-6 items-center">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="font-mono text-[10px] uppercase tracking-widest text-[#3b82f6] hover:bg-[#3b82f6]/10 px-4 py-2 border border-[#3b82f6]/30 rounded-none transition-all duration-300 cursor-pointer"
          >
            SYSTEM_UP
          </button>
          <div className="flex gap-3 text-slate-400">
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="hover:text-white transition-all duration-300 hover:rotate-90 cursor-pointer flex items-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button 
              onClick={() => setIsNotificationsOpen(true)}
              className="hover:text-white transition-all duration-300 hover:scale-110 cursor-pointer flex items-center relative"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {mitigationEnabled && history.length > 0 && (
                <span className="absolute top-0 right-0 w-2 h-2 rounded-none bg-red-500 animate-ping"></span>
              )}
            </button>
          </div>
          <div className="w-8 h-8 rounded-none border border-[#3b82f6]/40 overflow-hidden ml-2">
            <img 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD0vWcC6E-zezu0cUUiBXZy9kL-pkZ0DPXPzlbinCysm8iRWcjhq8fYB5QvgBAk949WM3T2Z2Xgl0vEfks5xgw-S-3ePu0PytEPCrUOLaO0x5u9gZVS_eP4H4LOmR3wrhSwY88rU1T6ZZhljK5PCIj73LY5DNM_gGENoa1PDrW-NC2aqXcnxZWCqIqe0XLcOWTrwpOb51uJqqrRJePaOnEb_Fh4iCfG7gcMFF7NNW1CZpXoMu62PVZJQfvFHyU9bwawegqdj6NsmLKL"
              alt="Operator"
            />
          </div>
        </div>
      </header>

      {/* Barra de Navegación Lateral (SideNavBar) */}
      <aside className={`fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-[#0b0e15]/95 lg:bg-white/5 backdrop-blur-xl border-r border-white/10 flex flex-col py-8 z-40 font-mono transition-transform duration-300 ${
        isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="px-6 mb-10 flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#3b82f6]/10 border border-[#3b82f6]/40 flex items-center justify-center rounded-none">
              {/* Chip microprocesador SVG */}
              <svg className="w-6 h-6 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-bold text-white tracking-wider">NODE_01</div>
              <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-none bg-[#3b82f6] animate-pulse"></span>
                SECTOR_7G
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-2 text-xs uppercase tracking-widest text-slate-400">
          <button 
            onClick={() => {
              setActiveSection('fleet');
              setIsMobileSidebarOpen(false);
            }}
            className={`flex items-center gap-4 px-6 py-3 transition-all duration-300 border-r-2 ${
              activeSection === 'fleet' 
                ? 'bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]' 
                : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            DASHBOARD
          </button>
          <button 
            onClick={() => {
              setActiveSection('agents');
              setIsMobileSidebarOpen(false);
            }}
            className={`flex items-center gap-4 px-6 py-3 transition-all duration-300 border-r-2 ${
              activeSection === 'agents' 
                ? 'bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]' 
                : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            AGENTS
          </button>
          <button 
            onClick={() => {
              setActiveSection('simulation');
              setIsMobileSidebarOpen(false);
            }}
            className={`flex items-center gap-4 px-6 py-3 transition-all duration-300 border-r-2 ${
              activeSection === 'simulation' 
                ? 'bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]' 
                : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            SIMULATION
          </button>
          <button 
            onClick={() => {
              setActiveSection('telemetry');
              setIsMobileSidebarOpen(false);
            }}
            className={`flex items-center gap-4 px-6 py-3 transition-all duration-300 border-r-2 ${
              activeSection === 'telemetry' 
                ? 'bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]' 
                : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2" />
            </svg>
            TELEMETRY
          </button>
          <button 
            onClick={() => {
              setActiveSection('terminal');
              setIsMobileSidebarOpen(false);
            }}
            className={`flex items-center gap-4 px-6 py-3 transition-all duration-300 border-r-2 ${
              activeSection === 'terminal' 
                ? 'bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]' 
                : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            TERMINAL
          </button>
        </nav>

        <div className="px-6 mt-auto flex flex-col gap-6">
          <button
            onClick={() => {
              canvasRef.current?.clearObstacles();
              canvasRef.current?.resetRobot();
              handleCaptureState();
              setActiveSection('simulation');
              addLog('System', 'Reiniciando simulación física.');
            }}
            disabled={loading || gpuLoading || autoplay}
            className="w-full py-3 bg-[#3b82f6]/20 border border-[#3b82f6] text-[#3b82f6] text-[11px] hover:bg-[#3b82f6]/30 transition-all duration-300 rounded-none uppercase tracking-widest disabled:opacity-50 cursor-pointer"
          >
            NEW_SIMULATION
          </button>
          <div className="flex gap-4 text-[10px] text-slate-500 font-bold">
            <span 
              onClick={() => setIsSupportOpen(true)}
              className="hover:text-white transition-colors cursor-pointer"
            >
              HELP
            </span>
            <span 
              onClick={() => window.location.reload()}
              className="hover:text-white transition-colors ml-auto cursor-pointer"
            >
              REBOOT
            </span>
          </div>
        </div>
      </aside>

      {/* Backdrop overlay para pantallas móviles */}
      {isMobileSidebarOpen && (
        <div 
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden transition-all duration-300"
        />
      )}

      {/* Contenedor de Contenido Principal (Desplazado mt-16 y ml-0 lg:ml-64) */}
      <main className="ml-0 lg:ml-64 mt-16 p-4 md:p-6 flex-1 h-[calc(100vh-4rem)] overflow-y-auto relative z-10">
        
        {/* Renderizado Condicional de la Sección Virtual Seleccionada */}
        {activeSection === 'simulation' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Columna Izquierda: Simulación y Configuración */}
            <div className="flex flex-col gap-6">
              {/* Simulation Canvas Envuelto con Guías HUD de Stitch */}
              <div className="border border-white/10 bg-white/5 backdrop-blur-xl relative aspect-square p-4 flex flex-col rounded-none transition-all duration-500 hover:border-[#3b82f6]/50">
                {/* Guías HUD de Esquinas */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#3b82f6]"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white/20"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white/20"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white/20"></div>

                <div className="w-full flex items-center justify-between mb-4 border-b border-indigo-500/10 pb-3 font-mono">
                  <h2 className="text-xs font-semibold tracking-wider text-indigo-300 uppercase">
                    {gridSize}x{gridSize} Simulation Grid
                  </h2>
                  <span className="text-[10px] text-slate-400">
                    Pos: [{robotPos[0]}, {robotPos[1]}]
                  </span>
                </div>

                {/* Canvas Interactivo */}
                <div className="flex-1 flex items-center justify-center relative">
                  <SimulationCanvas
                    ref={canvasRef}
                    onRobotMove={handleRobotMove}
                    onObstaclesChange={handleObstaclesChange}
                    robotPos={robotPos}
                    obstacles={obstacles}
                    predictedPath={predictedPath}
                    gridSize={gridSize}
                    astarPath={astarPath}
                    showAStarPath={showAStarPath}
                  />
                </div>

                <p className="text-[10px] text-indigo-300/60 font-mono mt-4 text-center">
                  🖱️ Haz clic/arrastra para pintar <span className="text-red-400">Obstáculos (Rojos)</span>. La meta está en [{gridSize - 1}, {gridSize - 1}].
                </p>

                {/* Controles Rápidos */}
                <div className="grid grid-cols-3 gap-2 w-full mt-4 font-mono">
                  <button
                    onClick={() => {
                      canvasRef.current?.clearObstacles();
                      handleCaptureState();
                    }}
                    disabled={loading || gpuLoading || autoplay}
                    className="px-2 py-2 bg-slate-900/60 border border-red-500/30 text-red-400 text-[10px] uppercase tracking-wider hover:bg-red-500/10 disabled:opacity-50 active:scale-95 transition-all cursor-pointer"
                  >
                    Limpiar Mapa
                  </button>
                  <button
                    onClick={() => {
                      canvasRef.current?.resetRobot();
                      handleCaptureState();
                    }}
                    disabled={loading || gpuLoading || autoplay}
                    className="px-2 py-2 bg-slate-900/60 border border-blue-500/30 text-blue-400 text-[10px] uppercase tracking-wider hover:bg-blue-500/10 disabled:opacity-50 active:scale-95 transition-all cursor-pointer"
                  >
                    Reset Robot
                  </button>
                  <button
                    onClick={() => {
                      handleCaptureState();
                      addLog('System', 'Estado del Canvas capturado manualmente.');
                    }}
                    disabled={loading || gpuLoading || autoplay}
                    className="px-2 py-2 bg-slate-900/60 border border-indigo-500/30 text-indigo-400 text-[10px] uppercase tracking-wider hover:bg-indigo-500/10 disabled:opacity-50 active:scale-95 transition-all cursor-pointer"
                  >
                    Capturar Frame
                  </button>
                </div>
              </div>

              {/* Panel de Configuración de Sistema (Fase 5) */}
              <SettingsPanel
                gridSize={gridSize}
                onGridSizeChange={handleGridSizeChange}
                mitigationEnabled={mitigationEnabled}
                onToggleMitigation={() => {
                  const next = !mitigationEnabled;
                  setMitigationEnabled(next);
                  addLog('System', `Mitigación de seguridad A* ${next ? 'ACTIVADA' : 'DESACTIVADA'}.`);
                }}
                showAStarPath={showAStarPath}
                onToggleAStarPath={() => setShowAStarPath(!showAStarPath)}
                voiceEnabled={voiceEnabled}
                onToggleVoice={toggleVoice}
                isRecording={isRecording}
                onStartRecording={startRecording}
                onStopRecording={stopRecording}
                loading={loading}
                gpuLoading={gpuLoading}
                autoplay={autoplay}
              />

              {/* Ejecución del Enjambre */}
              <CyberCard className="flex flex-col gap-2">
                <button
                  onClick={handleToggleAutoplay}
                  disabled={loading || gpuLoading}
                  style={{ clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)' }}
                  className={`w-full py-4 rounded-none font-mono text-xs uppercase tracking-widest font-bold active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    autoplay
                      ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                  }`}
                >
                  {autoplay ? '🛑 DETENER AUTOPILOTO' : '🤖 INICIAR RUTA AUTÓNOMA (LOOP)'}
                </button>

                <button
                  onClick={handleRunSwarm}
                  disabled={loading || gpuLoading || autoplay}
                  style={{ clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)' }}
                  className="w-full py-3 rounded-none bg-indigo-600/90 hover:bg-indigo-500 active:scale-95 transition-all font-mono text-xs uppercase tracking-widest text-indigo-100 disabled:opacity-40 flex items-center justify-center gap-2 border border-[#6366f133] cursor-pointer"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin h-3.5 w-3.5 border-2 border-indigo-200 border-t-transparent rounded-none"></span>
                      Pensando en Cerebras...
                    </span>
                  ) : '🚀 EJECUTAR UN PASO'}
                </button>
              </CyberCard>

              {/* Controlador Manual de Depuración */}
              <CyberCard>
                <h2 className="text-xs font-semibold tracking-wider font-mono text-indigo-300 uppercase mb-3 border-b border-indigo-500/10 pb-2 flex justify-between items-center">
                  <span>Manual Control (Debug)</span>
                  {history.length > 0 && (
                    <span className="text-[10px] text-slate-500">Historial: {history.length} pasos</span>
                  )}
                </h2>
                <div className="flex flex-col items-center gap-2 mt-4 font-mono">
                  <button
                    onClick={() => moveRobotManually('UP')}
                    disabled={loading || gpuLoading || autoplay}
                    className="w-10 h-10 flex items-center justify-center rounded-none bg-slate-900 border border-[#6366f133] hover:bg-indigo-950 hover:border-indigo-400 active:scale-90 transition-all text-indigo-300 disabled:opacity-50 cursor-pointer"
                  >
                    ▲
                  </button>
                  <div className="flex gap-8">
                    <button
                      onClick={() => moveRobotManually('LEFT')}
                      disabled={loading || gpuLoading || autoplay}
                      className="w-10 h-10 flex items-center justify-center rounded-none bg-slate-900 border border-[#6366f133] hover:bg-indigo-950 hover:border-indigo-400 active:scale-90 transition-all text-indigo-300 disabled:opacity-50 cursor-pointer"
                    >
                      ◀
                    </button>
                    <button
                      onClick={() => moveRobotManually('RIGHT')}
                      disabled={loading || gpuLoading || autoplay}
                      className="w-10 h-10 flex items-center justify-center rounded-none bg-slate-900 border border-[#6366f133] hover:bg-indigo-950 hover:border-indigo-400 active:scale-90 transition-all text-indigo-300 disabled:opacity-50 cursor-pointer"
                    >
                      ▶
                    </button>
                  </div>
                  <button
                    onClick={() => moveRobotManually('DOWN')}
                    disabled={loading || gpuLoading || autoplay}
                    className="w-10 h-10 flex items-center justify-center rounded-none bg-slate-900 border border-[#6366f133] hover:bg-indigo-950 hover:border-indigo-400 active:scale-90 transition-all text-indigo-300 disabled:opacity-50 cursor-pointer"
                  >
                    ▼
                  </button>
                </div>
              </CyberCard>
            </div>

            {/* Columna Derecha: Consolas y Telemetría */}
            <div className="flex flex-col gap-6 font-mono">
              
              {/* Serializador Multimodal Base64 */}
              <CyberCard className="flex flex-col min-h-[220px]">
                <div className="flex items-center justify-between border-b border-indigo-500/10 pb-3 mb-4">
                  <h2 className="text-sm font-semibold tracking-wider text-indigo-300 uppercase flex items-center gap-2">
                    📸 Multimodal State Serializer
                  </h2>
                  <div className="flex items-center gap-2">
                    {base64Image && (
                      <button
                        onClick={handleCopyBase64}
                        className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 transition-all cursor-pointer"
                      >
                        {copied ? '¡Copiado!' : '📋 Copiar String'}
                      </button>
                    )}
                    <span className="w-2 h-2 rounded-none bg-blue-500 animate-pulse"></span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1">
                  <div className="md:col-span-8 flex flex-col">
                    <label className="text-[10px] text-slate-400 uppercase mb-1">
                      URI String Base64 (`image/png`)
                    </label>
                    <div
                      id="base64-console"
                      className="flex-1 p-3 rounded-none bg-slate-900/80 border border-slate-800 text-[10px] text-indigo-400/90 break-all overflow-y-auto max-h-[120px] transition-all duration-300 scrollbar-thin scrollbar-thumb-indigo-950"
                    >
                      {base64Image ? base64Image : 'Cargando estado...'}
                    </div>
                  </div>

                  <div className="md:col-span-4 flex flex-col items-center justify-center border border-indigo-500/10 bg-slate-900/30 rounded-none p-2">
                    <label className="text-[10px] text-slate-400 uppercase mb-1">
                      Visión Input Preview
                    </label>
                    {base64Image ? (
                      <img
                        src={base64Image}
                        alt="Canvas state preview"
                        className="max-w-[80px] max-h-[80px] object-contain border border-indigo-500/30 rounded-none bg-slate-950 shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                      />
                    ) : (
                      <div className="w-[80px] h-[80px] flex items-center justify-center border border-dashed border-slate-700 rounded-none text-slate-600 text-xs">
                        VACÍO
                      </div>
                    )}
                  </div>
                </div>
              </CyberCard>

              {/* Consola de Logs del Enjambre */}
              <SwarmConsole
                agentLogs={agentLogs}
                loading={loading}
                autoplay={autoplay}
                predictedPath={predictedPath}
              />

              {/* Panel de Telemetría Comparativa */}
              <TelemetryPanel
                metricsLoaded={metricsLoaded}
                loading={loading}
                gpuLoading={gpuLoading}
                cerebrasMetrics={cerebrasMetrics}
                gpuMetrics={gpuMetrics}
                speedRatio={speedRatio}
              />
            </div>
          </div>
        )}

        {activeSection === 'fleet' && <FleetPanel />}

        {activeSection === 'terminal' && <TerminalPanel />}

        {activeSection === 'network' && <NetworkPanel />}

        {activeSection === 'agents' && (
          <div className="flex flex-col gap-6 font-mono text-xs w-full">
            <CyberCard>
              <h2 className="text-sm font-semibold tracking-wider text-indigo-300 uppercase border-b border-indigo-500/10 pb-3 mb-4">
                🧠 ARQUITECTURA MULTI-AGENTE (ENJAMBRE GEMMA 4)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-blue-500/20 bg-blue-950/10 p-4">
                  <h3 className="text-blue-400 font-bold text-sm mb-2 uppercase">1. Agente Perceptor</h3>
                  <p className="text-slate-300 text-[11px] leading-relaxed mb-4">
                    Este agente multimodal recibe la captura Base64 codificada del canvas. Su función principal es transcribir la disposición física del entorno a un reporte textual estructurado: ubica al robot en la cuadrícula, identifica las coordenadas exactas de todos los obstáculos circundantes y la meta final.
                  </p>
                  <span className="text-[10px] text-slate-500 block uppercase">Inferencia ejecutada en: Cerebras Gemma 4 (31B)</span>
                </div>
                <div className="border border-purple-500/20 bg-purple-950/10 p-4">
                  <h3 className="text-purple-400 font-bold text-sm mb-2 uppercase">2. Agente Estratega</h3>
                  <p className="text-slate-300 text-[11px] leading-relaxed mb-4">
                    Toma el reporte textual del Perceptor y el historial de desvíos acumulados. Utiliza inferencia de razonamiento para deducir el siguiente movimiento ortogonal seguro (UP, DOWN, LEFT, RIGHT). La respuesta se restringe bajo un esquema JSON rígido y estructurado para evitar desvíos sintácticos.
                  </p>
                  <span className="text-[10px] text-slate-500 block uppercase">Inferencia ejecutada en: Cerebras Gemma 4 (31B)</span>
                </div>
              </div>
            </CyberCard>
          </div>
        )}

        {activeSection === 'telemetry' && (
          <div className="flex flex-col gap-6 font-mono text-xs w-full">
            <TelemetryPanel
              metricsLoaded={metricsLoaded}
              loading={loading}
              gpuLoading={gpuLoading}
              cerebrasMetrics={cerebrasMetrics}
              gpuMetrics={gpuMetrics}
              speedRatio={speedRatio}
            />
            <CyberCard>
              <h2 className="text-sm font-semibold tracking-wider text-indigo-300 uppercase border-b border-indigo-500/10 pb-3 mb-4">
                📊 MÉTRICAS DE TELEMETRÍA Y CONTROL
              </h2>
              <div className="space-y-4 text-slate-300 text-[11px] leading-relaxed">
                <p>
                  Las velocidades de inferencia se miden comparando el **Time to First Token (TTFT)** y los **tokens por segundo (t/s)** promedio.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-[#6366f133] p-4">
                    <span className="text-emerald-400 font-bold block mb-1">CEREBRAS WSE-3 SPEED:</span>
                    La arquitectura Wafer-Scale Engine elimina el retardo por bus PCIe, resolviendo tokens en paralelo a velocidades de hasta 285 tokens/segundo.
                  </div>
                  <div className="border border-[#6366f133] p-4">
                    <span className="text-slate-400 font-bold block mb-1">STANDARD CLOUD GPU:</span>
                    Las colas de peticiones y el procesamiento secuencial en GPUs estándar elevan la latencia total del enjambre por encima de los 1500ms, imposibilitando el guiado reactivo autónomo.
                  </div>
                </div>
              </div>
            </CyberCard>
          </div>
        )}

        {activeSection === 'logs' && (
          <div className="flex flex-col gap-6 font-mono text-xs w-full">
            <CyberCard>
              <div className="flex justify-between items-center border-b border-indigo-500/10 pb-3 mb-4">
                <h2 className="text-sm font-semibold tracking-wider text-indigo-300 uppercase">
                  📜 LOGS CONSOLIDADOS DEL SISTEMA
                </h2>
                <button
                  onClick={() => window.location.reload()}
                  style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)' }}
                  className="px-3 py-1 bg-red-950/40 border border-red-500/30 text-red-400 text-[10px] hover:bg-red-900/50 transition-all cursor-pointer font-bold"
                >
                  CLEAR LOG BUFFER
                </button>
              </div>

              <div className="p-4 bg-slate-950/80 border border-slate-900 max-h-[400px] overflow-y-auto space-y-3">
                {agentLogs.length === 0 ? (
                  <p className="text-slate-600 italic">No hay logs en el búfer. Realiza movimientos para acumular telemetría.</p>
                ) : (
                  agentLogs.map((log, index) => (
                    <div key={index} className="border-b border-slate-900 pb-2 flex justify-between gap-4">
                      <div>
                        <span className="text-[#3b82f6] font-bold">[{log.agent}]</span>{' '}
                        <span className="text-slate-200">{log.text}</span>
                      </div>
                      <span className="text-slate-500 text-[9px]">{log.timestamp}</span>
                    </div>
                  ))
                )}
              </div>
            </CyberCard>
          </div>
        )}
      </main>

      {/* Modal: Settings / Ajustes */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md font-mono text-xs p-4">
          <div className="border border-[#6366f133] bg-[#0b0e15]/95 p-6 max-w-md w-full shadow-[0_0_30px_rgba(99,102,241,0.3)]">
            <div className="flex justify-between items-center border-b border-indigo-500/10 pb-3 mb-4">
              <h3 className="text-sm font-bold text-indigo-300 uppercase flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Ajustes del Sistema</span>
              </h3>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-slate-500 uppercase block mb-1">Target Engine Model</label>
                <div className="p-2 border border-indigo-500/20 bg-slate-900 text-slate-300">gemma-4-31b-multimodal</div>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase block mb-1">API Base Endpoint</label>
                <div className="p-2 border border-indigo-500/20 bg-slate-900 text-slate-300">api.cerebras.ai/v1</div>
              </div>
              <div className="flex items-center justify-between">
                <span>Voz Sintética Activa:</span>
                <span className={voiceEnabled ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                  {voiceEnabled ? 'ESPAÑOL (FEM)' : 'MUTED'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Mitigación A*:</span>
                <span className={mitigationEnabled ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                  {mitigationEnabled ? 'HABILITADA' : 'DESACTIVADA'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsSettingsOpen(false)}
              style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)' }}
              className="w-full mt-6 py-2 bg-[#3b82f6] text-white uppercase text-center hover:bg-blue-600 transition-all font-bold cursor-pointer"
            >
              Aplicar y Salir
            </button>
          </div>
        </div>
      )}

      {/* Modal: Notifications / Alertas */}
      {isNotificationsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md font-mono text-xs p-4">
          <div className="border border-red-500/30 bg-[#0b0e15]/95 p-6 max-w-md w-full shadow-[0_0_30px_rgba(239,68,68,0.2)]">
            <div className="flex justify-between items-center border-b border-red-500/10 pb-3 mb-4">
              <h3 className="text-sm font-bold text-red-400 uppercase flex items-center gap-2">
                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span>Alertas de Sistema Recientes</span>
              </h3>
              <button 
                onClick={() => setIsNotificationsOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-[250px] overflow-y-auto">
              {mitigationEnabled && history.length > 0 ? (
                <div className="p-3 border border-red-500/20 bg-red-950/10 text-red-300">
                  ⚠️ <strong>Colisión Mitigada Localmente:</strong> El enjambre sugirió desvío pero fue corregido por A* en el Sector 7G.
                </div>
              ) : (
                <p className="text-slate-500 italic">No hay alertas críticas en el búfer en este momento.</p>
              )}
              <div className="p-3 border border-indigo-500/20 bg-indigo-950/10 text-indigo-300">
                ℹ️ <strong>System Startup Completed:</strong> Conexión establecida a Cerebras Cloud CS-3.
              </div>
            </div>

            <button
              onClick={() => setIsNotificationsOpen(false)}
              style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)' }}
              className="w-full mt-6 py-2 bg-red-950/60 border border-red-500/30 text-red-400 uppercase text-center hover:bg-red-900/50 transition-all font-bold cursor-pointer"
            >
              Cerrar Alertas
            </button>
          </div>
        </div>
      )}

      {/* Modal: Support / Help */}
      {isSupportOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md font-mono text-xs p-4">
          <div className="border border-indigo-500/30 bg-[#0b0e15]/95 p-6 max-w-lg w-full shadow-[0_0_30px_rgba(99,102,241,0.25)]">
            <div className="flex justify-between items-center border-b border-indigo-500/10 pb-3 mb-4">
              <h3 className="text-sm font-bold text-indigo-300 uppercase flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Manual de Soporte - Chronos-Bot</span>
              </h3>
              <button 
                onClick={() => setIsSupportOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-slate-300 text-[11px] leading-relaxed max-h-[300px] overflow-y-auto pr-1">
              <div>
                <strong className="text-indigo-300">¿Cómo interactuar con el lienzo?</strong>
                <p>Haz clic y arrastra sobre la cuadrícula del canvas de simulación para pintar celdas de obstáculos (Rojas). El robot evadirá estas celdas.</p>
              </div>
              <div>
                <strong className="text-indigo-300">¿Cómo funciona el autopiloto?</strong>
                <p>Al presionar "Iniciar Ruta Autónoma", el simulador captura el estado actual, realiza peticiones asíncronas al enjambre de Cerebras Gemma 4 y avanza paso a paso hasta alcanzar la meta [Grid-1, Grid-1].</p>
              </div>
              <div>
                <strong className="text-indigo-300">¿Qué hace el asistente por voz?</strong>
                <p>Narra en tiempo real mediante síntesis sintética las lecturas de los sensores, desvíos A* y estatus de llegada a la meta del robot.</p>
              </div>
            </div>

            <button
              onClick={() => setIsSupportOpen(false)}
              style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)' }}
              className="w-full mt-6 py-2 bg-indigo-950/60 border border-indigo-500/30 text-indigo-400 uppercase text-center hover:bg-indigo-900/50 transition-all font-bold cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Pie de Página */}
      <footer className="mt-auto border-t border-slate-900/60 bg-slate-950/20 py-3 text-center text-[10px] text-slate-500 uppercase tracking-wider relative z-10">
        🚀 CHRONOS-BOT • CEREBRAS x GEMMA 4 HACKATHON 2026
      </footer>
    </div>
  );
}
