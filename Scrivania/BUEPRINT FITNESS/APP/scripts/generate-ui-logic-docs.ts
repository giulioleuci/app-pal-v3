import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import {
  ClassDeclaration,
  FunctionDeclaration,
  MethodDeclaration,
  Project,
  SourceFile,
} from 'ts-morph';

/**
 * Generates comprehensive PUBLIC API documentation for the UI Logic Layer.
 *
 * This script scans all hooks and query services in the UI Logic Layer and extracts:
 * - Complete class inventory with PUBLIC API methods
 * - Class.method naming format with full signatures
 * - Detailed input/output specifications for every method
 * - Comprehensive parameter and return type documentation
 * - Extended descriptions for all public interfaces
 */
async function generateUILogicLayerDocs(): Promise<void> {
  const project = new Project({
    tsConfigFilePath: join(process.cwd(), 'tsconfig.json'),
  });

  // Add all UI Logic Layer source files
  const uiLogicPatterns = [
    'src/features/**/hooks/**/*.ts',
    'src/app/hooks/**/*.ts',
    'src/features/**/query-services/**/*.ts',
  ];

  uiLogicPatterns.forEach((pattern) => {
    project.addSourceFilesAtPaths(pattern);
  });

  const sourceFiles = project
    .getSourceFiles()
    .filter((file) => !file.getFilePath().includes('__tests__')); // Exclude test files

  console.log(`Found ${sourceFiles.length} source files in UI Logic Layer`);

  let markdownContent = generateHeader();

  // Group files by feature and type for better organization
  const filesByFeature = groupFilesByFeatureAndType(sourceFiles);

  for (const [featureName, fileTypes] of Object.entries(filesByFeature)) {
    markdownContent += `## ${featureName}\n\n`;

    // Process hooks first, then query services
    if (fileTypes.hooks && fileTypes.hooks.length > 0) {
      markdownContent += `### Custom Hooks\n\n`;
      for (const sourceFile of fileTypes.hooks) {
        const hookContent = extractHookDocumentation(sourceFile);
        if (hookContent) {
          markdownContent += hookContent;
        }
      }
    }

    if (fileTypes.queryServices && fileTypes.queryServices.length > 0) {
      markdownContent += `### Query Services\n\n`;
      for (const sourceFile of fileTypes.queryServices) {
        const queryServiceContent = extractQueryServiceDocumentation(sourceFile);
        if (queryServiceContent) {
          markdownContent += queryServiceContent;
        }
      }
    }
  }

  // Ensure PUBLIC_API directory exists
  const publicApiDir = join(process.cwd(), 'PUBLIC_API');
  try {
    if (!existsSync(publicApiDir)) {
      mkdirSync(publicApiDir, { recursive: true });
    }
  } catch (error) {
    console.warn('Could not create PUBLIC_API directory, using root directory instead');
  }

  // Write the generated documentation to the PUBLIC_API directory (or root if it doesn't exist)
  const outputPath = join(publicApiDir, 'UI_LOGIC_LAYER.md');
  writeFileSync(outputPath, markdownContent, 'utf-8');

  console.log(`✅ UI Logic Layer PUBLIC API documentation generated successfully at: ${outputPath}`);
}

/**
 * Generates the header section of the documentation
 */
function generateHeader(): string {
  return `# PUBLIC API - UI Logic Layer

This document provides comprehensive **PUBLIC API** documentation for the UI Logic Layer.
Every class, method, function, input parameter and output value is documented with complete signatures and descriptions.

## PUBLIC API Overview

The UI Logic Layer exposes the following PUBLIC API:
- **Custom React Hooks**: React hooks for component state and business logic integration
- **Query Services**: Adapter pattern for server state management with React Query
- **State Management**: Global and local state management solutions
- **Cache Management**: Granular cache invalidation and synchronization

## API Documentation Format

Each API element follows this format:
- **Function/Hook Name**: Complete function/hook name and description
- **Method Format**: \`functionName()\` or \`ClassName.methodName()\` with full signature
- **Input Parameters**: Detailed parameter types and descriptions
- **Output Values**: Complete return type and value descriptions
- **Extended Description**: Comprehensive function/method behavior documentation

---

`;
}

