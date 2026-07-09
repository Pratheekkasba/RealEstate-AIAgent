import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({}); // default client looks for GEMINI_API_KEY or other env variables

async function test() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Hello! Tell me in 5 words what city you are thinking of.',
    });
    console.log('Success! Gemini response:', response.text);
  } catch (err) {
    console.error('Gemini API Error:', err.message);
  }
}

test();
