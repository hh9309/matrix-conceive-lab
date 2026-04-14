import { GoogleGenAI } from "@google/genai";

export type AIModel = 'gemini-3.0-flash' | 'deepseek-r1';

export async function getMatrixInsight(
  matrix: number[][], 
  context: string, 
  apiKey: string, 
  model: AIModel
) {
  if (!apiKey) {
    return "请输入 API 密钥以使用 AI 洞察功能。";
  }

  const dimension = matrix.length;
  const prompt = `
    你是一位资深的线性代数教育专家。
    请分析以下 ${dimension}x${dimension} 矩阵：${JSON.stringify(matrix)}。
    上下文环境：${context}
    
    请提供一个简短、直观的“空间洞察”（Spatial Insight），使用中文。
    重点关注：
    1. 这个矩阵对 ${dimension}D 空间做了什么？（旋转、缩放、错切、坍缩等）
    2. 这种变换的“语义”含义是什么？
    3. 如果上下文是特定的（如机器学习或控制理论），解释其在那里的意义。
    
    保持简洁（2-3 句话），引人入胜且专业。
    格式：仅返回文本。
  `;

  try {
    if (model === 'gemini-3.0-flash') {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview", // Correct internal model name for "3.0 flash"
        contents: prompt,
      });
      return response.text || "无法生成洞察。";
    } else if (model === 'deepseek-r1') {
      // Assuming DeepSeek uses OpenAI-compatible API
      const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "deepseek-reasoner", // DeepSeek R1 model name
          messages: [{ role: "user", content: prompt }],
          stream: false
        })
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || "DeepSeek API Error");
      }
      
      const data = await response.json();
      return data.choices[0].message.content || "无法生成洞察。";
    }
    return "不支持的模型。";
  } catch (error: any) {
    console.error("AI Error:", error);
    return `AI 思考时遇到错误: ${error.message || "请检查 API 密钥和网络连接。"}`;
  }
}