/**
 * Groups source files by feature name and type (hooks vs query-services)
 */
function groupFilesByFeatureAndType(
  sourceFiles: SourceFile[]
): Record<string, { hooks?: SourceFile[]; queryServices?: SourceFile[] }> {
  const groups: Record<string, { hooks?: SourceFile[]; queryServices?: SourceFile[] }> = {};

  sourceFiles.forEach((file) => {
    const filePath = file.getFilePath();
    const featureName = extractFeatureName(filePath);
    const fileType = getFileType(filePath);

    if (!groups[featureName]) {
      groups[featureName] = {};
    }

    if (fileType === 'hook') {
      if (!groups[featureName].hooks) {
        groups[featureName].hooks = [];
      }
      groups[featureName].hooks.push(file);
    } else if (fileType === 'queryService') {
      if (!groups[featureName].queryServices) {
        groups[featureName].queryServices = [];
      }
      groups[featureName].queryServices.push(file);
    }
  });

  return groups;
}

/**
 * Determines if a file is a hook or query service
 */
function getFileType(filePath: string): 'hook' | 'queryService' | 'other' {
  if (filePath.includes('/hooks/') && !filePath.includes('index.ts')) {
    return 'hook';
  }
  if (filePath.includes('/query-services/') && !filePath.includes('index.ts')) {
    return 'queryService';
  }
  return 'other';
}

/**
 * Extracts feature name from file path
 */
function extractFeatureName(filePath: string): string {
  // Extract feature name from path like src/features/workout/hooks/...
  const featuresMatch = filePath.match(/src\/features\/([^/]+)/);
  if (featuresMatch) {
    return `${featuresMatch[1].charAt(0).toUpperCase()}${featuresMatch[1].slice(1)} Feature`;
  }

  // Handle app-level hooks
  if (filePath.includes('src/app/hooks')) {
    return 'Core Application Hooks';
  }

  return 'Miscellaneous';
}

/**
 * Extracts documentation for all exported functions (hooks) in a source file
 */
function extractHookDocumentation(sourceFile: SourceFile): string {
  const functions = sourceFile.getFunctions().filter((fn) => fn.isExported());

  if (functions.length === 0) {
    return '';
  }

  let content = '';

  functions.forEach((funcDecl) => {
    content += generateHookDocumentation(funcDecl, sourceFile);
  });

  return content;
}

/**
 * Extracts documentation for all exported classes (query services) in a source file
 */
function extractQueryServiceDocumentation(sourceFile: SourceFile): string {
  const classes = sourceFile.getClasses().filter((cls) => cls.isExported());

  if (classes.length === 0) {
    return '';
  }

  let content = '';

  classes.forEach((classDecl) => {
    content += generateQueryServiceClassDocumentation(classDecl, sourceFile);
  });

  return content;
}

/**
 * Generates documentation for a single hook function
 */
