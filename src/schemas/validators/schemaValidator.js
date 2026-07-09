import ProjectSchema from '../ProjectSchema.js';
import PriceSchema from '../PriceSchema.js';
import MarketUpdateSchema from '../MarketUpdateSchema.js';
import InfrastructureUpdateSchema from '../InfrastructureUpdateSchema.js';
import SourceSchema from '../SourceSchema.js';
import InsightSchema from '../InsightSchema.js';

const schemas = {
  project: ProjectSchema,
  price: PriceSchema,
  market: MarketUpdateSchema,
  infrastructure: InfrastructureUpdateSchema,
  source: SourceSchema,
  insight: InsightSchema
};

/**
 * Validates a data object against the specified entity schema name.
 * Automatically injects default shared metadata and schemaVersion.
 * 
 * @param {string} schemaName - One of 'project', 'price', 'market', 'infrastructure', 'source', 'insight'
 * @param {Object} data - The data object to validate
 * @returns {Object} Enriched and validated object copy
 * @throws {Error} If validation fails
 */
export function validateEntity(schemaName, data) {
  const schema = schemas[schemaName.toLowerCase()];
  if (!schema) {
    throw new Error(`Schema validation error: Unknown schema type "${schemaName}".`);
  }

  if (!data || typeof data !== 'object') {
    throw new Error(`Schema validation error [${schema.name}]: Input data must be a non-null object.`);
  }

  const errors = [];
  const validated = { ...data };

  // 1. Assert required fields
  for (const reqField of schema.required) {
    if (validated[reqField] === undefined || validated[reqField] === null || validated[reqField] === "") {
      errors.push(`Missing required field: "${reqField}"`);
    }
  }

  // 2. Validate types
  for (const [propName, propType] of Object.entries(schema.properties)) {
    const val = validated[propName];
    if (val !== undefined && val !== null) {
      if (propType === 'string' && typeof val !== 'string') {
        errors.push(`Field "${propName}" must be a string (received: ${typeof val})`);
      } else if (propType === 'number' && (typeof val !== 'number' || isNaN(val))) {
        errors.push(`Field "${propName}" must be a valid number (received: ${typeof val})`);
      } else if (propType === 'boolean' && typeof val !== 'boolean') {
        errors.push(`Field "${propName}" must be a boolean (received: ${typeof val})`);
      } else if (propType === 'array' && !Array.isArray(val)) {
        errors.push(`Field "${propName}" must be an array (received: ${typeof val})`);
      } else if (propType === 'object' && (typeof val !== 'object' || Array.isArray(val))) {
        errors.push(`Field "${propName}" must be a standard object (received: ${typeof val})`);
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Schema validation error [${schema.name}]:\n- ${errors.join('\n- ')}`);
  }

  // 3. Inject default shared metadata values if not present
  if (!validated.schemaVersion) {
    validated.schemaVersion = schema.schemaVersion;
  }
  if (!validated.createdAt) {
    validated.createdAt = new Date().toISOString();
  }
  if (!validated.updatedAt) {
    validated.updatedAt = new Date().toISOString();
  }
  if (validated.verificationStatus === undefined) {
    validated.verificationStatus = "unverified";
  }
  if (validated.confidence === undefined) {
    validated.confidence = 1.0;
  }
  if (validated.tags === undefined) {
    validated.tags = [];
  }

  return validated;
}

export default validateEntity;
