export const SourceSchema = {
  name: "Source",
  schemaVersion: "1.0.0",
  required: ["url"],
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
    sourceId: "string",
    provider: "string", // "gemini" | "tavily"
    domain: "string",
    url: "string",
    title: "string",
    publishedDate: "string",
    fetchedDate: "string",
    tier: "number", // tier rating index 1-4
    reputationScore: "number"
  }
};

export default SourceSchema;
