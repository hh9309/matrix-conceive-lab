import React, { useMemo, useId, useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { MatrixData, getEigenvectors, determinant } from '@/src/lib/math';
import { Rotate3d, ZoomIn, ZoomOut, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MatrixCanvasProps {
  matrix: MatrixData;
  showGrid?: boolean;
  showVectors?: boolean;
  showEigenvectors?: boolean;
  showUnitArea?: boolean;
  customVector?: number[];
  gridSize?: number;
  scale?: number;
  progress?: number; // 0 to 1, where 0 is identity and 1 is target matrix
}

export const MatrixCanvas: React.FC<MatrixCanvasProps> = ({
  matrix,
  showGrid = true,
  showVectors = true,
  showEigenvectors = false,
  showUnitArea = false,
  customVector,
  gridSize = 5,
  scale = 40,
  progress = 1,
}) => {
  const baseId = useId();
  const width = 400;
  const height = 400;
  const centerX = width / 2;
  const centerY = height / 2;
  const dimension = matrix.length;

  // Orbit Controls State
  const [rotation, setRotation] = useState({ x: Math.PI / 6, y: Math.PI / 6 });
  const [zoom, setZoom] = useState(scale);
  const [isDragging, setIsDragging] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle mouse events for rotation
  useEffect(() => {
    if (dimension !== 3) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - lastMousePos.current.x;
      const deltaY = e.clientY - lastMousePos.current.y;
      
      setRotation(prev => ({
        x: prev.x + deltaY * 0.01,
        y: prev.y + deltaX * 0.01
      }));
      
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dimension]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (dimension !== 3) return;
    setIsDragging(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (dimension !== 3) return;
    // Prevent default scroll behavior
    if (e.ctrlKey || Math.abs(e.deltaY) > 0) {
      e.preventDefault();
    }
    const delta = e.deltaY * -0.05;
    setZoom(prev => Math.max(10, Math.min(100, prev + delta)));
  };

  const resetView = () => {
    setRotation({ x: Math.PI / 6, y: Math.PI / 6 });
    setZoom(scale);
  };

  // Transform and Project function
  const project = (x: number, y: number, z: number = 0) => {
    let xPrime, yPrime, zPrime;

    // Interpolate between identity and target matrix based on progress
    const getVal = (r: number, c: number) => {
      const target = matrix[r][c];
      const identity = r === c ? 1 : 0;
      const p = isNaN(progress) ? 0 : progress;
      return identity + (target - identity) * p;
    };

    if (dimension === 2) {
      const m00 = getVal(0, 0);
      const m01 = getVal(0, 1);
      const m10 = getVal(1, 0);
      const m11 = getVal(1, 1);
      
      xPrime = m00 * x + m01 * y;
      yPrime = m10 * x + m11 * y;
      zPrime = 0;
    } else {
      const m00 = getVal(0, 0);
      const m01 = getVal(0, 1);
      const m02 = getVal(0, 2);
      const m10 = getVal(1, 0);
      const m11 = getVal(1, 1);
      const m12 = getVal(1, 2);
      const m20 = getVal(2, 0);
      const m21 = getVal(2, 1);
      const m22 = getVal(2, 2);

      xPrime = m00 * x + m01 * y + m02 * z;
      yPrime = m10 * x + m11 * y + m12 * z;
      zPrime = m20 * x + m21 * y + m22 * z;
    }

    if (dimension === 2) {
      return {
        x: centerX + xPrime * scale,
        y: centerY - yPrime * scale,
      };
    } else {
      // Rotate coordinates based on orbit controls
      const cosX = Math.cos(rotation.x);
      const sinX = Math.sin(rotation.x);
      const cosY = Math.cos(rotation.y);
      const sinY = Math.sin(rotation.y);

      // Rotation around Y axis
      const xRotY = xPrime * cosY + zPrime * sinY;
      const zRotY = -xPrime * sinY + zPrime * cosY;

      // Rotation around X axis
      const yRotX = yPrime * cosX - zRotY * sinX;
      const zRotX = yPrime * sinX + zRotY * cosX;

      // Simple orthographic projection
      return {
        x: centerX + xRotY * zoom,
        y: centerY - yRotX * zoom,
      };
    }
  };

  // Generate grid lines
  const gridLines = useMemo(() => {
    const lines = [];
    if (dimension === 2) {
      for (let i = -gridSize; i <= gridSize; i++) {
        lines.push({ x1: -gridSize, y1: i, z1: 0, x2: gridSize, y2: i, z2: 0 });
        lines.push({ x1: i, y1: -gridSize, z1: 0, x2: i, y2: gridSize, z2: 0 });
      }
    } else {
      // 3D Grid (XY, YZ, XZ planes)
      for (let i = -gridSize; i <= gridSize; i++) {
        // XY Plane
        lines.push({ x1: -gridSize, y1: i, z1: 0, x2: gridSize, y2: i, z2: 0 });
        lines.push({ x1: i, y1: -gridSize, z1: 0, x2: i, y2: gridSize, z2: 0 });
        // XZ Plane
        // Skip i=0 for XZ plane horizontal lines to avoid duplicate X-axis (already in XY plane)
        if (i !== 0) {
          lines.push({ x1: -gridSize, y1: 0, z1: i, x2: gridSize, y2: 0, z2: i });
        }
        lines.push({ x1: i, y1: 0, z1: -gridSize, x2: i, y2: 0, z2: gridSize });
      }
    }
    return lines;
  }, [gridSize, dimension]);

  const eigenvectors = useMemo(() => {
    if (!showEigenvectors || dimension !== 2) return [];
    return getEigenvectors(matrix);
  }, [matrix, showEigenvectors, dimension]);

  const currentMatrix = useMemo(() => {
    const p = isNaN(progress) ? 0 : progress;
    return matrix.map((row, r) => 
      row.map((val, c) => {
        const identity = r === c ? 1 : 0;
        return identity + (val - identity) * p;
      })
    );
  }, [matrix, progress]);

  const det = useMemo(() => {
    if (dimension !== 2) return 0;
    return determinant(currentMatrix);
  }, [currentMatrix, dimension]);

  // Helper for static grid projection
  const projectIdentity = (x: number, y: number, z: number) => {
    if (dimension === 2) {
      return { x: centerX + x * scale, y: centerY - y * scale };
    } else {
      const cosX = Math.cos(rotation.x);
      const sinX = Math.sin(rotation.x);
      const cosY = Math.cos(rotation.y);
      const sinY = Math.sin(rotation.y);
      const xRotY = x * cosY + z * sinY;
      const zRotY = -x * sinY + z * cosY;
      const yRotX = y * cosX - zRotY * sinX;
      return { x: centerX + xRotY * zoom, y: centerY - yRotX * zoom };
    }
  };

  const originalUnitAreaPath = useMemo(() => {
    if (!showUnitArea || dimension !== 2) return null;
    const p0 = { x: centerX, y: centerY };
    const p1 = { x: centerX + 1 * scale, y: centerY };
    const p2 = { x: centerX + 1 * scale, y: centerY - 1 * scale };
    const p3 = { x: centerX, y: centerY - 1 * scale };
    return `M ${p0.x} ${p0.y} L ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y} Z`;
  }, [showUnitArea, dimension, scale, centerX, centerY]);

  const unitAreaPath = useMemo(() => {
    if (!showUnitArea || dimension !== 2) return null;
    const p0 = project(0, 0);
    const p1 = project(1, 0);
    const p2 = project(1, 1);
    const p3 = project(0, 1);
    return `M ${p0.x} ${p0.y} L ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y} Z`;
  }, [matrix, showUnitArea, dimension, progress, scale, centerX, centerY]);

  const transformedCenter = useMemo(() => {
    if (!showUnitArea || dimension !== 2) return null;
    const p = project(0.5, 0.5);
    // Clamp to keep label within SVG bounds (400x400)
    const paddingX = 30;
    const paddingY = 15;
    return {
      x: Math.max(paddingX, Math.min(width - paddingX, p.x)),
      y: Math.max(paddingY, Math.min(height - paddingY, p.y))
    };
  }, [matrix, showUnitArea, dimension, width, height, progress]);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full aspect-square bg-slate-50 rounded-xl overflow-hidden border border-slate-200 shadow-inner ${dimension === 3 ? 'cursor-grab active:cursor-grabbing' : ''}`}
      onMouseDown={handleMouseDown}
      onWheel={handleWheel}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        className="select-none"
      >
        {/* Background Grid (Static) */}
        {showGrid && (
          <g opacity="0.3">
            {gridLines.map((line, i) => {
              // Static grid always uses identity
              const start = projectIdentity(line.x1, line.y1, line.z1);
              const end = projectIdentity(line.x2, line.y2, line.z2);
              
              return (
                <line
                  key={`${baseId}-static-${i}`}
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                />
              );
            })}
          </g>
        )}

        {/* Transformed Grid */}
        {showGrid && (
          <g>
            {gridLines.map((line, i) => {
              const start = project(line.x1, line.y1, line.z1);
              const end = project(line.x2, line.y2, line.z2);
              const isAxis = dimension === 2 
                ? (line.x1 === 0 && line.x2 === 0) || (line.y1 === 0 && line.y2 === 0)
                : (line.x1 === 0 && line.x2 === 0 && line.y1 === 0 && line.y2 === 0) || 
                  (line.x1 === 0 && line.x2 === 0 && line.z1 === 0 && line.z2 === 0) ||
                  (line.y1 === 0 && line.y2 === 0 && line.z1 === 0 && line.z2 === 0);

              return (
                <motion.line
                  key={`${baseId}-transformed-${i}`}
                  initial={false}
                  animate={{
                    x1: start.x,
                    y1: start.y,
                    x2: end.x,
                    y2: end.y,
                  }}
                  transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                  stroke={isAxis ? "#6366f1" : "#cbd5e1"}
                  strokeWidth={isAxis ? "2" : "1"}
                  strokeDasharray={isAxis ? "" : "2,2"}
                />
              );
            })}
          </g>
        )}

        {/* Unit Area Visualization */}
        {showUnitArea && originalUnitAreaPath && (
          <path
            d={originalUnitAreaPath}
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="1"
            strokeDasharray="2,2"
          />
        )}
        {showUnitArea && unitAreaPath && (
          <motion.path
            initial={false}
            animate={{ d: unitAreaPath }}
            fill={det < 0 ? "rgba(244, 63, 94, 0.15)" : "rgba(99, 102, 241, 0.15)"}
            stroke={det < 0 ? "#f43f5e" : "#6366f1"}
            strokeWidth="2"
            strokeDasharray="4,4"
          />
        )}

        {/* Eigenvectors */}
        {showEigenvectors && eigenvectors.map((ev, i) => {
          // 1. Draw the invariant line (direction)
          const lineLen = gridSize * 2;
          const lineStart = project(-ev.vector[0] * lineLen, -ev.vector[1] * lineLen);
          const lineEnd = project(ev.vector[0] * lineLen, ev.vector[1] * lineLen);
          
          // 2. Draw the actual transformed eigenvector (Av = λv)
          // We project the unit eigenvector to see its transformed state
          const vecEnd = project(ev.vector[0], ev.vector[1]);

          return (
            <g key={`${baseId}-eigen-group-${i}`}>
              {/* Direction Line (Invariant subspace) */}
              <motion.line
                initial={false}
                animate={{
                  x1: lineStart.x,
                  y1: lineStart.y,
                  x2: lineEnd.x,
                  y2: lineEnd.y,
                }}
                stroke="#a855f7"
                strokeWidth="1"
                strokeDasharray="8,4"
                opacity="0.3"
              />
              
              {/* Magnitude Vector (Transformed Eigenvector) */}
              <motion.line
                initial={false}
                animate={{
                  x2: vecEnd.x,
                  y2: vecEnd.y,
                }}
                x1={centerX}
                y1={centerY}
                stroke="#a855f7"
                strokeWidth="3"
                strokeLinecap="round"
              />
              
              {/* Vector Tip Marker */}
              <motion.circle
                initial={false}
                animate={{ cx: vecEnd.x, cy: vecEnd.y }}
                r="5"
                fill="white"
                stroke="#a855f7"
                strokeWidth="2"
                className="shadow-sm"
              />
              
              {/* Eigenvalue Label */}
              <motion.g
                initial={false}
                animate={{ x: vecEnd.x + 10, y: vecEnd.y - 10 }}
              >
                <rect
                  x="0"
                  y="-12"
                  width="55"
                  height="16"
                  rx="4"
                  fill="rgba(168, 85, 247, 0.1)"
                  className="backdrop-blur-sm"
                />
                <text
                  fill="#a855f7"
                  fontSize="10"
                  fontWeight="bold"
                  className="pointer-events-none font-mono"
                >
                  λ = {ev.value.toFixed(2)}
                </text>
              </motion.g>
            </g>
          );
        })}

        {/* Basis Vectors */}
        {showVectors && (
          <g>
            <BasisVector
              key={`${baseId}-i-hat`}
              matrix={matrix}
              vector={dimension === 2 ? [1, 0] : [1, 0, 0]}
              color="#f43f5e"
              label="î"
              project={project}
              centerX={centerX}
              centerY={centerY}
            />
            <BasisVector
              key={`${baseId}-j-hat`}
              matrix={matrix}
              vector={dimension === 2 ? [0, 1] : [0, 1, 0]}
              color="#10b981"
              label="ĵ"
              project={project}
              centerX={centerX}
              centerY={centerY}
            />
            {dimension === 3 && (
              <BasisVector
                key={`${baseId}-k-hat`}
                matrix={matrix}
                vector={[0, 0, 1]}
                color="#3b82f6"
                label="k̂"
                project={project}
                centerX={centerX}
                centerY={centerY}
              />
            )}
          </g>
        )}

        {/* Custom Vector v and v' */}
        {customVector && (
          <g>
            {/* Original v (dashed) */}
            <BasisVector
              key={`${baseId}-custom-v`}
              matrix={[[1, 0, 0], [0, 1, 0], [0, 0, 1]]}
              vector={customVector}
              color="#94a3b8"
              label="v"
              project={project}
              centerX={centerX}
              centerY={centerY}
              dashed
            />
            {/* Transformed v' */}
            <BasisVector
              key={`${baseId}-custom-v-prime`}
              matrix={matrix}
              vector={customVector}
              color="#6366f1"
              label="v'"
              project={project}
              centerX={centerX}
              centerY={centerY}
            />
          </g>
        )}

        {/* Overlays (Always on top) */}
        {showUnitArea && transformedCenter && (
          <motion.g
            initial={false}
            animate={{ x: transformedCenter.x, y: transformedCenter.y }}
            className="pointer-events-none"
          >
            <rect
              x="-28"
              y="-10"
              width="56"
              height="20"
              rx="6"
              fill="white"
              stroke={det < 0 ? "#f43f5e" : "#6366f1"}
              strokeWidth="1.5"
              className="shadow-lg"
            />
            <text
              textAnchor="middle"
              dominantBaseline="middle"
              fill={det < 0 ? "#f43f5e" : "#6366f1"}
              fontSize="10"
              fontWeight="bold"
              className="font-mono"
            >
              {det < 0 ? "反向面积" : "面积"}:{Math.abs(det).toFixed(2)}
            </text>
          </motion.g>
        )}
      </svg>

      {/* 3D Controls Overlay */}
      {dimension === 3 && (
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="secondary" 
                  size="icon" 
                  className="w-8 h-8 rounded-full bg-white/80 backdrop-blur shadow-sm border-slate-200"
                  onClick={resetView}
                >
                  <RefreshCcw className="w-4 h-4 text-slate-600" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">重置视角</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <div className="flex flex-col bg-white/80 backdrop-blur rounded-full shadow-sm border border-slate-200 p-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="w-6 h-6 rounded-full"
              onClick={() => setZoom(prev => Math.min(100, prev + 5))}
            >
              <ZoomIn className="w-3 h-3 text-slate-600" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="w-6 h-6 rounded-full"
              onClick={() => setZoom(prev => Math.max(10, prev - 5))}
            >
              <ZoomOut className="w-3 h-3 text-slate-600" />
            </Button>
          </div>

          <div className="flex items-center justify-center w-8 h-8 bg-indigo-50 rounded-full border border-indigo-100">
            <Rotate3d className="w-4 h-4 text-indigo-500" />
          </div>
        </div>
      )}

      {/* 3D Instruction */}
      {dimension === 3 && !isDragging && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute bottom-16 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-900/10 backdrop-blur-sm rounded-full text-[10px] text-slate-600 pointer-events-none"
        >
          按住鼠标拖拽旋转 · 滚轮缩放
        </motion.div>
      )}
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-1 text-[10px] font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#f43f5e]" />
          <span>î (基向量 X)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#10b981]" />
          <span>ĵ (基向量 Y)</span>
        </div>
        {dimension === 3 && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#3b82f6]" />
            <span>k̂ (基向量 Z)</span>
          </div>
        )}
        {showEigenvectors && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#a855f7]" />
            <span>特征向量方向</span>
          </div>
        )}
        {showUnitArea && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-indigo-500/20 border border-indigo-500 border-dashed" />
            <span>单位面积变换</span>
          </div>
        )}
      </div>
    </div>
  );
};

const BasisVector: React.FC<{
  matrix: MatrixData;
  vector: number[];
  color: string;
  label: string;
  project: (x: number, y: number, z?: number) => { x: number; y: number };
  centerX: number;
  centerY: number;
  dashed?: boolean;
}> = ({ vector, color, label, project, centerX, centerY, dashed }) => {
  const end = project(vector[0], vector[1], vector[2] || 0);

  return (
    <g>
      <motion.line
        initial={false}
        animate={{ x2: end.x, y2: end.y }}
        x1={centerX}
        y1={centerY}
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={dashed ? "4,4" : ""}
      />
      <motion.circle
        initial={false}
        animate={{ cx: end.x, cy: end.y }}
        r="4"
        fill={color}
      />
      <motion.text
        initial={false}
        animate={{ x: end.x + 5, y: end.y - 5 }}
        fill={color}
        fontSize="12"
        fontWeight="bold"
        className="pointer-events-none"
      >
        {label}
      </motion.text>
    </g>
  );
};
