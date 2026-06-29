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
  robotPos: [number, number]; // Managed by parent
  obstacles: [number, number][]; // Managed by parent (Single Source of Truth)
  predictedPath?: [number, number][]; // Trazado predictivo
}

const GRID_SIZE = 10;
const CELL_SIZE = 40;
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE; // 400px

export const SimulationCanvas = forwardRef<SimulationCanvasRef, SimulationCanvasProps>(
  ({ onRobotMove, onObstaclesChange, robotPos: externalRobotPos, obstacles = [], predictedPath = [] }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // Internal state for smooth local updates, synced with parent
    const [robotPos, setInternalRobotPos] = useState<[number, number]>(externalRobotPos || [0, 0]);
    const [isDrawing, setIsDrawing] = useState<boolean>(false);
    const [drawMode, setDrawMode] = useState<'paint' | 'erase' | null>(null);

    // Sync external robot position if provided
    useEffect(() => {
      if (externalRobotPos) {
        setInternalRobotPos(externalRobotPos);
      }
    }, [externalRobotPos]);

    const setRobotPosition = useCallback((pos: [number, number]) => {
      setInternalRobotPos(pos);
      if (onRobotMove) onRobotMove(pos);
    }, [onRobotMove]);

    // Draw the grid, robot, goal, and obstacles
    const draw = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Clear background (Cyberpunk dark background)
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      // 2. Draw obstacles (Red neon squares)
      obstacles.forEach(([x, y]) => {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.9)'; // Tailwind red-500
        ctx.fillRect(x * CELL_SIZE + 2, y * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4);
        
        // Obstacle inner border
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(x * CELL_SIZE + 2, y * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4);
      });

      // 3. Draw grid lines (Subtle blue-gray)
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.15)'; // Indigo
      ctx.lineWidth = 1;
      for (let i = 0; i <= GRID_SIZE; i++) {
        // Vertical lines
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, CANVAS_SIZE);
        ctx.stroke();

        // Horizontal lines
        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(CANVAS_SIZE, i * CELL_SIZE);
        ctx.stroke();
      }

      // 4. Draw Goal (Green target at [9, 9])
      const goalX = 9;
      const goalY = 9;
      ctx.fillStyle = 'rgba(16, 185, 129, 0.2)'; // Green transparent fill
      ctx.fillRect(goalX * CELL_SIZE + 2, goalY * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4);
      
      // Goal neon outline
      ctx.strokeStyle = '#10b981'; // Emerald 500
      ctx.lineWidth = 3;
      ctx.strokeRect(goalX * CELL_SIZE + 2, goalY * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4);
      
      // Inner target dot
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(
        goalX * CELL_SIZE + CELL_SIZE / 2,
        goalY * CELL_SIZE + CELL_SIZE / 2,
        6,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // 5. Draw Robot (Blue neon circle/square at robotPos)
      const [rx, ry] = robotPos;
      ctx.fillStyle = 'rgba(59, 130, 246, 0.3)'; // Blue transparent fill
      ctx.fillRect(rx * CELL_SIZE + 2, ry * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4);
      
      ctx.strokeStyle = '#3b82f6'; // Blue 500
      ctx.lineWidth = 3;
      ctx.strokeRect(rx * CELL_SIZE + 2, ry * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4);

      // Inner glowing core
      ctx.fillStyle = '#3b82f6';
      ctx.shadowColor = '#3b82f6';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(
        rx * CELL_SIZE + CELL_SIZE / 2,
        ry * CELL_SIZE + CELL_SIZE / 2,
        8,
        0,
        Math.PI * 2
      );
      ctx.fill();
      
      // Reset shadow for subsequent draws
      ctx.shadowBlur = 0;

      // 6. Draw Predicted Path (Cyan neon dots)
      if (predictedPath && predictedPath.length > 0) {
        ctx.shadowColor = '#06b6d4'; // Cyan 500
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#06b6d4';
        
        predictedPath.forEach(([px, py]) => {
          // Skip drawing if path overlaps with robot or goal to avoid clutter
          if ((px === robotPos[0] && py === robotPos[1]) || (px === 9 && py === 9)) return;
          
          ctx.beginPath();
          ctx.arc(
            px * CELL_SIZE + CELL_SIZE / 2,
            py * CELL_SIZE + CELL_SIZE / 2,
            4,
            0,
            Math.PI * 2
          );
          ctx.fill();
        });
        
        ctx.shadowBlur = 0;
      }
    }, [robotPos, obstacles, predictedPath]);

    // Redraw whenever obstacles, robot position or predicted path changes
    useEffect(() => {
      draw();
    }, [draw, obstacles, robotPos, predictedPath]);

    // Expose functions to parent component
    useImperativeHandle(ref, () => ({
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
    }), [robotPos, obstacles, onObstaclesChange, setRobotPosition]);

    // Helper: Get grid cell from mouse event
    const getGridCoords = (e: React.MouseEvent<HTMLCanvasElement>): [number, number] | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      const x = Math.floor((clientX / rect.width) * GRID_SIZE);
      const y = Math.floor((clientY / rect.height) * GRID_SIZE);

      if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
        return [x, y];
      }
      return null;
    };

    // Mouse handlers for drawing obstacles
    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (e.button !== 0) return; // Only left click
      const coords = getGridCoords(e);
      if (!coords) return;

      const [x, y] = coords;

      // Prevent painting obstacles on robot position or goal position
      if ((x === robotPos[0] && y === robotPos[1]) || (x === 9 && y === 9)) {
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

      // Prevent painting obstacles on robot position or goal position
      if ((x === robotPos[0] && y === robotPos[1]) || (x === 9 && y === 9)) {
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
      <div className="relative inline-block border-2 border-indigo-500/30 rounded-xl overflow-hidden bg-[#090d16] shadow-[0_0_20px_rgba(99,102,241,0.15)] transition-all duration-300 hover:border-indigo-500/50">
        {/* Neon corner accents */}
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
          className="block cursor-crosshair touch-none"
        />
      </div>
    );
  }
);

SimulationCanvas.displayName = 'SimulationCanvas';
