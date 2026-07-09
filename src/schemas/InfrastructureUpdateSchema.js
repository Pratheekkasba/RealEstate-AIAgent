export const InfrastructureUpdateSchema = {
  name: "InfrastructureUpdate",
  schemaVersion: "1.0.0",
  required: ["title", "status", "expectedImpact"],
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
    title: "string",
    authority: "string",
    status: "string", // "Proposed" | "Testing" | "Operational"
    affectedAreas: "array",
    expectedImpact: "string",
    sources: "array",
    publishedDate: "string"
  }
};

export default InfrastructureUpdateSchema;