function generateHookDocumentation(funcDecl: FunctionDeclaration, sourceFile: SourceFile): string {
  const functionName = funcDecl.getName() || 'UnnamedFunction';
  const jsDocInfo = extractCompleteJSDoc(funcDecl.getJsDocs());
  const filePath = sourceFile.getFilePath().replace(process.cwd(), '');
  const parameters = funcDecl.getParameters();
  const returnType = funcDecl.getReturnType().getText();

  // Get function signature
  const signature = funcDecl.getText().split('{')[0].trim();

  let content = `#### PUBLIC API: \`${functionName}()\`\n\n`;
  content += `**File:** \`${filePath}\`\n\n`;

  // Enhanced function documentation with input/output focus
  content += `**Full Function Signature:**\n`;
  content += `\`\`\`typescript\n${signature}\n\`\`\`\n\n`;

  if (jsDocInfo.description) {
    content += `**Extended Description:**\n${jsDocInfo.description}\n\n`;
  }

  // Input Parameters Section
  if (parameters.length > 0) {
    content += `**INPUT PARAMETERS:**\n\n`;
    parameters.forEach((param) => {
      const paramName = param.getName();
      const paramType = cleanTypeString(param.getType().getText());
      const paramDoc = jsDocInfo.parameters.find(p => p.name === paramName);
      const description = paramDoc?.description || 'No description provided';

      content += `- **\`${paramName}\`** (\`${paramType}\`): ${description}\n`;
    });
    content += `\n`;
  } else {
    content += `**INPUT PARAMETERS:** None\n\n`;
  }

  // Output Section
  if (returnType !== 'void') {
    const cleanReturnType = cleanTypeString(returnType);
    const returnDesc = jsDocInfo.returns || `Returns value of type ${cleanReturnType}`;
    content += `**OUTPUT VALUE:**\n`;
    content += `- **Type:** \`${cleanReturnType}\`\n`;
    content += `- **Description:** ${returnDesc}\n\n`;

    // Extract sub-methods from aggregate hook returns
    content += extractAggregateHookSubMethods(funcDecl, functionName);
  } else {
    content += `**OUTPUT VALUE:** \`void\` (no return value)\n\n`;
  }

  // Additional function information
  if (jsDocInfo.throws.length > 0) {
    content += `**EXCEPTIONS:**\n`;
    jsDocInfo.throws.forEach(throwInfo => {
      content += `- ${throwInfo}\n`;
    });
    content += `\n`;
  }

  if (jsDocInfo.since) {
    content += `**Since:** ${jsDocInfo.since}\n\n`;
  }

  if (jsDocInfo.deprecated) {
    content += `**⚠️ DEPRECATED:** ${jsDocInfo.deprecated}\n\n`;
  }

  if (jsDocInfo.examples.length > 0) {
    content += `**Usage Examples:**\n\n`;
    jsDocInfo.examples.forEach(example => {
      content += `\`\`\`typescript\n${example}\n\`\`\`\n\n`;
    });
  }

  content += `---\n\n`;

  return content;
}

/**
 * Generates documentation for a single query service class
 */
function generateQueryServiceClassDocumentation(
  classDecl: ClassDeclaration,
  sourceFile: SourceFile
): string {
  const className = classDecl.getName() || 'UnnamedClass';
  const jsDocInfo = extractCompleteJSDoc(classDecl.getJsDocs());
  const filePath = sourceFile.getFilePath().replace(process.cwd(), '');

  let content = `#### ${className}\n\n`;
  content += `**File:** \`${filePath}\`\n\n`;

  if (jsDocInfo.description) {
    content += `**Description:**\n${jsDocInfo.description}\n\n`;
  }

  if (jsDocInfo.since) {
    content += `**Since:** ${jsDocInfo.since}\n\n`;
  }

  if (jsDocInfo.deprecated) {
    content += `**⚠️ Deprecated:** ${jsDocInfo.deprecated}\n\n`;
  }

  if (jsDocInfo.examples.length > 0) {
    content += `**Usage Examples:**\n`;
    jsDocInfo.examples.forEach(example => {
      content += `\`\`\`typescript\n${example}\n\`\`\`\n\n`;
    });
  }

  // Extract constructor
  const constructors = classDecl.getConstructors();
  if (constructors.length > 0) {
    content += `**Constructor:**\n\n`;
    constructors.forEach((constructor) => {
      content += generateConstructorDocumentation(constructor);
    });
  }

  // Extract public properties
  const publicProperties = classDecl
    .getProperties()
    .filter((prop) =>
      prop
        .getModifiers()
        .every((modifier) => !['private', 'protected'].includes(modifier.getText()))
    );
  
  if (publicProperties.length > 0) {
    content += `**Public Properties:**\n\n`;
    publicProperties.forEach((prop) => {
      const propName = prop.getName();
      const propType = prop.getType().getText();
      const propJsDoc = extractCompleteJSDoc(prop.getJsDocs());
      
      content += `- \`${propName}: ${propType}\`\n`;
      if (propJsDoc.description) {
        content += `  - ${propJsDoc.description}\n`;
      }
    });
    content += `\n`;
  }

  // Extract public methods
  const publicMethods = classDecl
    .getMethods()
    .filter((method) =>
      method
        .getModifiers()
        .every((modifier) => !['private', 'protected'].includes(modifier.getText()))
    );

  if (publicMethods.length > 0) {
    content += `**Public Methods:**\n\n`;

    publicMethods.forEach((method) => {
      content += generateQueryServiceMethodDocumentation(method);
    });
  }

  // Extract static methods
  const staticMethods = classDecl
    .getStaticMethods()
    .filter((method) =>
      method
        .getModifiers()
        .every((modifier) => !['private', 'protected'].includes(modifier.getText()))
    );

  if (staticMethods.length > 0) {
    content += `**Static Methods:**\n\n`;

    staticMethods.forEach((method) => {
      content += generateQueryServiceMethodDocumentation(method);
    });
  }

  content += `---\n\n`;
  return content;
}

