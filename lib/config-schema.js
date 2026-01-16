/**
 * Configuration Schema Definitions
 *
 * JSON Schema definitions for validating sumulige-claude configuration files.
 * Uses JSON Schema Draft 7 specification.
 *
 * @module lib/config-schema
 */

/**
 * Main configuration schema
 * Defines the structure and validation rules for ~/.claude/config.json
 */
const CONFIG_SCHEMA = {
  $id: 'https://sumulige-claude.com/schemas/config.json',
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Sumulige Claude Configuration',
  description: 'Configuration for sumulige-claude CLI tool',

  type: 'object',
  required: ['version'],
  additionalProperties: true,

  properties: {
    // Version - semantic version format
    version: {
      type: 'string',
      pattern: '^\\d+\\.\\d+\\.\\d+(-[a-zA-Z0-9.]+)?$',
      description: 'Semantic version (e.g., 1.0.7 or 1.0.7-beta)',
    },

    // Model selection
    model: {
      type: 'string',
      enum: [
        'claude-opus-4.5',
        'claude-opus-4-20250514',
        'claude-opus-4-5-20251101',
        'claude-sonnet-4.5',
        'claude-sonnet-4-20250514',
        'claude-sonnet-4-5-20251101',
        'claude-haiku-4.5'
      ],
      description: 'Claude model identifier to use'
    },

    // Agents configuration
    agents: {
      type: 'object',
      description: 'Agent role definitions',
      patternProperties: {
        '^[a-z][a-z0-9-]*$': {
          type: 'object',
          required: ['role'],
          properties: {
            role: {
              type: 'string',
              minLength: 1,
              description: 'Agent role description'
            },
            model: {
              type: 'string',
              description: 'Override default model for this agent'
            }
          },
          additionalProperties: true
        }
      },
      additionalProperties: true
    },

    // Skills array
    skills: {
      type: 'array',
      description: 'External skill repositories to include',
      items: {
        type: 'string',
        pattern: '^[a-zA-Z0-9_-]+/[a-zA-Z0-9_.-]+$',
        description: 'Skill repository in format owner/name'
      },
      uniqueItems: true
    },

    // Hooks configuration
    hooks: {
      type: 'object',
      description: 'Hook configuration',
      properties: {
        preTask: {
          type: 'array',
          description: 'Hooks to run before a task',
          items: { type: 'string' }
        },
        postTask: {
          type: 'array',
          description: 'Hooks to run after a task',
          items: { type: 'string' }
        }
      },
      additionalProperties: true
    },

    // ThinkingLens configuration
    thinkingLens: {
      type: 'object',
      description: 'ThinkingLens auto-memory system settings',
      properties: {
        enabled: {
          type: 'boolean',
          description: 'Enable ThinkingLens'
        },
        autoSync: {
          type: 'boolean',
          description: 'Automatically sync thinking routes'
        },
        syncInterval: {
          type: 'integer',
          minimum: 1,
          maximum: 300,
          description: 'Sync interval in conversations (1-300)'
        }
      },
      additionalProperties: true
    },

    // Quality gate configuration
    qualityGate: {
      type: 'object',
      description: 'Quality gate settings',
      properties: {
        enabled: {
          type: 'boolean',
          description: 'Enable quality gate'
        },
        severity: {
          type: 'string',
          enum: ['info', 'warn', 'error', 'critical'],
          description: 'Minimum severity level for blocking'
        },
        rules: {
          type: 'array',
          description: 'Custom rule configurations',
          items: {
            type: 'object',
            required: ['id'],
            properties: {
              id: { type: 'string' },
              enabled: { type: 'boolean' },
              severity: {
                type: 'string',
                enum: ['info', 'warn', 'error', 'critical']
              },
              config: { type: 'object' }
            }
          }
        },
        gates: {
          type: 'object',
          description: 'Gate trigger points',
          properties: {
            preCommit: { type: 'boolean' },
            prePush: { type: 'boolean' },
            onToolUse: { type: 'boolean' }
          },
          additionalProperties: true
        },
        reporting: {
          type: 'object',
          description: 'Report settings',
          properties: {
            format: {
              type: 'string',
              enum: ['console', 'json', 'markdown', 'html']
            },
            outputFile: { type: 'string' }
          },
          additionalProperties: true
        }
      },
      additionalProperties: true
    },

    // Marketplace configuration
    marketplace: {
      type: 'object',
      description: 'Skill marketplace settings',
      properties: {
        enabled: {
          type: 'boolean',
          description: 'Enable skill marketplace'
        },
        autoSync: {
          type: 'boolean',
          description: 'Auto-sync from external sources'
        },
        syncInterval: {
          type: 'integer',
          minimum: 1,
          maximum: 1440,
          description: 'Sync interval in minutes (1-1440)'
        },
        sources: {
          type: 'array',
          description: 'External skill sources',
          items: {
            type: 'string',
            format: 'uri'
          }
        }
      },
      additionalProperties: true
    }
  },

  additionalProperties: true
};

