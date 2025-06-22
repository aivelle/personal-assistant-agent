#!/usr/bin/env node
// scripts/validate-config-schema.js
// ✨ config JSON이 올바른지 검증

const fs = require('fs');
const path = require('path');

/**
 * Validate configuration JSON files against schemas
 */
function validateConfigSchema() {
  console.log('🔍 Validating configuration schemas...');
  
  const scenarioDir = path.join(__dirname, '../scenario');
  const configsDir = path.join(__dirname, '../configs');
  
  const validation = {
    timestamp: new Date().toISOString(),
    files: {},
    errors: [],
    warnings: [],
    summary: {
      totalFiles: 0,
      validFiles: 0,
      invalidFiles: 0,
      warningFiles: 0
    }
  };

  // Define expected schema for scenario files
  const scenarioSchema = {
    required: ['description'],
    optional: ['title', 'category', 'priority', 'enabled', 'triggers', 'examples', 'workflows', 'parameters', 'responses', 'tags', 'usage', 'errorHandling'],
    types: {
      description: 'string',
      title: 'string',
      category: 'string',
      priority: 'number',
      enabled: 'boolean',
      triggers: 'array',
      examples: 'array',
      workflows: 'array',
      parameters: 'array',
      responses: 'array',
      tags: 'array',
      usage: 'object',
      errorHandling: 'object'
    }
  };

  // Validate scenario files
  if (fs.existsSync(scenarioDir)) {
    const scenarioFiles = fs.readdirSync(scenarioDir)
      .filter(file => file.endsWith('.json'));
    
    scenarioFiles.forEach(file => {
      const filePath = path.join(scenarioDir, file);
      const fileValidation = validateFile(filePath, scenarioSchema, 'scenario');
      validation.files[file] = fileValidation;
      validation.summary.totalFiles++;
      
      if (fileValidation.valid) {
        validation.summary.validFiles++;
      } else {
        validation.summary.invalidFiles++;
      }
      
      if (fileValidation.warnings.length > 0) {
        validation.summary.warningFiles++;
      }
      
      validation.errors.push(...fileValidation.errors);
      validation.warnings.push(...fileValidation.warnings);
    });
  }

  // Validate config files
  const configFiles = [
    { file: 'prompt-router.json', schema: 'router' },
    { file: 'routing-rules.json', schema: 'routing' }
  ];

  configFiles.forEach(({ file, schema }) => {
    const filePath = path.join(configsDir, file);
    if (fs.existsSync(filePath)) {
      const configSchema = getConfigSchema(schema);
      const fileValidation = validateFile(filePath, configSchema, schema);
      validation.files[file] = fileValidation;
      validation.summary.totalFiles++;
      
      if (fileValidation.valid) {
        validation.summary.validFiles++;
      } else {
        validation.summary.invalidFiles++;
      }
      
      if (fileValidation.warnings.length > 0) {
        validation.summary.warningFiles++;
      }
      
      validation.errors.push(...fileValidation.errors);
      validation.warnings.push(...fileValidation.warnings);
    }
  });

  // Output results
  console.log('\n📊 Schema Validation Results:');
  console.log(`Total files: ${validation.summary.totalFiles}`);
  console.log(`Valid files: ${validation.summary.validFiles}`);
  console.log(`Invalid files: ${validation.summary.invalidFiles}`);
  console.log(`Files with warnings: ${validation.summary.warningFiles}`);

  if (validation.errors.length > 0) {
    console.log('\n❌ Errors:');
    validation.errors.forEach(error => {
      console.log(`  ${error.file}: ${error.message}`);
    });
  }

  if (validation.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    validation.warnings.forEach(warning => {
      console.log(`  ${warning.file}: ${warning.message}`);
    });
  }

  // Save validation report
  const outputPath = path.join(configsDir, 'schema-validation.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(validation, null, 2));
  console.log(`\n✅ Validation report saved: ${outputPath}`);

  return validation;
}

/**
 * Validate a single file against schema
 */
function validateFile(filePath, schema, schemaType) {
  const fileName = path.basename(filePath);
  const validation = {
    file: fileName,
    path: filePath,
    schemaType,
    valid: true,
    errors: [],
    warnings: []
  };

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);

    // Check required fields
    schema.required.forEach(field => {
      if (!(field in data)) {
        validation.errors.push({
          file: fileName,
          type: 'missing_required',
          field,
          message: `Missing required field: ${field}`
        });
        validation.valid = false;
      }
    });

    // Check field types
    Object.entries(data).forEach(([field, value]) => {
      if (schema.types[field]) {
        const expectedType = schema.types[field];
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        
        if (actualType !== expectedType) {
          validation.errors.push({
            file: fileName,
            type: 'type_mismatch',
            field,
            expected: expectedType,
            actual: actualType,
            message: `Field ${field} should be ${expectedType}, got ${actualType}`
          });
          validation.valid = false;
        }
      }
    });

    // Check for unknown fields
    const allKnownFields = [...schema.required, ...schema.optional];
    Object.keys(data).forEach(field => {
      if (!allKnownFields.includes(field)) {
        validation.warnings.push({
          file: fileName,
          type: 'unknown_field',
          field,
          message: `Unknown field: ${field}`
        });
      }
    });

    // Schema-specific validations
    if (schemaType === 'scenario') {
      validateScenarioSpecific(data, validation);
    }

  } catch (error) {
    validation.valid = false;
    validation.errors.push({
      file: fileName,
      type: 'parse_error',
      message: `Failed to parse JSON: ${error.message}`
    });
  }

  return validation;
}

/**
 * Scenario-specific validations
 */
function validateScenarioSpecific(data, validation) {
  // Check if examples array has reasonable content
  if (data.examples && Array.isArray(data.examples)) {
    if (data.examples.length === 0) {
      validation.warnings.push({
        file: validation.file,
        type: 'empty_examples',
        message: 'Examples array is empty - consider adding natural language examples'
      });
    } else if (data.examples.length < 3) {
      validation.warnings.push({
        file: validation.file,
        type: 'few_examples',
        message: `Only ${data.examples.length} examples provided - consider adding more for better intent recognition`
      });
    }
  }

  // Check priority range
  if (data.priority && (data.priority < 1 || data.priority > 1000)) {
    validation.warnings.push({
      file: validation.file,
      type: 'priority_range',
      message: `Priority ${data.priority} is outside recommended range (1-1000)`
    });
  }

  // Check description length
  if (data.description && data.description.length < 10) {
    validation.warnings.push({
      file: validation.file,
      type: 'short_description',
      message: 'Description is very short - consider adding more detail'
    });
  }
}

/**
 * Get schema for config files
 */
function getConfigSchema(type) {
  switch (type) {
    case 'router':
      return {
        required: ['routes'],
        optional: ['version', 'fallback'],
        types: {
          routes: 'array',
          version: 'string',
          fallback: 'string'
        }
      };
    case 'routing':
      return {
        required: ['rules'],
        optional: ['version', 'patterns', 'fallbacks', 'stats'],
        types: {
          rules: 'array',
          version: 'string',
          patterns: 'object',
          fallbacks: 'object',
          stats: 'object'
        }
      };
    default:
      return {
        required: [],
        optional: [],
        types: {}
      };
  }
}

if (require.main === module) {
  validateConfigSchema();
}

module.exports = { validateConfigSchema }; 