/**
 * Generates documentation for a single query service method
 */
function generateQueryServiceMethodDocumentation(method: MethodDeclaration): string {
  const methodName = method.getName();
  const parent = method.getParent();
  const className = (parent && 'getName' in parent && typeof parent.getName === 'function')
    ? parent.getName() || 'UnknownClass'
    : 'UnknownClass';
  const signature = method.getText().split('{')[0].trim();
  const jsDocInfo = extractCompleteJSDoc(method.getJsDocs());
  const parameters = method.getParameters();
  const returnType = method.getReturnType().getText();

  let content = `##### PUBLIC API: \`${className}.${methodName}()\`\n\n`;
  
  // Enhanced method documentation with input/output focus
  content += `**Full Method Signature:**\n`;
  content += `\`\`\`typescript\n${signature}\n\`\`\`\n\n`;
  
  if (jsDocInfo.description) {
    content += `**Extended Description:**\n${jsDocInfo.description}\n\n`;
  }
  
  // Input Parameters Section
  if (parameters.length > 0) {
    content += `**INPUT PARAMETERS:**\n\n`;
    parameters.forEach((param) => {
      const paramName = param.getName();
      const paramType = cleanTypeString(param.getType().getText());
      const paramDoc = jsDocInfo.parameters.find(p => p.name === paramName);
      const description = paramDoc?.description || 'No description provided';
      
      content += `- **\`${paramName}\`** (\`${paramType}\`): ${description}\n`;
    });
    content += `\n`;
  } else {
    content += `**INPUT PARAMETERS:** None\n\n`;
  }
  
  // Output Section
  if (returnType !== 'void') {
    const cleanReturnType = cleanTypeString(returnType);
    const returnDesc = jsDocInfo.returns || `Returns value of type ${cleanReturnType}`;
    content += `**OUTPUT VALUE:**\n`;
    content += `- **Type:** \`${cleanReturnType}\`\n`;
    content += `- **Description:** ${returnDesc}\n\n`;
  } else {
    content += `**OUTPUT VALUE:** \`void\` (no return value)\n\n`;
  }
  
  // Additional method information
  if (jsDocInfo.throws.length > 0) {
    content += `**EXCEPTIONS:**\n`;
    jsDocInfo.throws.forEach(throwInfo => {
      content += `- ${throwInfo}\n`;
    });
    content += `\n`;
  }
  
  if (jsDocInfo.since) {
    content += `**Since:** ${jsDocInfo.since}\n\n`;
  }
  
  if (jsDocInfo.deprecated) {
    content += `**⚠️ DEPRECATED:** ${jsDocInfo.deprecated}\n\n`;
  }
  
  if (jsDocInfo.examples.length > 0) {
    content += `**Usage Examples:**\n\n`;
    jsDocInfo.examples.forEach(example => {
      content += `\`\`\`typescript\n${example}\n\`\`\`\n\n`;
    });
  }

  return content;
}


/**
 * Extracts comprehensive JSDoc information including parameters, returns, examples, etc.
 */
