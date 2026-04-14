import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MatrixData } from '@/src/lib/math';

interface MatrixMultiplicationAnimatorProps {
  matrixA: MatrixData;
  matrixB: MatrixData;
  result: MatrixData;
}

export const MatrixMultiplicationAnimator: React.FC<MatrixMultiplicationAnimatorProps> = ({
  matrixA,
  matrixB,
  result
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const dimension = matrixA.length;
  const totalCells = dimension * dimension;

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % totalCells);
    }, 2000);
    return () => clearInterval(interval);
  }, [totalCells]);

  const activeRow = Math.floor(activeIndex / dimension);
  const activeCol = activeIndex % dimension;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-center justify-center gap-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
        {/* Matrix A */}
        <div className="space-y-2">
          <div className="text-[10px] text-slate-400 uppercase font-bold text-center">矩阵 A</div>
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${dimension}, minmax(0, 1fr))` }}>
            {matrixA.flat().map((val, idx) => {
              const r = Math.floor(idx / dimension);
              const isActive = r === activeRow;
              return (
                <motion.div
                  key={`anim-a-${idx}`}
                  animate={{ 
                    backgroundColor: isActive ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 1)',
                    borderColor: isActive ? 'rgba(99, 102, 241, 0.5)' : 'rgba(226, 232, 240, 1)',
                    scale: isActive ? 1.05 : 1
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded border font-mono text-xs"
                >
                  {val.toFixed(1)}
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="text-slate-300 font-bold">×</div>

        {/* Matrix B */}
        <div className="space-y-2">
          <div className="text-[10px] text-slate-400 uppercase font-bold text-center">矩阵 B</div>
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${dimension}, minmax(0, 1fr))` }}>
            {matrixB.flat().map((val, idx) => {
              const c = idx % dimension;
              const isActive = c === activeCol;
              return (
                <motion.div
                  key={`anim-b-${idx}`}
                  animate={{ 
                    backgroundColor: isActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 1)',
                    borderColor: isActive ? 'rgba(16, 185, 129, 0.5)' : 'rgba(226, 232, 240, 1)',
                    scale: isActive ? 1.05 : 1
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded border font-mono text-xs"
                >
                  {val.toFixed(1)}
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="text-slate-300 font-bold">=</div>

        {/* Result Matrix */}
        <div className="space-y-2">
          <div className="text-[10px] text-slate-400 uppercase font-bold text-center">结果矩阵</div>
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${dimension}, minmax(0, 1fr))` }}>
            {result.flat().map((val, idx) => {
              const isActive = idx === activeIndex;
              return (
                <motion.div
                  key={`anim-res-${idx}`}
                  animate={{ 
                    backgroundColor: isActive ? 'rgba(99, 102, 241, 1)' : 'rgba(248, 250, 252, 1)',
                    color: isActive ? 'white' : 'rgba(51, 65, 85, 1)',
                    scale: isActive ? 1.1 : 1,
                    boxShadow: isActive ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none'
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded border font-mono text-xs font-bold transition-shadow"
                >
                  {val.toFixed(1)}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step Explanation */}
      <div className="flex justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={`step-desc-${activeIndex}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-6 py-3 bg-white rounded-full border border-slate-200 shadow-sm flex items-center gap-4 text-xs"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="text-slate-500">第 {activeRow + 1} 行</span>
            </div>
            <div className="text-slate-300">与</div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-slate-500">第 {activeCol + 1} 列</span>
            </div>
            <div className="text-slate-300">的点积结果</div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
