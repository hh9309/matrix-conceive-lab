import React, { useId, useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MatrixData, identity2D, identity3D } from '@/src/lib/math';
import { RotateCcw, Maximize, Move, Scissors, RefreshCw, Grid2X2, Grid3X3, AlertCircle } from 'lucide-react';

interface MatrixEditorProps {
  matrix: MatrixData;
  onChange: (matrix: MatrixData) => void;
  lockedDimension?: 2 | 3;
}

export const MatrixEditor: React.FC<MatrixEditorProps> = ({ matrix, onChange, lockedDimension }) => {
  const dimension = matrix.length;
  const baseId = useId();
  const [localValues, setLocalValues] = useState<string[][]>(matrix.map(row => row.map(v => v.toString())));
  const [errorCell, setErrorCell] = useState<{row: number, col: number} | null>(null);

  // Sync local values when matrix changes from outside (e.g. presets)
  useEffect(() => {
    setLocalValues(matrix.map(row => row.map(v => v.toString())));
    setErrorCell(null);
  }, [matrix]);

  const handleInputChange = (row: number, col: number, value: string) => {
    // Update local state immediately for smooth typing
    const newLocalValues = localValues.map((r, i) => 
      i === row ? r.map((c, j) => j === col ? value : c) : [...r]
    );
    setLocalValues(newLocalValues);

    // Validate
    if (value === '' || value === '-' || value === '.') {
      // Intermediate state, don't update parent yet but don't show error
      setErrorCell(null);
      return;
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      setErrorCell({ row, col });
    } else {
      setErrorCell(null);
      const newMatrix = matrix.map((r, i) => 
        i === row ? r.map((c, j) => j === col ? numValue : c) : [...r]
      );
      onChange(newMatrix);
    }
  };

  const setDimension = (dim: number) => {
    if (lockedDimension) return;
    if (dim === 2) onChange(identity2D);
    else onChange(identity3D);
  };

  const presets2D = [
    { name: '单位矩阵', icon: RefreshCw, value: identity2D },
    { name: '旋转 90°', icon: RotateCcw, value: [[0, -1], [1, 0]] },
    { name: '缩放 2x', icon: Maximize, value: [[2, 0], [0, 2]] },
    { name: '错切 X', icon: Scissors, value: [[1, 1], [0, 1]] },
    { name: '坍缩 (Det=0)', icon: Move, value: [[1, 1], [1, 1]] },
  ];

  const presets3D = [
    { name: '单位矩阵', icon: RefreshCw, value: identity3D },
    { name: '旋转 Z 90°', icon: RotateCcw, value: [[0, -1, 0], [1, 0, 0], [0, 0, 1]] },
    { name: '缩放 1.5x', icon: Maximize, value: [[1.5, 0, 0], [0, 1.5, 0], [0, 0, 1.5]] },
    { name: '错切 XY', icon: Scissors, value: [[1, 1, 0], [0, 1, 0], [0, 0, 1]] },
  ];

  const presets = dimension === 2 ? presets2D : presets3D;

  return (
    <div className="flex flex-col gap-6 p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
      {!lockedDimension && (
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">矩阵阶数</h3>
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            <Button
              variant={dimension === 2 ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setDimension(2)}
              className="h-8 px-3 gap-2 text-xs"
            >
              <Grid2X2 className="w-3 h-3" />
              2x2
            </Button>
            <Button
              variant={dimension === 3 ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setDimension(3)}
              className="h-8 px-3 gap-2 text-xs"
            >
              <Grid3X3 className="w-3 h-3" />
              3x3
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">矩阵输入</h3>
          {errorCell && (
            <div className="flex items-center gap-1 text-rose-500 text-[10px] font-bold animate-pulse">
              <AlertCircle className="w-3 h-3" />
              请输入有效数字
            </div>
          )}
        </div>
        <div className={`grid gap-3 max-w-[300px]`} style={{ gridTemplateColumns: `repeat(${dimension}, minmax(0, 1fr))` }}>
          {localValues.flat().map((val, idx) => {
            const i = Math.floor(idx / dimension);
            const j = idx % dimension;
            const isError = errorCell?.row === i && errorCell?.col === j;
            return (
              <div key={`${baseId}-cell-${i}-${j}`} className="relative group">
                <Input
                  type="text"
                  value={val}
                  onChange={(e) => handleInputChange(i, j, e.target.value)}
                  className={`bg-slate-50 border-slate-200 text-center font-mono text-sm h-10 focus:ring-indigo-500 text-slate-900 px-1 transition-colors ${
                    isError ? 'border-rose-500 bg-rose-50 ring-1 ring-rose-500' : ''
                  }`}
                />
                <div className="absolute -top-2 -left-2 text-[8px] text-slate-300 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                  a{i+1}{j+1}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">预设变换</h3>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <Button
              key={`${baseId}-preset-${preset.name}`}
              variant="outline"
              size="sm"
              onClick={() => onChange(preset.value as MatrixData)}
              className="bg-white border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 text-xs gap-2 text-slate-600"
            >
              <preset.icon className="w-3 h-3" />
              {preset.name}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
