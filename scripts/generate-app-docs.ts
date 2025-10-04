import { writeFileSync } from 'fs';
import { join } from 'path';
import { ClassDeclaration, MethodDeclaration, Project, SourceFile } from 'ts-morph';

/**
 * Generates comprehensive PUBLIC API documentation for the Application Layer.
 *
 * This script scans all service classes in the Application Layer and extracts:
 * - Complete class inventory with PUBLIC API methods
 * - Class.method naming format with full signatures
 * - Detailed input/output specifications for every method
 * - Comprehensive parameter and return type documentation
 * - Extended descriptions for all public interfaces
 */
async function generateApplicationLayerDocs(): Promise<void> {
  const project = new Project({
    tsConfigFilePath: join(process.cwd(), 'tsconfig.json'),
  });

  // Add all Application Layer source files
  const servicePatterns = [
    'src/features/**/services/**/*.ts',
    'src/features/**/handlers/**/*.ts',
    'src/app/services/**/*.ts',
  ];

  servicePatterns.forEach((pattern) => {
    project.addSourceFilesAtPaths(pattern);
  });

  const sourceFiles = project.getSourceFiles();
  console.log(`Found ${sourceFiles.length} source files in Application Layer`);

  let markdownContent = generateHeader();

  // Group files by feature for better organization
  const filesByFeature = groupFilesByFeature(sourceFiles);

  for (const [featureName, files] of Object.entries(filesByFeature)) {
    markdownContent += `## ${featureName}\n\n`;

    for (const sourceFile of files) {
      const classContent = extractClassDocumentation(sourceFile);
      if (classContent) {
        markdownContent += classContent;
      }
    }
  }

  // Write the generated documentation to the root directory
  const outputPath = join(process.cwd(), 'PUBLIC_API_APPLICATION.md');
  writeFileSync(outputPath, markdownContent, 'utf-8');

  console.log(`✅ Application Layer PUBLIC API documentation generated successfully at: ${outputPath}`);
}

/**
 * Generates the header section of the documentation
 */
function generateHeader(): string {
  return `# PUBLIC API - Application Layer

This document provides comprehensive **PUBLIC API** documentation for the Application Layer.
Every class, method, input parameter and output value is documented with complete signatures and descriptions.

## PUBLIC API Overview

The Application Layer exposes the following PUBLIC API:
- **Stateless Services**: Orchestrate domain operations and business workflows
- **Repository Interfaces**: Abstract data access for domain persistence
- **Result Contracts**: All methods return \`Result<T, E>\` for explicit error handling
- **Domain Event Handlers**: Process cross-aggregate communication

## API Documentation Format

Each API element follows this format:
- **Class Name**: Complete class name and description
- **Method Format**: \`ClassName.methodName()\` with full signature
- **Input Parameters**: Detailed parameter types and descriptions
- **Output Values**: Complete return type and value descriptions
- **Extended Description**: Comprehensive method behavior documentation

---

`;
}

/**
 * Groups source files by feature name for organized documentation
 */
function groupFilesByFeature(sourceFiles: SourceFile[]): Record<string, SourceFile[]> {
  const groups: Record<string, SourceFile[]> = {};

  sourceFiles.forEach((file) => {
    const filePath = file.getFilePath();
    const featureName = extractFeatureName(filePath);

    if (!groups[featureName]) {
      groups[featureName] = [];
    }
    groups[featureName].push(file);
  });

  return groups;
}

/**
 * Extracts feature name from file path
 */
function extractFeatureName(filePath: string): string {
  // Extract feature name from path like src/features/workout/services/...
  const featuresMatch = filePath.match(/src\/features\/([^/]+)/);
  if (featuresMatch) {
    return `${featuresMatch[1].charAt(0).toUpperCase()}${featuresMatch[1].slice(1)} Feature`;
  }

  // Handle app-level services
  if (filePath.includes('src/app/services')) {
    return 'Core Application Services';
  }

  return 'Miscellaneous Services';
}

/**
 * Extracts documentation for all exported classes in a source file
 */
function extractClassDocumentation(sourceFile: SourceFile): string {
  const classes = sourceFile.getClasses().filter((cls) => cls.isExported());

  if (classes.length === 0) {
    return '';
  }

  let content = '';

  classes.forEach((classDecl) => {
    content += generateClassDocumentation(classDecl, sourceFile);
  });

  return content;
}

/**
 * Generates documentation for a single class
 */
function generateClassDocumentation(classDecl: ClassDeclaration, sourceFile: SourceFile): string {
  const className = classDecl.getName() || 'UnnamedClass';
  const jsDocInfo = extractCompleteJSDoc(classDecl.getJsDocs());
  const filePath = sourceFile.getFilePath().replace(process.cwd(), '');

  let content = `### ${className}\n\n`;
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
    content += `#### Constructor\n\n`;
    constructors.forEach((constructor) => {
      content += generateConstructorDocumentation(constructor);
    });
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
    content += `#### Public Methods\n\n`;

    publicMethods.forEach((method) => {
      content += generateMethodDocumentation(method);
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
    content += `#### Static Methods\n\n`;

    staticMethods.forEach((method) => {
      content += generateMethodDocumentation(method);
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
    content += `#### Public Properties\n\n`;
    publicProperties.forEach((prop) => {
      const propName = prop.getName();
      const propType = prop.getType().getText();
      const propJsDoc = extractCompleteJSDoc(prop.getJsDocs());
      
      content += `##### \`${propName}: ${propType}\`\n\n`;
      if (propJsDoc.description) {
        content += `${propJsDoc.description}\n\n`;
      }
    });
  }

  content += `---\n\n`;
  return content;
}

/**
 * Generates documentation for a single method
 */
function generateMethodDocumentation(method: MethodDeclaration): string {
  const methodName = method.getName();
  const className = method.getParent()?.getName?.() || 'UnknownClass';
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
    jsDocInfo.examples.forEach((example) => {
      content += `\`\`\`typescript\n${example}\n\`\`\`\n\n`;
    });
  }

  return content;
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
 * Extracts JSDoc comment text from JSDoc nodes
 */
function extractJSDoc(jsDocs: any[]): string {
  if (jsDocs.length === 0) return '';

  const jsDoc = jsDocs[0];
  const description = jsDoc.getDescription();

  if (!description) return '';

  return description.replace(/\n\s*/g, ' ').trim();
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
    const paramType = param.getType().getText();
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
generateApplicationLayerDocs().catch((error) => {
  console.error('❌ Error generating Application Layer documentation:', error);
  process.exit(1);
});
