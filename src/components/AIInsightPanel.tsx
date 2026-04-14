import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, BrainCircuit, Info, Settings, Key, Check, AlertCircle } from 'lucide-react';
import { getMatrixInsight, AIModel } from '@/src/lib/ai';
import { MatrixData, determinant } from '@/src/lib/math';
import { motion, AnimatePresence } from 'motion/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AIInsightPanelProps {
  matrix: MatrixData;
  context: string;
}

export const AIInsightPanel: React.FC<AIInsightPanelProps> = ({ matrix, context }) => {
  const [insight, setInsight] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Settings state
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('ai_insight_api_key') || '');
  const [selectedModel, setSelectedModel] = useState<AIModel>(() => (localStorage.getItem('ai_insight_model') as AIModel) || 'gemini-3.0-flash');
  const [tempKey, setTempKey] = useState(apiKey);
  const [tempModel, setTempModel] = useState(selectedModel);

  const det = determinant(matrix);

  const handleSaveSettings = () => {
    setApiKey(tempKey);
    setSelectedModel(tempModel);
    localStorage.setItem('ai_insight_api_key', tempKey);
    localStorage.setItem('ai_insight_model', tempModel);
    setShowSettings(false);
  };

  const fetchInsight = async () => {
    if (!apiKey) {
      setShowSettings(true);
      return;
    }
    setLoading(true);
    const result = await getMatrixInsight(matrix, context, apiKey, selectedModel);
    setInsight(result);
    setLoading(false);
  };

  useEffect(() => {
    setInsight('');
  }, [matrix]);

  return (
    <Card className="bg-white border-slate-200 overflow-hidden shadow-sm">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-indigo-600">
            <BrainCircuit className="w-4 h-4" />
            AI 空间洞察
          </CardTitle>
          <div className="flex items-center gap-1">
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger
                render={
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600">
                    <Settings className="w-4 h-4" />
                  </Button>
                }
              />
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-indigo-600" />
                    AI 模型设置
                  </DialogTitle>
                  <DialogDescription>
                    配置您的 API 密钥和首选大模型以生成空间洞察。
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                      <Key className="w-3 h-3" />
                      API 密钥 (API Key)
                    </label>
                    <Input
                      type="password"
                      placeholder="输入您的 API 密钥..."
                      value={tempKey}
                      onChange={(e) => setTempKey(e.target.value)}
                      className="font-mono text-xs"
                    />
                    <p className="text-[10px] text-slate-400 italic">密钥将保存在本地浏览器中。</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">选择模型</label>
                    <Select value={tempModel} onValueChange={(v) => setTempModel(v as AIModel)}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择模型" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gemini-3.0-flash">Gemini 3.0 Flash</SelectItem>
                        <SelectItem value="deepseek-r1">DeepSeek R1</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSaveSettings} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                    <Check className="w-4 h-4" />
                    确认选择
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button 
              variant="ghost" 
              size="sm" 
              onClick={fetchInsight}
              disabled={loading}
              className="h-8 text-xs gap-1 hover:bg-indigo-50 hover:text-indigo-600"
            >
              <Sparkles className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              {loading ? '思考中...' : '生成洞察'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {!apiKey && (
          <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-amber-700">未配置 API 密钥</p>
              <p className="text-[10px] text-amber-600 leading-relaxed">
                请点击右上角齿轮图标配置 API 密钥，即可开启 AI 语义化分析。
              </p>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {insight ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-sm text-slate-600 leading-relaxed italic"
            >
              "{insight}"
            </motion.div>
          ) : (
            <div className="text-sm text-slate-400 flex items-center gap-2 py-4">
              <Info className="w-4 h-4" />
              点击“生成洞察”以获取 AI 对当前变换的语义化解释。
            </div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded bg-slate-50 border border-slate-100">
            <div className="text-[10px] text-slate-400 uppercase font-bold">行列式 (Det)</div>
            <div className={`text-lg font-mono ${Math.abs(det) < 0.01 ? 'text-rose-500' : 'text-slate-700'}`}>
              {det.toFixed(2)}
            </div>
          </div>
          <div className="p-2 rounded bg-slate-50 border border-slate-100">
            <div className="text-[10px] text-slate-400 uppercase font-bold">当前模型</div>
            <div className="text-xs font-medium text-slate-600 mt-1 truncate">
              {selectedModel === 'gemini-3.0-flash' ? 'Gemini 3.0' : 'DeepSeek R1'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
