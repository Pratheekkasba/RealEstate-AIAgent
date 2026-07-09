export const ProjectSchema = {
  name: "Project",
  schemaVersion: "1.0.0",
  required: ["projectName", "locality", "city"],
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
    entityId: "string",
    entityType: "string",
    projectName: "string",
    builder: "string",
    locality: "string",
    city: "string",
    state: "string",
    reraId: "string",
    aliases: "array",
    launchDate: "string",
    pricing: "object", // pricing start/end values
    inventory: "string",
    sources: "array",
    metadata: "object"
  }
};

export default ProjectSchema;
