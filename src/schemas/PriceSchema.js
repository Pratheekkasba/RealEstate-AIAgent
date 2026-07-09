export const PriceSchema = {
  name: "PriceRecord",
  schemaVersion: "1.0.0",
  required: ["locality", "pricePerSqFt"],
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
    locality: "string",
    pricePerSqFt: "number",
    previousPrice: "number",
    currency: "string",
    movement: "string", // "Up" | "Stable" | "Down"
    sources: "array",
    effectiveDate: "string"
  }
};

export default PriceSchema;