function extractCompleteJSDoc(jsDocs: any[]): {
  description: string;
  parameters: Array<{ name: string; type?: string; description?: string }>;
  returns: string;
  throws: string[];
  examples: string[];
  since?: string;
  deprecated?: string;
} {
  const result = {
    description: '',
    parameters: [] as Array<{ name: string; type?: string; description?: string }>,
    returns: '',
    throws: [] as string[],
    examples: [] as string[],
    since: undefined as string | undefined,
    deprecated: undefined as string | undefined
  };

  if (jsDocs.length === 0) return result;

  const jsDoc = jsDocs[0];
  
  // Extract description
  const description = jsDoc.getDescription();
  if (description) {
    result.description = description.replace(/\n\s*/g, ' ').trim();
  }

  // Extract tags
  const tags = jsDoc.getTags();
  
  tags.forEach((tag: any) => {
    const tagName = tag.getTagName();
    const tagText = tag.getCommentText();
    
    switch (tagName) {
      case 'param':
        // Improved regex to handle various JSDoc param formats
        const paramMatch = tagText?.match(/^(?:\{([^}]+)\}\s+)?(\w+)(?:\s*[-–]\s*(.*))?$/);
        if (paramMatch) {
          result.parameters.push({
            name: paramMatch[2],
            type: paramMatch[1],
            description: paramMatch[3] || ''
          });
        } else {
          // Fallback for simpler formats
          const simpleMatch = tagText?.match(/^(\w+)\s*[-–]?\s*(.*)$/);
          if (simpleMatch) {
            result.parameters.push({
              name: simpleMatch[1],
              type: undefined,
              description: simpleMatch[2] || ''
            });
          }
        }
        break;
      case 'returns':
      case 'return':
        if (tagText) {
          // Extract return type and description
          const returnMatch = tagText.match(/^(?:\{([^}]+)\}\s+)?(.*)$/);
          if (returnMatch) {
            result.returns = returnMatch[2] || returnMatch[1] || tagText;
          } else {
            result.returns = tagText.replace(/\n\s*/g, ' ').trim();
          }
        }
        break;
      case 'throws':
      case 'throw':
        if (tagText) {
          result.throws.push(tagText.replace(/\n\s*/g, ' ').trim());
        }
        break;
      case 'example':
        if (tagText) {
          result.examples.push(tagText.trim());
        }
        break;
      case 'since':
        if (tagText) {
          result.since = tagText.replace(/\n\s*/g, ' ').trim();
        }
        break;
      case 'deprecated':
        if (tagText) {
          result.deprecated = tagText.replace(/\n\s*/g, ' ').trim();
        }
        break;
    }
  });

  return result;
}

/**
 * Extracts sub-methods from aggregate hook return values by analyzing the function body
 */
function extractAggregateHookSubMethods(funcDecl: FunctionDeclaration, functionName: string): string {
  const functionBody = funcDecl.getText();
  let content = '';

  // Check if this is an aggregate hook (returns an object with methods)
  if (functionBody.includes('return {') &&
      (functionName.includes('Management') ||
       functionName.includes('Manager') ||
       functionName.includes('Hub') ||
       functionName.includes('Tracker') ||
       functionName.includes('Session') ||
       functionName.includes('Tracking'))) {

    content += `**AGGREGATE HOOK SUB-METHODS:**\n\n`;

    // Extract return object properties using regex
    const returnObjectMatch = functionBody.match(/return\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/);
    if (returnObjectMatch) {
      const returnContent = returnObjectMatch[1];

      // Extract individual properties/methods
      const methodMatches = returnContent.match(/\w+\s*:/g);
      if (methodMatches) {
        methodMatches.forEach(match => {
          const methodName = match.replace(':', '').trim();
          content += `- **\`${functionName}().${methodName}\`** - Sub-method of the aggregate hook\n`;
        });
      }

      // Try to extract more detailed method signatures by looking for specific patterns
      const detailedMethods = extractDetailedMethodSignatures(returnContent, functionName);
      if (detailedMethods.length > 0) {
        content += `\n**DETAILED SUB-METHOD SIGNATURES:**\n\n`;
        detailedMethods.forEach(method => {
          content += `- **\`${functionName}().${method.name}\`**`;
          if (method.signature) {
            content += ` - \`${method.signature}\``;
          }
          if (method.description) {
            content += ` - ${method.description}`;
          }
          content += `\n`;
        });
      }
    }

    content += `\n`;
  }

  return content;
}