/**
 * Project-level settings schema
 * For .claude/settings.json in project directories
 */
const SETTINGS_SCHEMA = {
  $id: 'https://sumulige-claude.com/schemas/settings.json',
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Project Settings',
  description: 'Claude Code project-specific settings',

  type: 'object',

  patternProperties: {
    // Hook event names
    '^(UserPromptSubmit|PreToolUse|PostToolUse|AgentStop|SessionEnd)$': {
      type: 'array',
      description: 'Hooks for this event',
      items: {
        type: 'object',
        required: ['hooks'],
        properties: {
          matcher: {
            oneOf: [
              { type: 'string' },
              { type: 'object' }
            ]
          },
          hooks: {
            type: 'array',
            items: {
              type: 'object',
              required: ['type', 'command'],
              properties: {
                type: {
                  type: 'string',
                  enum: ['command']
                },
                command: {
                  type: 'string',
                  description: 'Command to execute'
                },
                timeout: {
                  type: 'number',
                  minimum: 100,
                  maximum: 60000,
                  description: 'Timeout in milliseconds'
                }
              },
              additionalProperties: true
            }
          }
        }
      }
    }
  },

  additionalProperties: true
};

/**
 * Quality gate configuration schema
 * For .claude/quality-gate.json
 */
const QUALITY_GATE_SCHEMA = {
  $id: 'https://sumulige-claude.com/schemas/quality-gate.json',
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Quality Gate Configuration',
  description: 'Quality gate rules and settings',

  type: 'object',

  properties: {
    enabled: {
      type: 'boolean',
      description: 'Enable quality gate'
    },
    severity: {
      type: 'string',
      enum: ['info', 'warn', 'error', 'critical'],
      description: 'Minimum severity level for blocking',
      default: 'warn'
    },
    rules: {
      type: 'array',
      description: 'Rule configurations',
      items: {
        type: 'object',
        required: ['id'],
        properties: {
          id: {
            type: 'string',
            description: 'Rule identifier'
          },
          name: {
            type: 'string',
            description: 'Human-readable rule name'
          },
          enabled: {
            type: 'boolean',
            description: 'Whether the rule is enabled',
            default: true
          },
          severity: {
            type: 'string',
            enum: ['info', 'warn', 'error', 'critical'],
            description: 'Rule severity level',
            default: 'warn'
          },
          config: {
            type: 'object',
            description: 'Rule-specific configuration'
          }
        }
      }
    },
    gates: {
      type: 'object',
      description: 'Gate trigger points',
      properties: {
        preCommit: {
          type: 'boolean',
          description: 'Run on pre-commit',
          default: true
        },
        prePush: {
          type: 'boolean',
          description: 'Run on pre-push',
          default: true
        },
        onToolUse: {
          type: 'boolean',
          description: 'Run after tool use',
          default: false
        }
      },
      additionalProperties: true
    },
    reporting: {
      type: 'object',
      description: 'Report settings',
      properties: {
        format: {
          type: 'string',
          enum: ['console', 'json', 'markdown', 'html'],
          default: 'console'
        },
        outputFile: {
          type: 'string',
          description: 'Output file path'
        }
      },
      additionalProperties: true
    }
  },

  additionalProperties: true
};

/**
 * Get schema by name
 * @param {string} name - Schema name ('config' | 'settings' | 'quality-gate')
 * @returns {Object} JSON Schema object
 */
function getSchema(name) {
  const schemas = {
    config: CONFIG_SCHEMA,
    settings: SETTINGS_SCHEMA,
    'quality-gate': QUALITY_GATE_SCHEMA
  };
  return schemas[name];
}

/**
 * Get all available schemas
 * @returns {Object} Map of schema name to schema object
 */
function getAllSchemas() {
  return {
    config: CONFIG_SCHEMA,
    settings: SETTINGS_SCHEMA,
    'quality-gate': QUALITY_GATE_SCHEMA
  };
}

module.exports = {
  CONFIG_SCHEMA,
  SETTINGS_SCHEMA,
  QUALITY_GATE_SCHEMA,
  getSchema,
  getAllSchemas
};
