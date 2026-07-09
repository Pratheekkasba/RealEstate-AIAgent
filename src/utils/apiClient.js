import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import eventBus from '../core/eventBus.js';

dotenv.config();

// Initialize the Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
// Determine if we should run in Simulation Mode (if API key is missing or is placeholder)
const isSimulationMode = !apiKey || apiKey.includes('YOUR_GEMINI_API_KEY');

export const ai = !isSimulationMode ? new GoogleGenAI({ apiKey }) : null;

/**
 * Call Gemini model with built-in retries, backoff, and fallback configurations.
 * Runs in Simulation Mode with mock responses if no API key is set.
 */
export async function callGemini({
  prompt,
  systemInstruction,
  useSearch = false,
  responseSchema = null,
  model = 'gemini-2.5-flash',
  maxRetries = 3,
  initialDelayMs = 1000
}) {
  if (isSimulationMode) {
    console.log(`[API Client] [SIMULATION MODE] Mocking API request for model: ${model}`);
    
    // Track successful call for health monitoring
    eventBus.emitEvent('api:success', { model, useSearch });
    
    // Return mock responses based on prompt keywords
    let mockText = '';

    if (prompt.includes('Search Planner Agent') || prompt.includes('targeted daily search queries')) {
      mockText = JSON.stringify({
        queries: {
          projects: [
            "new residential projects launched in Pune 2026",
            "RERA registered projects launches Pune builder announcements"
          ],
          market: [
            "RBI interest rates home loans stamp duty notifications Pune",
            "housing demand buyer sentiment real estate trends Pune"
          ],
          infrastructure: [
            "metro corridor expansion highway road developments Pune connectivity",
            "infrastructure projects updates affecting real estate in Pune"
          ]
        }
      });
    } else if (prompt.includes('Entity Extractor') || prompt.includes('Scan the following real estate research findings')) {
      mockText = JSON.stringify({
        projects: [
          {
            projectName: "Lodha Sylvan Phase 3",
            builder: "Lodha Group",
            locality: "Hinjewadi",
            startingPrice: "95 Lakhs",
            pricePerSqFt: "8,700/sq.ft",
            launchDate: "March 2026",
            previousPrice: "8,500/sq.ft",
            priceMovement: "Up",
            inventoryStatus: "Newly launched, open for bookings",
            source: "Lodha Group Portal",
            sourceUrl: "https://www.lodhagroup.in"
          },
          {
            projectName: "Yashwin Orizzonte by VJ",
            builder: "Vilas Javdekar",
            locality: "Wakad",
            startingPrice: "85 Lakhs",
            pricePerSqFt: "8,200/sq.ft",
            launchDate: "January 2026",
            previousPrice: null,
            priceMovement: "Stable",
            inventoryStatus: "40% units booked",
            source: "RERA Maharashtra",
            sourceUrl: "https://maharera.maharashtra.gov.in"
          }
        ],
        news: [
          {
            headline: "RBI keeps Repo Rate unchanged at 6.5%",
            category: "Interest Rates",
            summary: "The Reserve Bank of India decided to hold interest rates steady in its latest monetary policy meeting, maintaining home loan rates between 8.4% and 9.5% for most major banks.",
            whyItMatters: "Stable borrowing costs offer buyers a predictable planning window.",
            impactOnBuyers: "Home loan interest rates will remain stable for the next quarter.",
            impactLevel: "High",
            source: "Reserve Bank of India",
            sourceUrl: "https://www.rbi.org.in"
          },
          {
            headline: "Pune Metro Line 3 Hinjewadi-Shivajinagar testing begins",
            category: "Infrastructure",
            summary: "Trial runs have successfully commenced on Pune Metro Line 3, connecting Hinjewadi IT park to central Shivajinagar. Commercial operations are targeted for late 2026.",
            whyItMatters: "Significantly reduces commute times, boosting rental demand and property values.",
            impactOnBuyers: "Commute times to Hinjewadi IT Park will drop by 40 minutes once fully operational.",
            impactLevel: "High",
            source: "Pune Metro Rail Corporation",
            sourceUrl: "https://www.punemetrorail.org"
          }
        ]
      });
    } else if (prompt.includes('Broker Recommendation Agent') || prompt.includes('compile actionable broker recommendations')) {
      mockText = JSON.stringify({
        opportunity: {
          headline: "Hinjewadi-Wakad Corridor Capital Growth",
          description: "Trial runs on Metro Line 3 will boost commuter accessibility. Focus listings on Hinjewadi and Wakad for medium-term rental yields."
        },
        talkingPoints: [
          "RBI keeps repo rates steady at 6.5%, ensuring home loan rates remain stable.",
          "Pune Metro Line 3 trial runs started, promising faster connectivity to IT parks.",
          "Lodha Sylvan base rate rose +2.4% since last tracking, showing high local demand.",
          "VJ Yashwin Orizzonte project launched in Wakad with units starting at 84-85 Lakhs.",
          "Verified MahaRERA listings ensure complete legal and structural safety."
        ],
        cautionItems: [
          "Verify Wakad base pricing directly from RERA as portal listings show minor variations."
        ]
      });
    } else {
      mockText = "Hello! Simulation Mode responses initialized successfully.";
    }

    return {
      text: mockText
    };
  }

  let delay = initialDelayMs;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const config = {};
      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }
      if (useSearch) {
        config.tools = [{ googleSearch: {} }];
      }
      if (responseSchema) {
        config.responseMimeType = 'application/json';
        config.responseSchema = responseSchema;
      }

      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: config
      });

      eventBus.emitEvent('api:success', { model, useSearch });

      return response;
    } catch (error) {
      console.warn(`[API Client] Attempt ${attempt}/${maxRetries} failed: ${error.message}`);
      
      eventBus.emitEvent('api:error', { 
        attempt, 
        maxRetries, 
        error: error.message, 
        model 
      });

      if (attempt === maxRetries) {
        if (model === 'gemini-2.5-pro') {
          console.warn(`[API Client] Falling back to gemini-2.5-flash`);
          return callGemini({
            prompt,
            systemInstruction,
            useSearch,
            responseSchema,
            model: 'gemini-2.5-flash',
            maxRetries: 2,
            initialDelayMs
          });
        }
        throw error;
      }

      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
}

export default callGemini;
