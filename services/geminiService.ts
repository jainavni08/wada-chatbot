import { GoogleGenAI } from "@google/genai";
import { Language } from '../types';
import { 
  GEMINI_MODEL, 
  SYSTEM_INSTRUCTION_EN, 
  SYSTEM_INSTRUCTION_HI,
  SYSTEM_INSTRUCTION_ES,
  SYSTEM_INSTRUCTION_FR,
  SYSTEM_INSTRUCTION_BN,
  SYSTEM_INSTRUCTION_TA,
  SYSTEM_INSTRUCTION_TE,
  SYSTEM_INSTRUCTION_MR,
  SYSTEM_INSTRUCTION_GU,
  SYSTEM_INSTRUCTION_KN
} from '../constants';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const systemInstructions: Record<string, string> = {
  [Language.EN]: SYSTEM_INSTRUCTION_EN,
  [Language.HI]: SYSTEM_INSTRUCTION_HI,
  [Language.ES]: SYSTEM_INSTRUCTION_ES,
  [Language.FR]: SYSTEM_INSTRUCTION_FR,
  [Language.BN]: SYSTEM_INSTRUCTION_BN,
  [Language.TA]: SYSTEM_INSTRUCTION_TA,
  [Language.TE]: SYSTEM_INSTRUCTION_TE,
  [Language.MR]: SYSTEM_INSTRUCTION_MR,
  [Language.GU]: SYSTEM_INSTRUCTION_GU,
  [Language.KN]: SYSTEM_INSTRUCTION_KN,
};

const errorMessages: Record<string, string> = {
  [Language.EN]: "Sorry, something went wrong. Please try again later.",
  [Language.HI]: "क्षमा करें, कुछ गलत हो गया। कृपया बाद में फिर से प्रयास करें।",
  [Language.ES]: "Lo siento, algo salió mal. Por favor, inténtalo de nuevo más tarde.",
  [Language.FR]: "Désolé, une erreur s'est produite. Veuillez réessayer plus tard.",
  [Language.BN]: "দুঃখিত, কিছু ভুল হয়েছে। অনুগ্রহ করে পরে আবার চেষ্টা করুন।",
  [Language.TA]: "மன்னிக்கவும், ஏதோ தவறு நடந்துவிட்டது. தயவுசெய்து பின்னர் மீண்டும் முயற்சிக்கவும்.",
  [Language.TE]: "క్షమించండి, ఏదో పొరపాటు జరిగింది. దయచేసి తర్వాత మళ్లీ ప్రయత్నించండి.",
  [Language.MR]: "क्षमस्व, काहीतरी चूक झाली. कृपया नंतर पुन्हा प्रयत्न करा.",
  [Language.GU]: "માફ કરશો, કંઇક ખોટું થયું. કૃપા કરીને પછીથી ફરી પ્રયાસ કરો.",
  [Language.KN]: "ಕ್ಷಮಿಸಿ, ಏನೋ ತಪ್ಪಾಗಿದೆ. ದಯವಿಟ್ಟು ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
}

export const getChatResponse = async (
  prompt: string,
  image: { mimeType: string; data: string } | null,
  language: Language
): Promise<string> => {
  try {
    const systemInstruction = systemInstructions[language];
    
    // Fix: Correctly construct the `contents` property according to Gemini API guidelines.
    // For multimodal input, it's a Content object. For text-only, a simple string is sufficient,
    // which is more idiomatic for single-turn requests than using a Content array.
    const requestContents = image
      ? {
          parts: [
            { inlineData: { mimeType: image.mimeType, data: image.data } },
            { text: prompt },
          ],
        }
      : prompt;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: requestContents,
      config: {
        systemInstruction: systemInstruction,
      },
    });
    
    return response.text;

  } catch (error) {
    console.error("Error getting chat response from Gemini:", error);
    return errorMessages[language];
  }
};