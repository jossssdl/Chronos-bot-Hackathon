'use client';

import React, {
  useRef,
  useEffect,
  useState,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from 'react';

export interface SimulationCanvasRef {
  captureSimulationState: () => string;
  clearObstacles: () => void;
  resetRobot: () => void;
  setRobotPosition: (pos: [number, number]) => void;
  getRobotPosition: () => [number, number];
  getObstacles: () => [number, number][];
}

interface SimulationCanvasProps {
  onRobotMove?: (pos: [number, number]) => void;
  onObstaclesChange?: (obstacles: [number, number][]) => void;
  robotPos: [number, number]; // Gestionado por el padre
  obstacles: [number, number][]; // Gestionado por el padre (Fuente única de verdad)
  predictedPath?: [number, number][]; // Trazado predictivo de la IA
  gridSize?: number; // Dimensión de la grilla (dinámica)
  astarPath?: [number, number][]; // Trayectoria propuesta por A* local
  showAStarPath?: boolean; // Interruptor para visualizar el camino A*
}

const CANVAS_SIZE = 400; // Tamaño visual fijo del canvas

export const SimulationCanvas = forwardRef<SimulationCanvasRef, SimulationCanvasProps>(
  (
    {
      onRobotMove,
      onObstaclesChange,
      robotPos: externalRobotPos,
      obstacles = [],
      predictedPath = [],
      gridSize = 10,
      astarPath = [],
      showAStarPath = false,
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // Tamaño de celda dinámico en base al tamaño de la grilla
    const cellSize = CANVAS_SIZE / gridSize;

    // Estado interno sincronizado con el padre para actualizaciones locales fluidas
    const [robotPos, setInternalRobotPos] = useState<[number, number]>(externalRobotPos || [0, 0]);
    const [isDrawing, setIsDrawing] = useState<boolean>(false);
    const [drawMode, setDrawMode] = useState<'paint' | 'erase' | null>(null);

    // Sincronizar posición externa del robot
    useEffect(() => {
      if (externalRobotPos) {
        setInternalRobotPos(externalRobotPos);
      }
    }, [externalRobotPos]);

    const setRobotPosition = useCallback(
      (pos: [number, number]) => {
        setInternalRobotPos(pos);
        if (onRobotMove) onRobotMove(pos);
      },
      [onRobotMove]
    );

    // Dibujar la grilla, obstáculos, meta, robot y trayectorias
    const draw = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Limpiar fondo (Fondo oscuro Cyberpunk)
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      // 2. Dibujar obstáculos (Cuadrados neón rojos)
      obstacles.forEach(([x, y]) => {
        // Ignorar si el obstáculo se sale de los límites de la grilla actual
        if (x >= gridSize || y >= gridSize) return;

        ctx.fillStyle = 'rgba(239, 68, 68, 0.9)'; // Tailwind red-500
        ctx.fillRect(x * cellSize + 2, y * cellSize + 2, cellSize - 4, cellSize - 4);

        // Borde interior del obstáculo
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(x * cellSize + 2, y * cellSize + 2, cellSize - 4, cellSize - 4);
      });

      // 3. Dibujar líneas de la grilla (Azul-grisáceo sutil)
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.15)'; // Indigo
      ctx.lineWidth = 1;
      for (let i = 0; i <= gridSize; i++) {
        // Líneas verticales
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, CANVAS_SIZE);
        ctx.stroke();

        // Líneas horizontales
        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(CANVAS_SIZE, i * cellSize);
        ctx.stroke();
      }

      // 4. Dibujar Meta (Objetivo verde neón en [gridSize-1, gridSize-1])
      const goalX = gridSize - 1;
      const goalY = gridSize - 1;
      ctx.fillStyle = 'rgba(16, 185, 129, 0.2)'; // Relleno verde transparente
      ctx.fillRect(goalX * cellSize + 2, goalY * cellSize + 2, cellSize - 4, cellSize - 4);

      // Contorno de la meta
      ctx.strokeStyle = '#10b981'; // Emerald 500
      ctx.lineWidth = 3;
      ctx.strokeRect(goalX * cellSize + 2, goalY * cellSize + 2, cellSize - 4, cellSize - 4);

      // Punto central de la meta
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(
        goalX * cellSize + cellSize / 2,
        goalY * cellSize + cellSize / 2,
        Math.max(4, cellSize * 0.15),
        0,
        Math.PI * 2
      );
      ctx.fill();

      // 5. Dibujar Ruta de A* local (Línea naranja discontinua neón)
      if (showAStarPath && astarPath && astarPath.length > 0) {
        ctx.strokeStyle = '#f97316'; // Orange 500
        ctx.lineWidth = 2.5;
        ctx.setLineDash([5, 5]); // Línea discontinua
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur = 6;
        ctx.beginPath();

        astarPath.forEach(([px, py], index) => {
          const cx = px * cellSize + cellSize / 2;
          const cy = py * cellSize + cellSize / 2;
          if (index === 0) {
            ctx.moveTo(cx, cy);
          } else {
            ctx.lineTo(cx, cy);
          }
        });

        ctx.stroke();
        ctx.setLineDash([]); // Restablecer estilo de línea
        ctx.shadowBlur = 0; // Restablecer sombra
      }

      // 6. Dibujar Robot (Círculo/cuadrado azul neón)
      const [rx, ry] = robotPos;
      // Validar que el robot no esté fuera de los límites en redibujados intermedios
      if (rx < gridSize && ry < gridSize) {
        ctx.fillStyle = 'rgba(59, 130, 246, 0.3)'; // Relleno azul transparente
        ctx.fillRect(rx * cellSize + 2, ry * cellSize + 2, cellSize - 4, cellSize - 4);

        ctx.strokeStyle = '#3b82f6'; // Blue 500
        ctx.lineWidth = 3;
        ctx.strokeRect(rx * cellSize + 2, ry * cellSize + 2, cellSize - 4, cellSize - 4);

        // Núcleo brillante
        ctx.fillStyle = '#3b82f6';
        ctx.shadowColor = '#3b82f6';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(
          rx * cellSize + cellSize / 2,
          ry * cellSize + cellSize / 2,
          Math.max(5, cellSize * 0.2),
          0,
          Math.PI * 2
        );
        ctx.fill();

        ctx.shadowBlur = 0; // Restablecer sombra
      }

      // 7. Dibujar Trayectoria Predicha por la IA (Puntos cian neón)
      if (predictedPath && predictedPath.length > 0) {
        ctx.shadowColor = '#06b6d4'; // Cyan 500
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#06b6d4';

        predictedPath.forEach(([px, py]) => {
          // Omitir si la coordenada está fuera de los límites de la grilla
          if (px >= gridSize || py >= gridSize) return;

          // Omitir dibujo si coincide con el robot o la meta para evitar amontonamiento
          if ((px === robotPos[0] && py === robotPos[1]) || (px === gridSize - 1 && py === gridSize - 1)) return;

          ctx.beginPath();
          ctx.arc(
            px * cellSize + cellSize / 2,
            py * cellSize + cellSize / 2,
            Math.max(3, cellSize * 0.1),
            0,
            Math.PI * 2
          );
          ctx.fill();
        });

        ctx.shadowBlur = 0;
      }
    }, [robotPos, obstacles, predictedPath, gridSize, astarPath, showAStarPath, cellSize]);

    // Redibujar siempre que cambien los obstáculos, el robot, la trayectoria predicha o el tamaño de la grilla
    useEffect(() => {
      draw();
    }, [draw, obstacles, robotPos, predictedPath, gridSize, astarPath, showAStarPath]);

    // Exponer funciones al componente padre
    useImperativeHandle(
      ref,
      () => ({
        captureSimulationState: () => {
          const canvas = canvasRef.current;
          if (!canvas) return '';
          return canvas.toDataURL('image/png');
        },
        clearObstacles: () => {
          if (onObstaclesChange) onObstaclesChange([]);
        },
        resetRobot: () => {
          setRobotPosition([0, 0]);
        },
        setRobotPosition: (pos) => {
          setRobotPosition(pos);
        },
        getRobotPosition: () => robotPos,
        getObstacles: () => obstacles,
      }),
      [robotPos, obstacles, onObstaclesChange, setRobotPosition]
    );

    // Obtener coordenadas de la grilla en base a la posición del mouse
    const getGridCoords = (e: React.MouseEvent<HTMLCanvasElement>): [number, number] | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      const x = Math.floor((clientX / rect.width) * gridSize);
      const y = Math.floor((clientY / rect.height) * gridSize);

      if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
        return [x, y];
      }
      return null;
    };

    // Manejadores de mouse para pintar/borrar obstáculos
    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (e.button !== 0) return; // Solo clic izquierdo
      const coords = getGridCoords(e);
      if (!coords) return;

      const [x, y] = coords;

      // Impedir pintar obstáculos encima del robot o de la meta
      if ((x === robotPos[0] && y === robotPos[1]) || (x === gridSize - 1 && y === gridSize - 1)) {
        return;
      }

      setIsDrawing(true);
      const exists = obstacles.some(([ox, oy]) => ox === x && oy === y);

      if (exists) {
        setDrawMode('erase');
        const updated: [number, number][] = obstacles.filter(([ox, oy]) => !(ox === x && oy === y));
        if (onObstaclesChange) onObstaclesChange(updated);
      } else {
        setDrawMode('paint');
        const updated: [number, number][] = [...obstacles, [x, y]];
        if (onObstaclesChange) onObstaclesChange(updated);
      }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing || !drawMode) return;
      const coords = getGridCoords(e);
      if (!coords) return;

      const [x, y] = coords;

      // Impedir pintar obstáculos encima del robot o de la meta
      if ((x === robotPos[0] && y === robotPos[1]) || (x === gridSize - 1 && y === gridSize - 1)) {
        return;
      }

      const exists = obstacles.some(([ox, oy]) => ox === x && oy === y);
      if (drawMode === 'paint' && !exists) {
        const updated: [number, number][] = [...obstacles, [x, y]];
        if (onObstaclesChange) onObstaclesChange(updated);
      } else if (drawMode === 'erase' && exists) {
        const updated: [number, number][] = obstacles.filter(([ox, oy]) => !(ox === x && oy === y));
        if (onObstaclesChange) onObstaclesChange(updated);
      }
    };

    const handleMouseUpOrLeave = () => {
      setIsDrawing(false);
      setDrawMode(null);
    };

    return (
      <div className="relative block border-2 border-indigo-500/30 rounded-none overflow-hidden bg-[#090d16] w-full max-w-[400px] aspect-square shadow-[0_0_20px_rgba(99,102,241,0.15)] transition-all duration-300 hover:border-indigo-500/50">
        {/* Detalles de esquinas neón */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-indigo-400"></div>
        <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-indigo-400"></div>
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-indigo-400"></div>
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-indigo-400"></div>

        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          className="block cursor-crosshair touch-none w-full h-full"
        />
      </div>
    );
  }
);

SimulationCanvas.displayName = 'SimulationCanvas';
