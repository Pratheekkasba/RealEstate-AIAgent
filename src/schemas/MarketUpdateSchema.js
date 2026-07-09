export const MarketUpdateSchema = {
  name: "MarketUpdate",
  schemaVersion: "1.0.0",
  required: ["headline", "category", "summary"],
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
    headline: "string",
    category: "string", // "Interest Rates" | "Policy" | "Taxation" | "Other"
    summary: "string",
    impact: "string",
    sources: "array",
    publishedDate: "string"
  }
};

export default MarketUpdateSchema;