/**
 * Extracts detailed method signatures from return object content
 */
function extractDetailedMethodSignatures(returnContent: string, _hookName: string): Array<{
  name: string;
  signature?: string;
  description?: string;
}> {
  const methods: Array<{ name: string; signature?: string; description?: string }> = [];

  // Common patterns for CRUD operations
  const crudPatterns = [
    { name: 'create', description: 'Creates a new entity' },
    { name: 'update', description: 'Updates an existing entity' },
    { name: 'delete', description: 'Deletes an entity' },
    { name: 'list', description: 'Lists multiple entities' },
    { name: 'get', description: 'Gets a single entity by ID' },
    { name: 'search', description: 'Searches entities with filters' },
    { name: 'observe', description: 'Observes entities with reactive updates' }
  ];

  // Look for specific method patterns in the return content
  const lines = returnContent.split('\n');
  lines.forEach(line => {
    const trimmedLine = line.trim();

    // Match patterns like "methodName: useCallback(" or "methodName: useMutation("
    const methodMatch = trimmedLine.match(/^(\w+):\s*(use\w+|async|function|\([^)]*\)\s*=>)/);
    if (methodMatch) {
      const methodName = methodMatch[1];
      const methodType = methodMatch[2];

      let description = '';
      const crudPattern = crudPatterns.find(p => p.name === methodName);
      if (crudPattern) {
        description = crudPattern.description;
      } else {
        // Generate description based on method name
        if (methodName.startsWith('use')) {
          description = 'React hook for data management';
        } else if (methodName.includes('delete') || methodName.includes('remove')) {
          description = 'Deletes/removes an entity';
        } else if (methodName.includes('create') || methodName.includes('add')) {
          description = 'Creates/adds a new entity';
        } else if (methodName.includes('update') || methodName.includes('edit')) {
          description = 'Updates/edits an entity';
        } else if (methodName.includes('get') || methodName.includes('fetch')) {
          description = 'Retrieves entity data';
        } else if (methodName.includes('list') || methodName.includes('all')) {
          description = 'Lists multiple entities';
        }
      }

      methods.push({
        name: methodName,
        signature: methodType.startsWith('use') ? `${methodType}(...)` : undefined,
        description
      });
    }
  });

  return methods;
}

/**
 * Cleans TypeScript type strings by removing import paths and keeping only class names
 */
function cleanTypeString(typeString: string): string {
  // Remove import() paths and keep only the final type name
  return typeString
    .replace(/import\([^)]+\)\./g, '') // Remove import("path").
    .replace(/Promise<([^>]+)>/g, 'Promise<$1>') // Keep Promise wrapper but clean inner type
    .replace(/Result<([^,]+),\s*([^>]+)>/g, 'Result<$1, $2>') // Clean Result types
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Generates documentation for a constructor
 */
function generateConstructorDocumentation(constructor: any): string {
  const signature = constructor.getText().split('{')[0].trim();
  const jsDocInfo = extractCompleteJSDoc(constructor.getJsDocs());
  const parameters = constructor.getParameters();

  let content = `##### Constructor\n\n`;
  
  // JSDoc-style constructor block
  content += `\`\`\`typescript\n/**\n`;
  
  if (jsDocInfo.description) {
    content += ` * ${jsDocInfo.description}\n *\n`;
  }
  
  // Add parameters with proper JSDoc format
  parameters.forEach((param: any) => {
    const paramName = param.getName();
    const paramType = cleanTypeString(param.getType().getText());
    const paramDoc = jsDocInfo.parameters.find(p => p.name === paramName);
    const description = paramDoc?.description || '';
    
    content += ` * @param {${paramType}} ${paramName} - ${description}\n`;
  });
  
  if (jsDocInfo.throws.length > 0) {
    jsDocInfo.throws.forEach(throwInfo => {
      content += ` * @throws ${throwInfo}\n`;
    });
  }
  
  content += ` */\n${signature}\n\`\`\`\n\n`;

  return content;
}

// Execute the script
generateUILogicLayerDocs().catch((error) => {
  console.error('❌ Error generating UI Logic Layer documentation:', error);
  process.exit(1);
});
