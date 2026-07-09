export const InsightSchema = {
  name: "Insight",
  schemaVersion: "1.0.0",
  required: ["category", "description"],
  properties: {
    // Shared Metadata
    schemaVersion: "string",
    createdAt: "string",
    updatedAt: "string",
    confidence: "number",
    verificationStatus: "string",
    dataAge: "number",
    tags: "array",

    // Core Entity Fields
    insightId: "string",
    category: "string", // "Trend" | "Launch" | "Policy"
    description: "string",
    supportingFacts: "array",
    generatedAt: "string"
  }
};

export default InsightSchema;
