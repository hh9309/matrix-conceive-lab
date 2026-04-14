import React, { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MatrixCanvas } from './MatrixCanvas';
import { MatrixEditor } from './MatrixEditor';
import { AIInsightPanel } from './AIInsightPanel';
import { MatrixMultiplicationAnimator } from './MatrixMultiplicationAnimator';
import { MatrixData, identity2D, identity3D, multiply, inverse, determinant, getEigenvalues, multiplyVector } from '@/src/lib/math';
import { 
  Box, 
  Layers, 
  Zap, 
  Undo2, 
  Info, 
  ChevronRight,
  Activity,
  Cpu,
  Microscope,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

export const LabLayout: React.FC = () => {
  const [matrixA, setMatrixA] = useState<MatrixData>(identity2D);
  const [matrixB, setMatrixB] = useState<MatrixData>(identity2D);
  const [activeTab, setActiveTab] = useState('transformation');
  const [appSubTab, setAppSubTab] = useState('exp1');

  // Hill Cipher State
  const [hillText, setHillText] = useState('MATRIX');
  const [hillKey, setHillKey] = useState<MatrixData>([[3, 3], [2, 5]]);
  const [isDecrypting, setIsDecrypting] = useState(false);

  const dimension = matrixA.length;
  const [inputVector, setInputVector] = useState<number[]>([1, 0]);
  const [transformationVector, setTransformationVector] = useState<number[]>([1, 1]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showEigenvectors, setShowEigenvectors] = useState(false);
  const [showUnitArea, setShowUnitArea] = useState(false);
  const [animProgress, setAnimProgress] = useState(1);

  // Color Matrix State
  const [colorMatrix, setColorMatrix] = useState<MatrixData>([
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1]
  ]);
  const [baseColor, setBaseColor] = useState({ r: 100, g: 150, b: 250 });

  // Markov Chain State
  const [markovMatrix, setMarkovMatrix] = useState<MatrixData>([
    [0.8, 0.2, 0.1], // P(Sunny|Prev)
    [0.1, 0.7, 0.3], // P(Cloudy|Prev)
    [0.1, 0.1, 0.6]  // P(Rainy|Prev)
  ]);
  const [markovState, setMarkovState] = useState<number[]>([1, 0, 0]); // Initial state: 100% Sunny
  const [markovStep, setMarkovStep] = useState(0);

  // Sync input vector dimension
  if (inputVector.length !== dimension) {
    setInputVector(dimension === 2 ? [1, 0] : [1, 0, 0]);
  }

  if (transformationVector.length !== dimension) {
    setTransformationVector(dimension === 2 ? [1, 1] : [1, 1, 1]);
  }

  const handleMatrixAChange = (m: MatrixData) => {
    setMatrixA(m);
    // Sync dimension of B if A changed dimension
    if (m.length !== matrixB.length) {
      setMatrixB(m.length === 2 ? identity2D : identity3D);
    }
  };

  const handleMatrixBChange = (m: MatrixData) => {
    setMatrixB(m);
    // Sync dimension of A if B changed dimension
    if (m.length !== matrixA.length) {
      setMatrixA(m.length === 2 ? identity2D : identity3D);
    }
  };

  const matrixAB = multiply(matrixA, matrixB);
  const matrixBA = multiply(matrixB, matrixA);
  const invA = inverse(matrixA);
  const detA = determinant(matrixA);
  const eigenvaluesA = getEigenvalues(matrixA);
  const outputVector = multiplyVector(matrixA, inputVector);
  const transformedV = multiplyVector(matrixA, transformationVector);

  // Calculate transformed color
  const transformedColor = useMemo(() => {
    const vec = [baseColor.r, baseColor.g, baseColor.b];
    const result = multiplyVector(colorMatrix, vec);
    return {
      r: Math.max(0, Math.min(255, result[0])),
      g: Math.max(0, Math.min(255, result[1])),
      b: Math.max(0, Math.min(255, result[2]))
    };
  }, [colorMatrix, baseColor]);

  // Markov Chain Logic
  const markovHistory = useMemo(() => {
    let current = [...markovState];
    const history = [current];
    for (let i = 0; i < 10; i++) {
      current = multiplyVector(markovMatrix, current);
      history.push(current);
    }
    return history;
  }, [markovMatrix, markovState]);

  // Hill Cipher Logic
  const hillResult = useMemo(() => {
    const text = hillText.toUpperCase().replace(/[^A-Z]/g, '');
    const key = hillKey as number[][];
    const n = 2; // Fixed 2x2 for simplicity
    
    // Pad text if odd length
    const paddedText = text.length % 2 !== 0 ? text + 'X' : text;
    const pairs: number[][] = [];
    for (let i = 0; i < paddedText.length; i += 2) {
      pairs.push([paddedText.charCodeAt(i) - 65, paddedText.charCodeAt(i + 1) - 65]);
    }

    const process = (matrix: number[][], p: number[]) => {
      const res = [
        (matrix[0][0] * p[0] + matrix[0][1] * p[1]) % 26,
        (matrix[1][0] * p[0] + matrix[1][1] * p[1]) % 26
      ];
      return res.map(v => (v < 0 ? v + 26 : v));
    };

    const encryptedPairs = pairs.map(p => process(key, p));
    const encryptedText = encryptedPairs.flat().map(v => String.fromCharCode(v + 65)).join('');

    // Modular inverse of determinant mod 26
    const det = (key[0][0] * key[1][1] - key[0][1] * key[1][0]) % 26;
    const detNormalized = det < 0 ? det + 26 : det;
    
    let detInv = -1;
    for (let i = 1; i < 26; i++) {
      if ((detNormalized * i) % 26 === 1) {
        detInv = i;
        break;
      }
    }

    let decryptedText = "无法解密 (行列式与26不互质)";
    let invKey: number[][] | null = null;
    if (detInv !== -1) {
      invKey = [
        [(key[1][1] * detInv) % 26, (-key[0][1] * detInv) % 26],
        [(-key[1][0] * detInv) % 26, (key[0][0] * detInv) % 26]
      ].map(row => row.map(v => (v < 0 ? v + 26 : v)));
      
      const decryptedPairs = encryptedPairs.map(p => process(invKey!, p));
      decryptedText = decryptedPairs.flat().map(v => String.fromCharCode(v + 65)).join('');
    }

    return { encryptedText, decryptedText, isValid: detInv !== -1, invKey };
  }, [hillText, hillKey]);

  const handleSimulate = () => {
    setIsSimulating(true);
    setTimeout(() => setIsSimulating(false), 1000);
  };

  const handleUndo = () => {
    if (invA) {
      setMatrixA(invA);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#a855f7', '#ec4899']
      });
    }
  };

  const applyPreset = (type: string) => {
    if (dimension === 2) {
      switch (type) {
        case 'identity': setMatrixA([[1, 0], [0, 1]]); break;
        case 'rotate': setMatrixA([[0.866, -0.5], [0.5, 0.866]]); break; // 30 deg
        case 'scale': setMatrixA([[1.5, 0], [0, 1.5]]); break;
        case 'shear': setMatrixA([[1, 1], [0, 1]]); break;
        case 'reflect': setMatrixA([[1, 0], [0, -1]]); break;
      }
    } else {
      switch (type) {
        case 'identity': setMatrixA([[1, 0, 0], [0, 1, 0], [0, 0, 1]]); break;
        case 'rotate': setMatrixA([[0.866, -0.5, 0], [0.5, 0.866, 0], [0, 0, 1]]); break;
        case 'scale': setMatrixA([[1.5, 0, 0], [0, 1.5, 0], [0, 0, 1.5]]); break;
        case 'shear': setMatrixA([[1, 0.5, 0], [0, 1, 0], [0, 0, 1]]); break;
        case 'reflect': setMatrixA([[1, 0, 0], [0, 1, 0], [0, 0, -1]]); break;
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Box className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">
                矩阵认知实验室
              </h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">
                Matrix Perception Lab • {dimension}x{dimension} 空间引擎
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <TabsList className="bg-slate-100 border border-slate-200 p-1 h-auto flex-wrap justify-start">
              <TabsTrigger value="transformation" className="gap-2 px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm">
                <Zap className="w-4 h-4" />
                空间变换
              </TabsTrigger>
              <TabsTrigger value="composition" className="gap-2 px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm">
                <Layers className="w-4 h-4" />
                复合动作
              </TabsTrigger>
              <TabsTrigger value="operations" className="gap-2 px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm">
                <Activity className="w-4 h-4" />
                矩阵运算
              </TabsTrigger>
              <TabsTrigger value="application" className="gap-2 px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm">
                <Microscope className="w-4 h-4" />
                应用实验
              </TabsTrigger>
              <TabsTrigger value="knowledge" className="gap-2 px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm">
                <Info className="w-4 h-4" />
                矩阵知识
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleUndo}
                disabled={!invA}
                className="bg-white border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 gap-2 shadow-sm"
              >
                <Undo2 className="w-4 h-4" />
                时空倒流 (逆矩阵)
              </Button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <TabsContent key="tab-transformation" value="transformation" className="m-0">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
              >
                <div className="lg:col-span-4 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">预设变换</h4>
                      <div className="flex gap-1">
                        {[
                          { id: 'identity', label: '恒等', icon: Box },
                          { id: 'rotate', label: '旋转', icon: Activity },
                          { id: 'scale', label: '缩放', icon: Zap },
                          { id: 'shear', label: '切变', icon: Layers },
                          { id: 'reflect', label: '镜像', icon: Undo2 }
                        ].map(p => (
                          <Button 
                            key={p.id}
                            variant="ghost" 
                            size="icon" 
                            className="w-8 h-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                            onClick={() => applyPreset(p.id)}
                            title={p.label}
                          >
                            <p.icon className="w-4 h-4" />
                          </Button>
                        ))}
                      </div>
                    </div>
                    <MatrixEditor key="editor-a-main" matrix={matrixA} onChange={handleMatrixAChange} />
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">输入向量 v</h4>
                    <div className="flex gap-2">
                      {transformationVector.map((val, i) => (
                        <Input 
                          key={`v-coord-${i}`}
                          type="number"
                          step="0.1"
                          value={val}
                          onChange={(e) => {
                            const newV = [...transformationVector];
                            newV[i] = parseFloat(e.target.value) || 0;
                            setTransformationVector(newV);
                          }}
                          className="text-center font-mono text-sm h-10 bg-white border-slate-200"
                        />
                      ))}
                    </div>
                  </div>

                  <AIInsightPanel key="insight-a-main" matrix={matrixA} context={`General ${dimension}D spatial transformation`} />
                  
                  <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 space-y-3">
                    <h4 className="text-xs font-bold text-indigo-600 uppercase flex items-center gap-2">
                      <Info className="w-3 h-3" />
                      数学笔记
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      矩阵的每一列代表了基向量变换后的位置。{dimension === 2 ? '第一列是 î 的新坐标，第二列是 ĵ 的新坐标。' : '第一列是 î，第二列是 ĵ，第三列是 k̂ 的新坐标。'}
                    </p>
                  </div>
                </div>

                <div className="lg:col-span-8">
                  <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col items-center gap-6 shadow-sm">
                    <div className="w-full max-w-[500px]">
                      <MatrixCanvas 
                        key="canvas-a-main" 
                        matrix={matrixA} 
                        showEigenvectors={showEigenvectors}
                        showUnitArea={showUnitArea}
                        customVector={transformationVector}
                        progress={animProgress}
                      />
                    </div>
                    
                    <div className="w-full space-y-6 p-6 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                            <Activity className="w-3 h-3" />
                            变换进度 (Animation Progress)
                          </label>
                          <span className="text-xs font-mono text-indigo-600 font-bold">{(animProgress * 100).toFixed(0)}%</span>
                        </div>
                        <Slider 
                          value={[animProgress * 100]} 
                          onValueChange={(val) => {
                            if (Array.isArray(val) && val.length > 0) {
                              setAnimProgress(val[0] / 100);
                            } else if (typeof val === 'number') {
                              setAnimProgress(val / 100);
                            }
                          }}
                          min={0}
                          max={100}
                          step={1}
                        />
                        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                          <span>恒等 (Identity)</span>
                          <span>目标变换 (Target)</span>
                        </div>
                      </div>

                      <div className="h-px bg-slate-200" />

                      <div className="flex flex-wrap justify-center gap-8">
                        <div className="flex items-center gap-3">
                          <Switch 
                            id="show-eigen" 
                            checked={showEigenvectors} 
                            onCheckedChange={setShowEigenvectors} 
                          />
                          <label htmlFor="show-eigen" className="text-[11px] font-bold text-slate-600 cursor-pointer uppercase tracking-wider">显示特征向量方向</label>
                        </div>
                        <div className="flex items-center gap-3">
                          <Switch 
                            id="show-area" 
                            checked={showUnitArea} 
                            onCheckedChange={setShowUnitArea} 
                          />
                          <label htmlFor="show-area" className="text-[11px] font-bold text-slate-600 cursor-pointer uppercase tracking-wider">显示单位面积变换</label>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm font-mono">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">输入向量 v</span>
                        <div className="px-3 py-1 rounded bg-slate-100 border border-slate-200 text-slate-500 font-bold">
                          [{transformationVector.map(v => v.toFixed(1)).join(', ')}]
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">变换矩阵 A</span>
                        <div className="px-3 py-1 rounded bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold">
                          Matrix A
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] text-indigo-400 uppercase font-bold">输出向量 v'</span>
                        <div className="px-3 py-1 rounded bg-indigo-600 text-white font-bold shadow-md shadow-indigo-200">
                          [{transformedV.map(v => v.toFixed(2)).join(', ')}]
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent key="tab-composition" value="composition" className="m-0">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">矩阵 A (外层动作)</h3>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-center">
                      <MatrixEditor key="editor-a-comp" matrix={matrixA} onChange={handleMatrixAChange} />
                      <div className="aspect-square max-w-[200px] mx-auto">
                        <MatrixCanvas key="canvas-a-comp" matrix={matrixA} />
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">矩阵 B (内层动作)</h3>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-center">
                      <MatrixEditor key="editor-b-comp" matrix={matrixB} onChange={handleMatrixBChange} />
                      <div className="aspect-square max-w-[200px] mx-auto">
                        <MatrixCanvas key="canvas-b-comp" matrix={matrixB} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-indigo-600">动作 AB (先 B 后 A)</h4>
                        <p className="text-[10px] text-slate-400">复合变换结果矩阵</p>
                      </div>
                      <div className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">
                        Det(AB): {determinant(matrixAB).toFixed(2)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-center">
                      <div className="space-y-4">
                        <MatrixCanvas key="canvas-ab-comp" matrix={matrixAB} />
                        <p className="text-[10px] text-slate-500 italic text-center">
                          空间先执行 B 变换，再执行 A 变换。
                        </p>
                      </div>
                      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${dimension}, minmax(0, 1fr))` }}>
                        {matrixAB.flat().map((val, idx) => (
                          <div key={`comp-ab-${idx}`} className="p-3 bg-indigo-50/50 rounded border border-indigo-100 text-center font-mono text-sm text-indigo-700">
                            {val.toFixed(2)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-purple-600">动作 BA (先 A 后 B)</h4>
                        <p className="text-[10px] text-slate-400">复合变换结果矩阵</p>
                      </div>
                      <div className="text-xs font-mono text-purple-600 bg-purple-50 px-2 py-1 rounded border border-purple-100">
                        Det(BA): {determinant(matrixBA).toFixed(2)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-center">
                      <div className="space-y-4">
                        <MatrixCanvas key="canvas-ba-comp" matrix={matrixBA} />
                        <p className="text-[10px] text-slate-500 italic text-center">
                          空间先执行 A 变换，再执行 B 变换。
                        </p>
                      </div>
                      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${dimension}, minmax(0, 1fr))` }}>
                        {matrixBA.flat().map((val, idx) => (
                          <div key={`comp-ba-${idx}`} className="p-3 bg-purple-50/50 rounded border border-purple-100 text-center font-mono text-sm text-purple-700">
                            {val.toFixed(2)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-amber-50 border border-amber-100">
                  <h4 className="text-sm font-bold text-amber-600 mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    非交换性直观发现
                  </h4>
                  <p className="text-sm text-slate-600">
                    观察上方两个画布。即使是同样的两个矩阵，执行顺序的不同会导致完全不同的最终空间状态。这就是为什么在矩阵代数中 $AB \neq BA$。
                  </p>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent key="tab-operations" value="operations" className="m-0">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
              >
                <div className="lg:col-span-4 space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">矩阵 A</h4>
                    <MatrixEditor key="editor-a-op" matrix={matrixA} onChange={handleMatrixAChange} />
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">矩阵 B</h4>
                    <MatrixEditor key="editor-b-op" matrix={matrixB} onChange={handleMatrixBChange} />
                  </div>
                  <Card className="bg-white border-slate-200 shadow-sm">
                    <CardHeader className="py-3 border-b border-slate-100">
                      <CardTitle className="text-sm font-bold text-slate-600">矩阵 A 属性</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                      <div className="space-y-2">
                        <div className="text-[10px] text-slate-400 uppercase font-bold">行列式 (Det A)</div>
                        <div className="text-xl font-mono text-indigo-600">{detA.toFixed(4)}</div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-[10px] text-slate-400 uppercase font-bold">特征值 (Eigenvalues A)</div>
                        <div className="flex flex-wrap gap-2">
                          {eigenvaluesA.map((v, i) => (
                            <span key={`eig-op-${i}`} className="px-2 py-1 bg-slate-100 rounded text-xs font-mono">λ{i+1}: {v.toFixed(2)}</span>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div className="lg:col-span-8 space-y-6">
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-slate-700">矩阵乘法动态演示 (A × B)</h4>
                        <p className="text-[10px] text-slate-400">展示行与列的点积计算过程</p>
                      </div>
                      <div className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">
                        Det(AB): {determinant(matrixAB).toFixed(4)}
                      </div>
                    </div>
                    
                    <MatrixMultiplicationAnimator 
                      matrixA={matrixA}
                      matrixB={matrixB}
                      result={matrixAB}
                    />
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-slate-700">矩阵乘法动态演示 (B × A)</h4>
                        <p className="text-[10px] text-slate-400">展示行与列的点积计算过程</p>
                      </div>
                      <div className="text-xs font-mono text-purple-600 bg-purple-50 px-2 py-1 rounded border border-purple-100">
                        Det(BA): {determinant(matrixBA).toFixed(4)}
                      </div>
                    </div>
                    
                    <MatrixMultiplicationAnimator 
                      matrixA={matrixB}
                      matrixB={matrixA}
                      result={matrixBA}
                    />
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <h4 className="text-sm font-bold text-slate-700 mb-4">矩阵 A 的逆矩阵 (Inverse of A)</h4>
                    {invA ? (
                      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${dimension}, minmax(0, 1fr))` }}>
                        {invA.flat().map((val, idx) => (
                          <div key={`inv-cell-${idx}`} className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-center font-mono text-lg text-indigo-600">
                            {val.toFixed(3)}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-rose-500 bg-rose-50 rounded-xl border border-rose-100">
                        矩阵 A 不可逆 (行列式为 0)
                      </div>
                    )}
                  </div>

                  {/* Forward Propagation Simulation */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-slate-700">前向传播模拟 (Forward Propagation)</h4>
                        <p className="text-[10px] text-slate-400">模拟神经网络中的线性变换层</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button 
                          size="sm" 
                          onClick={handleSimulate}
                          disabled={isSimulating}
                          className="h-8 text-[10px] font-bold uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 shadow-sm gap-2"
                        >
                          <Zap className={`w-3 h-3 ${isSimulating ? 'animate-pulse' : ''}`} />
                          {isSimulating ? '计算中...' : '运行模拟'}
                        </Button>
                        <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-full border border-amber-100">
                           <Zap className="w-3 h-3 text-amber-500" />
                           <span className="text-[10px] font-bold text-amber-600 uppercase">y = Ax</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center relative">
                      {isSimulating && (
                        <motion.div 
                          initial={{ left: '25%', opacity: 0 }}
                          animate={{ left: '75%', opacity: 1 }}
                          transition={{ duration: 0.8, ease: "easeInOut" }}
                          className="absolute top-1/2 -translate-y-1/2 z-10"
                        >
                          <div className="w-4 h-4 rounded-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
                        </motion.div>
                      )}
                      
                      {/* Input Vector x */}
                      <div className="md:col-span-3 space-y-3">
                        <div className="text-[10px] text-slate-400 uppercase font-bold text-center">输入向量 x</div>
                        <div className="flex flex-col gap-2">
                          {inputVector.map((val, i) => (
                            <Input
                              key={`input-v-${i}`}
                              type="number"
                              step="0.1"
                              value={val}
                              onChange={(e) => {
                                const newVec = [...inputVector];
                                newVec[i] = parseFloat(e.target.value) || 0;
                                setInputVector(newVec);
                              }}
                              className="text-center font-mono text-sm h-10 bg-slate-50 border-slate-200 focus:ring-amber-500"
                            />
                          ))}
                        </div>
                      </div>

                      <div className="md:col-span-1 flex justify-center">
                        <ArrowRight className="w-5 h-5 text-slate-300" />
                      </div>

                      {/* Matrix A (Visual) */}
                      <div className="md:col-span-3">
                         <div className="text-[10px] text-slate-400 uppercase font-bold text-center mb-3">权重矩阵 A</div>
                         <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 grid gap-2" style={{ gridTemplateColumns: `repeat(${dimension}, minmax(0, 1fr))` }}>
                            {matrixA.flat().map((val, idx) => (
                              <div key={`a-viz-${idx}`} className="text-xs font-mono text-center text-slate-500 py-1 bg-white rounded border border-slate-100 shadow-sm">
                                {val.toFixed(1)}
                              </div>
                            ))}
                         </div>
                      </div>

                      <div className="md:col-span-1 flex justify-center">
                        <div className="text-xl font-bold text-slate-300">=</div>
                      </div>

                      {/* Output Vector y */}
                      <div className="md:col-span-4 space-y-3">
                        <div className="text-[10px] text-indigo-400 uppercase font-bold text-center">输出向量 y</div>
                        <div className="flex flex-col gap-2">
                          {outputVector.map((val, i) => (
                            <motion.div 
                              key={`output-v-${i}`}
                              animate={isSimulating ? { 
                                scale: [1, 1.05, 1],
                                backgroundColor: ['#f5f3ff', '#e0e7ff', '#f5f3ff']
                              } : {}}
                              transition={{ duration: 0.5, delay: i * 0.1 }}
                              className="p-2.5 bg-indigo-50 rounded-lg border border-indigo-100 text-center font-mono text-sm text-indigo-600 font-bold shadow-sm"
                            >
                              {val.toFixed(3)}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-4">
                       <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                         <Cpu className="w-4 h-4 text-indigo-500" />
                       </div>
                       <div className="space-y-1">
                         <h5 className="text-xs font-bold text-slate-700">深度学习视角</h5>
                         <p className="text-[11px] text-slate-500 leading-relaxed">
                           在神经网络中，前向传播本质上是高维空间的线性变换。矩阵 A 的每一行代表一个神经元的权重，它决定了输入特征如何被组合成输出。
                         </p>
                       </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent key="tab-knowledge" value="knowledge" className="m-0">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-base text-indigo-600 flex items-center gap-2">
                      <Box className="w-4 h-4" />
                      起源与定义
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-slate-600 leading-relaxed space-y-3">
                    <p>“矩阵”一词由詹姆斯·西尔维斯特于1850年提出，意为“母体”。它不仅是数字的阵列，更是线性映射的代数表现。</p>
                    <p>在<b>代数几何</b>中，矩阵用于描述变体间的线性关系；在<b>图论</b>中，邻接矩阵完美刻画了节点间的连接拓扑，是复杂网络分析的基石。</p>
                  </CardContent>
                </Card>

                <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-base text-purple-600 flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      几何变换
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-slate-600 leading-relaxed space-y-3">
                    <p>矩阵是空间的“操纵者”。每一个非奇异矩阵都对应着空间的一种线性变换：旋转、缩放、切变或镜像。</p>
                    <p>通过矩阵乘法，我们可以将多个简单的变换复合在一起，形成复杂的运动轨迹，这是计算机图形学（CGI）的底层逻辑。</p>
                  </CardContent>
                </Card>

                <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-base text-amber-600 flex items-center gap-2">
                      <Layers className="w-4 h-4" />
                      矩阵分解
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-slate-600 leading-relaxed space-y-3">
                    <p><b>SVD (奇异值分解)：</b> 被誉为线性代数的“珠宝”，它能将任何矩阵分解为旋转与缩放的组合，是数据降维（PCA）的核心。</p>
                    <p><b>LU/QR 分解：</b> 这些算法将复杂矩阵拆解为易于求解的三角矩阵，是现代工程计算中求解线性方程组的标配。</p>
                  </CardContent>
                </Card>

                <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-base text-rose-600 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      图论与网络
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-slate-600 leading-relaxed space-y-3">
                    <p>社交网络、电力网、大脑神经元——这些复杂系统都可以用矩阵来表达。<b>拉普拉斯矩阵</b>的特征值揭示了网络的连通性与社群结构。</p>
                    <p>Google 的 PageRank 算法本质上是在一个巨大的链接矩阵中寻找主特征向量，从而决定网页的权重。</p>
                  </CardContent>
                </Card>

                <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-base text-blue-600 flex items-center gap-2">
                      <Cpu className="w-4 h-4" />
                      历史发展
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-slate-600 leading-relaxed space-y-3">
                    <p><b>19世纪：</b> 凯莱（Cayley）系统地创立了矩阵理论，定义了加法、乘法和逆矩阵。</p>
                    <p><b>20世纪：</b> 随着计算机的诞生，矩阵运算成为数值分析的核心，推动了量子力学和计算机图形学的发展。</p>
                  </CardContent>
                </Card>

                <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-base text-emerald-600 flex items-center gap-2">
                      <Microscope className="w-4 h-4" />
                      现代应用
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-slate-600 leading-relaxed space-y-3">
                    <p><b>人工智能：</b> 深度学习的本质就是大规模的矩阵乘法运算。Transformer 架构中的注意力机制完全依赖矩阵点积。</p>
                    <p><b>量子计算：</b> 量子态由向量表示，而量子门则是作用于这些向量上的酉矩阵（Unitary Matrices）。</p>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent key="tab-application" value="application" className="m-0">
              <div className="space-y-6">
                <div className="flex gap-4 border-b border-slate-200 pb-4">
                  <button 
                    onClick={() => setAppSubTab('exp1')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${appSubTab === 'exp1' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                  >
                    应用实验 1：色彩空间变换
                  </button>
                  <button 
                    onClick={() => setAppSubTab('exp2')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${appSubTab === 'exp2' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                  >
                    应用实验 2：马尔可夫链预测
                  </button>
                  <button 
                    onClick={() => setAppSubTab('exp3')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${appSubTab === 'exp3' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                  >
                    应用实验 3：希尔密码加密
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {appSubTab === 'exp1' ? (
                    <motion.div 
                      key="exp1"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="grid grid-cols-1 lg:grid-cols-12 gap-8"
                    >
                      <div className="lg:col-span-4 space-y-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">颜色变换矩阵 (3x3)</h4>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setColorMatrix([[1,0,0],[0,1,0],[0,0,1]])}
                              className="h-6 text-[10px] text-indigo-600"
                            >
                              重置恒等
                            </Button>
                          </div>
                          <MatrixEditor key="editor-color" matrix={colorMatrix} onChange={setColorMatrix} lockedDimension={3} />
                        </div>

                        <Card className="bg-white border-slate-200 shadow-sm">
                          <CardHeader className="py-3 border-b border-slate-100">
                            <CardTitle className="text-sm font-bold text-slate-600">输入颜色 (RGB)</CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 space-y-4">
                            {['r', 'g', 'b'].map((channel) => (
                              <div key={channel} className="space-y-2">
                                <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400">
                                  <span>{channel.toUpperCase()}</span>
                                  <span>{(baseColor as any)[channel]}</span>
                                </div>
                                <input 
                                  type="range" 
                                  min="0" 
                                  max="255" 
                                  value={(baseColor as any)[channel]} 
                                  onChange={(e) => setBaseColor({...baseColor, [channel]: parseInt(e.target.value)})}
                                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      </div>

                      <div className="lg:col-span-8 space-y-6">
                        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                          <div className="flex items-center justify-between mb-8">
                            <div className="space-y-1">
                              <h4 className="text-lg font-bold text-slate-700">色彩空间变换实验</h4>
                              <p className="text-xs text-slate-400">通过 3x3 矩阵对 RGB 向量进行线性变换</p>
                            </div>
                            <div className="px-3 py-1 bg-indigo-50 rounded-full border border-indigo-100 text-[10px] font-bold text-indigo-600 uppercase">
                              C' = M × C
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                            <div className="space-y-6">
                              <div className="space-y-3">
                                <div className="text-[10px] text-slate-400 uppercase font-bold text-center">原始颜色</div>
                                <div 
                                  className="w-full aspect-video rounded-2xl shadow-lg border-4 border-white"
                                  style={{ backgroundColor: `rgb(${baseColor.r}, ${baseColor.g}, ${baseColor.b})` }}
                                />
                                <div className="text-center font-mono text-xs text-slate-500">
                                  RGB({baseColor.r}, {baseColor.g}, {baseColor.b})
                                </div>
                              </div>

                              <div className="flex justify-center">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                                  <ChevronRight className="w-6 h-6 text-slate-400" />
                                </div>
                              </div>

                              <div className="space-y-3">
                                <div className="text-[10px] text-indigo-400 uppercase font-bold text-center">变换后颜色</div>
                                <motion.div 
                                  animate={{ backgroundColor: `rgb(${transformedColor.r}, ${transformedColor.g}, ${transformedColor.b})` }}
                                  className="w-full aspect-video rounded-2xl shadow-lg border-4 border-white"
                                />
                                <div className="text-center font-mono text-xs text-indigo-600 font-bold">
                                  RGB({transformedColor.r}, {transformedColor.g}, {transformedColor.b})
                                </div>
                              </div>
                            </div>

                            <div className="space-y-6">
                              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                                <h5 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                  <Zap className="w-4 h-4 text-amber-500" />
                                  实验指南
                                </h5>
                                <ul className="space-y-3 text-xs text-slate-500 leading-relaxed">
                                  <li className="flex gap-2">
                                    <span className="text-indigo-500 font-bold">•</span>
                                    <span><b>灰度化：</b> 尝试将矩阵每一行设为 [0.3, 0.59, 0.11]</span>
                                  </li>
                                  <li className="flex gap-2">
                                    <span className="text-indigo-500 font-bold">•</span>
                                    <span><b>反色：</b> 线性变换难以直接实现反色（需要平移），但你可以尝试交换通道。</span>
                                  </li>
                                  <li className="flex gap-2">
                                    <span className="text-indigo-500 font-bold">•</span>
                                    <span><b>通道增强：</b> 增大对角线上的数值（如 1.5）来增强特定色彩。</span>
                                  </li>
                                </ul>
                              </div>

                              <div className="p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-2">
                                <h5 className="text-xs font-bold text-indigo-700">数学原理</h5>
                                <p className="text-[11px] text-indigo-600/80 leading-relaxed">
                                  颜色在计算机中被视为三维向量。矩阵变换可以改变颜色的饱和度、色调和亮度。这是 Photoshop 滤镜和电影调色的数学基础。
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : appSubTab === 'exp2' ? (
                    <motion.div 
                      key="exp2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-8"
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-4 space-y-6">
                          <div className="space-y-4">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">状态转移矩阵 (3x3)</h4>
                            <MatrixEditor 
                              key="editor-markov" 
                              matrix={markovMatrix} 
                              onChange={(m) => {
                                // Ensure columns sum to 1 for a stochastic matrix
                                setMarkovMatrix(m);
                              }} 
                              lockedDimension={3}
                            />
                            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 text-[10px] text-amber-700 leading-relaxed">
                              <b>注意：</b> 这是一个随机矩阵。每一列代表从当前状态转移到其他状态的概率，列之和应为 1。
                            </div>
                          </div>

                          <Card className="bg-white border-slate-200 shadow-sm">
                            <CardHeader className="py-3 border-b border-slate-100">
                              <CardTitle className="text-sm font-bold text-slate-600">初始状态分布</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                              {['晴天', '阴天', '雨天'].map((label, i) => (
                                <div key={label} className="space-y-2">
                                  <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400">
                                    <span>{label}</span>
                                    <span>{(markovState[i] * 100).toFixed(0)}%</span>
                                  </div>
                                  <input 
                                    type="range" 
                                    min="0" 
                                    max="100" 
                                    value={markovState[i] * 100} 
                                    onChange={(e) => {
                                      const newVal = parseInt(e.target.value) / 100;
                                      const newState = [...markovState];
                                      newState[i] = newVal;
                                      // Normalize others
                                      const sum = newState.reduce((a, b) => a + b, 0);
                                      setMarkovState(newState.map(v => v / sum));
                                    }}
                                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                  />
                                </div>
                              ))}
                            </CardContent>
                          </Card>
                        </div>

                        <div className="lg:col-span-8 space-y-6">
                          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                              <div className="space-y-1">
                                <h4 className="text-lg font-bold text-slate-700">天气/市场状态演变模拟</h4>
                                <p className="text-xs text-slate-400">通过马尔可夫链预测未来的概率分布</p>
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => setMarkovStep(Math.max(0, markovStep - 1))}
                                  className="h-8 w-8 p-0"
                                >
                                  <Undo2 className="w-4 h-4" />
                                </Button>
                                <div className="px-4 py-1 bg-indigo-600 rounded-lg text-white text-xs font-bold flex items-center">
                                  第 {markovStep} 步
                                </div>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => setMarkovStep(Math.min(10, markovStep + 1))}
                                  className="h-8 w-8 p-0"
                                >
                                  <ChevronRight className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>

                            <div className="space-y-10">
                              <div className="grid grid-cols-3 gap-4">
                                {[
                                  { name: '晴天 (Sunny)', color: 'bg-amber-400', icon: '☀️' },
                                  { name: '阴天 (Cloudy)', color: 'bg-slate-400', icon: '☁️' },
                                  { name: '雨天 (Rainy)', color: 'bg-blue-500', icon: '🌧️' }
                                ].map((state, i) => (
                                  <div key={state.name} className="space-y-3">
                                    <div className="flex flex-col items-center gap-2">
                                      <span className="text-2xl">{state.icon}</span>
                                      <span className="text-[10px] font-bold text-slate-500 uppercase">{state.name}</span>
                                    </div>
                                    <div className="relative h-32 w-full bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
                                      <motion.div 
                                        initial={false}
                                        animate={{ height: `${markovHistory[markovStep][i] * 100}%` }}
                                        className={`absolute bottom-0 w-full ${state.color} opacity-80`}
                                      />
                                      <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-700">
                                        {(markovHistory[markovStep][i] * 100).toFixed(1)}%
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <div className="p-6 bg-slate-900 rounded-2xl text-white space-y-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">数学洞察：稳态分布</span>
                                </div>
                                <p className="text-sm text-slate-300 leading-relaxed">
                                  随着迭代步数的增加，你会发现概率分布逐渐趋于稳定。这个最终的分布被称为<b>稳态分布 (Steady-state Distribution)</b>。在数学上，它对应于转移矩阵特征值为 1 的特征向量。
                                </p>
                                <div className="grid grid-cols-3 gap-4 pt-2">
                                  <div className="text-center">
                                    <div className="text-[10px] text-slate-500 uppercase">当前熵</div>
                                    <div className="text-lg font-mono">{(1 - Math.max(...markovHistory[markovStep])).toFixed(3)}</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-[10px] text-slate-500 uppercase">收敛速度</div>
                                    <div className="text-lg font-mono">中等</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-[10px] text-slate-500 uppercase">主特征值</div>
                                    <div className="text-lg font-mono">λ=1</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="exp3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="grid grid-cols-1 lg:grid-cols-12 gap-8"
                    >
                      <div className="lg:col-span-4 space-y-6">
                        <div className="space-y-4">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">加密密钥矩阵 (2x2)</h4>
                          <MatrixEditor key="editor-hill" matrix={hillKey} onChange={setHillKey} lockedDimension={2} />
                          <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100 text-[10px] text-indigo-600 leading-relaxed">
                            <b>提示：</b> 希尔密码要求矩阵在模 26 下可逆。如果无法解密，请尝试更换矩阵数值。
                          </div>
                        </div>

                        <Card className="bg-white border-slate-200 shadow-sm">
                          <CardHeader className="py-3 border-b border-slate-100">
                            <CardTitle className="text-sm font-bold text-slate-600">输入明文</CardTitle>
                          </CardHeader>
                          <CardContent className="p-4">
                            <Input 
                              value={hillText}
                              onChange={(e) => setHillText(e.target.value.toUpperCase())}
                              placeholder="输入英文字母..."
                              className="font-mono text-sm uppercase"
                            />
                            <p className="mt-2 text-[10px] text-slate-400 italic">仅支持 A-Z 字母，奇数长度将自动补 X。</p>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="lg:col-span-8 space-y-6">
                        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                          <div className="flex items-center justify-between mb-10">
                            <div className="space-y-1">
                              <h4 className="text-lg font-bold text-slate-700">希尔密码 (Hill Cipher) 实验</h4>
                              <p className="text-xs text-slate-400">利用矩阵乘法对文本进行多字母替换加密</p>
                            </div>
                            <div className="px-3 py-1 bg-purple-50 rounded-full border border-purple-100 text-[10px] font-bold text-purple-600 uppercase">
                              C = K × P (mod 26)
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                                <div className="text-[10px] text-slate-400 uppercase font-bold">加密过程 (Encryption)</div>
                                <div className="flex items-center justify-between">
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-slate-700">{hillText || '...'}</div>
                                    <div className="text-[10px] text-slate-400">明文 (P)</div>
                                  </div>
                                  <ArrowRight className="w-5 h-5 text-slate-300" />
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-indigo-600">{hillResult.encryptedText}</div>
                                    <div className="text-[10px] text-indigo-400">密文 (C)</div>
                                  </div>
                                </div>
                              </div>

                              <div className="p-6 bg-indigo-600 rounded-2xl text-white space-y-4 shadow-lg shadow-indigo-200">
                                <div className="flex items-center justify-between">
                                  <div className="text-[10px] text-indigo-200 uppercase font-bold">解密还原 (Restoration)</div>
                                  <div className={`text-[10px] px-2 py-0.5 rounded ${hillResult.isValid ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                                    {hillResult.isValid ? '密钥有效' : '密钥无效'}
                                  </div>
                                </div>
                                
                                <div className="flex items-center justify-around py-2">
                                  <div className="text-center">
                                    <div className="text-xl font-bold text-indigo-100">{hillResult.encryptedText}</div>
                                    <div className="text-[9px] text-indigo-300">密文 (C)</div>
                                  </div>
                                  <div className="flex flex-col items-center gap-1">
                                    <ArrowRight className="w-4 h-4 text-indigo-300" />
                                    <span className="text-[8px] text-indigo-300 font-mono">× K⁻¹</span>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-xl font-bold text-white tracking-widest">{hillResult.decryptedText}</div>
                                    <div className="text-[9px] text-indigo-200">还原明文 (P)</div>
                                  </div>
                                </div>

                                {hillResult.invKey && (
                                  <div className="pt-4 border-t border-indigo-500/30">
                                    <div className="text-[9px] text-indigo-300 uppercase font-bold mb-2 text-center">解密逆矩阵 K⁻¹ (mod 26)</div>
                                    <div className="flex justify-center">
                                      <div className="grid grid-cols-2 gap-2">
                                        {hillResult.invKey.map((row, r) => row.map((val, c) => (
                                          <div key={`inv-${r}-${c}`} className="w-8 h-8 rounded bg-white/10 flex items-center justify-center text-xs font-mono">
                                            {val}
                                          </div>
                                        )))}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="space-y-6">
                              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                                <h5 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                  <Info className="w-4 h-4 text-indigo-500" />
                                  加密原理
                                </h5>
                                <div className="space-y-3 text-xs text-slate-500 leading-relaxed">
                                  <p>1. 将明文每两个字母分为一组，转换为 2x1 向量。</p>
                                  <p>2. 计算 [密文向量] = [密钥矩阵] × [明文向量] (mod 26)。</p>
                                  <p>3. 得到的数字重新映射回字母，即为密文。</p>
                                </div>
                              </div>
                              
                              <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 space-y-2">
                                <h5 className="text-xs font-bold text-amber-700">为什么选择矩阵？</h5>
                                <p className="text-[11px] text-amber-600 leading-relaxed">
                                  传统的单表替换加密很容易被频率分析破解。而希尔密码通过矩阵运算，让一个字母的加密结果依赖于相邻的字母，极大地提高了安全性。
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-slate-200 py-12 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-4">
          <p className="text-sm text-slate-400 italic">
            “矩阵是人类描述多维世界、处理海量信息的万能语言。”
          </p>
          <div className="flex items-center justify-center gap-4">
            <div className="h-px w-12 bg-slate-200" />
            <span className="text-[10px] uppercase tracking-widest text-slate-300 font-bold">Matrix Perception Lab v1.1</span>
            <div className="h-px w-12 bg-slate-200" />
          </div>
        </div>
      </footer>
    </div>
  );
};
