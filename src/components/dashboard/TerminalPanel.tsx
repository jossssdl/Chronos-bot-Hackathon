import React, { useState, useRef, useEffect } from 'react';
import { CyberCard } from '../ui/CyberCard';

interface CommandHistory {
  input: string;
  output: string;
  timestamp: string;
}

/**
 * Componente que renderiza una shell interactiva de comandos (TerminalPanel).
 * Permite al usuario interactuar mediante CLI simulada con el nodo principal.
 */
export function TerminalPanel() {
  const [input, setInput] = useState<string>('');
  const [history, setHistory] = useState<CommandHistory[]>([
    {
      input: 'system init',
      output: 'Chronos-Bot Terminal [v1.0.4]\nConnection established with Cerebras Cloud Node.\nType "help" for a list of available commands.',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const consoleBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    consoleBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input.trim().toLowerCase();
    if (!cmd) return;

    let response = '';

    switch (cmd) {
      case 'help':
        response = 
          'Available Commands:\n' +
          '  help      - Muestra este menú de ayuda técnica.\n' +
          '  status    - Consulta el estado operativo del robot NODE_01.\n' +
          '  sysinfo   - Imprime los parámetros de hardware y red del enjambre.\n' +
          '  astar     - Comprueba el estado del módulo de mitigación clásico.\n' +
          '  clear     - Limpia la consola de logs históricos.';
        break;
      case 'status':
        response = 
          'NODE_01 OPERATIONAL STATE:\n' +
          '  - Connection: ONLINE (Gemma 4 31B)\n' +
          '  - Sector: SECTOR_7G\n' +
          '  - Battery Cell: 94%\n' +
          '  - Swarm Latency: ~18ms (Cerebras SDK)';
        break;
      case 'sysinfo':
        response = 
          'HARDWARE & SWARM SYSTEM METRICS:\n' +
          '  - Provider: Cerebras Cloud Service\n' +
          '  - Engine: CS-3 Chip (Wafer-Scale Engine)\n' +
          '  - Pipeline Model: Gemma-4-31B-Multimodal\n' +
          '  - Processing Capacity: 285 tokens/sec\n' +
          '  - Fallback Engine: A* Algorithmic Controller';
        break;
      case 'astar':
        response = 
          'CLASSIC NAVIGATION MODULE STATE:\n' +
          '  - Status: READY / ARMED\n' +
          '  - Purpose: Intercept and correct AI visual collision predictions\n' +
          '  - Resolution Mode: Ortogonal Pathfinding';
        break;
      case 'clear':
        setHistory([]);
        setInput('');
        return;
      default:
        response = `Command "${cmd}" not recognized. Type "help" for a list of commands.`;
    }

    setHistory((prev) => [
      ...prev,
      {
        input,
        output: response,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
    setInput('');
  };

  return (
    <div className="flex flex-col gap-6 font-mono text-xs w-full">
      <CyberCard className="w-full flex flex-col min-h-[400px]">
        <div className="flex justify-between items-center border-b border-indigo-500/10 pb-3 mb-4">
          <h2 className="text-sm font-semibold tracking-wider text-indigo-300 uppercase flex items-center gap-2">
            <span>📟 CRITICAL COMMAND SHELL (CLI)</span>
          </h2>
          <span className="px-2 py-0.5 border border-indigo-500/30 text-indigo-400 text-[10px] uppercase animate-pulse">
            Terminal Live
          </span>
        </div>

        {/* Pantalla de Terminal */}
        <div className="flex-1 p-4 bg-slate-950/80 border border-slate-900 rounded-none overflow-y-auto max-h-[300px] space-y-4 scrollbar-thin scrollbar-thumb-indigo-950/60 text-slate-300 text-[11px] leading-relaxed">
          {history.map((item, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span>{`operator@chronos-bot:~$ ${item.input}`}</span>
                <span>{item.timestamp}</span>
              </div>
              <p className="whitespace-pre-wrap text-emerald-400/90 pl-2">
                {item.output}
              </p>
            </div>
          ))}
          <div ref={consoleBottomRef} />
        </div>

        {/* Input de comandos */}
        <form onSubmit={handleCommandSubmit} className="mt-4 flex flex-col sm:flex-row gap-2">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className="text-[#3b82f6] font-bold py-1.5 pl-1 select-none whitespace-nowrap">
              <span className="hidden sm:inline">operator@chronos-bot:~$</span>
              <span className="inline sm:hidden">&gt;</span>
            </span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-slate-950 border border-[#6366f133] focus:border-[#3b82f6] px-3 py-1.5 text-[#3b82f6] font-semibold font-mono rounded-none outline-none min-w-0"
              placeholder="Escribe 'help' y presiona Enter..."
              autoFocus
            />
          </div>
          <button
            type="submit"
            style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)' }}
            className="w-full sm:w-auto px-4 py-1.5 bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 text-[10px] uppercase hover:bg-indigo-900/50 hover:border-indigo-400 transition-all cursor-pointer font-bold shrink-0 text-center"
          >
            EXEC
          </button>
        </form>
      </CyberCard>
    </div>
  );
}
