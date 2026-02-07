
import { GoogleGenAI, Type } from "@google/genai";
import { Report } from "../types";

export const analyzeReports = async (reports: Report[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    حلل البيانات التالية للدواوير المتضررة وقدم ملخصاً باللغة العربية:
    ${JSON.stringify(reports)}
    
    المطلوب:
    1. ملخص للوضع العام.
    2. قائمة بالأولويات القصوى.
    3. توصيات لفرق الإغاثة.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            priorities: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            recommendations: { type: Type.STRING }
          },
          required: ["summary", "priorities", "recommendations"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Analysis failed:", error);
    throw error;
  }
};
