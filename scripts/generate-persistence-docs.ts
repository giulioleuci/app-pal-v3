import * as fs from 'fs';
import * as path from 'path';
import { ClassDeclaration, MethodDeclaration, Project, Scope } from 'ts-morph';

/**
 * Generates comprehensive PUBLIC API documentation for the Persistence Layer.
 * 
 * This script scans all repository and data access classes and extracts:
 * - Complete class inventory with PUBLIC API methods
 * - Class.method naming format with full signatures
 * - Detailed input/output specifications for every method
 * - Comprehensive parameter and return type documentation
 * - Extended descriptions for all public interfaces
 */
async function generatePersistenceLayerDocs(): Promise<void> {
  const project = new Project({
    tsConfigFilePath: path.join(process.cwd(), 'tsconfig.json'),
  });
  
  project.addSourceFilesAtPaths('src/features/**/data/**/*.ts');
  project.addSourceFilesAtPaths('src/shared/data/**/*.ts');

  let markdown = generateHeader();

  const sourceFiles = project.getSourceFiles();
  console.log(`Found ${sourceFiles.length} source files in Persistence Layer`);

  for (const sourceFile of sourceFiles) {
    const filePath = path.relative(process.cwd(), sourceFile.getFilePath());
    markdown += `## File: \`${filePath}\`\n\n`;

    const exportedClasses = sourceFile.getClasses().filter((c) => c.isExported());

    if (exportedClasses.length === 0) {
      markdown += '_No exported classes found in this file._\n\n';
      continue;
    }

    for (const classDec of exportedClasses) {
      markdown += generateClassDocumentation(classDec);
    }
  }

  fs.writeFileSync('PUBLIC_API_PERSISTENCE.md', markdown);
  console.log('✅ Persistence Layer PUBLIC API documentation generated successfully at PUBLIC_API_PERSISTENCE.md');
}

/**
 * Generates the header section of the documentation
 */
function generateHeader(): string {
  return `# PUBLIC API - Persistence Layer

This document provides comprehensive **PUBLIC API** documentation for the Persistence Layer.
Every class, method, input parameter and output value is documented with complete signatures and descriptions.

## PUBLIC API Overview

The Persistence Layer exposes the following PUBLIC API:
- **Repository Implementations**: Concrete implementations of domain repository interfaces
- **Data Mapping**: Convert between domain models and persistence models
- **Database Operations**: WatermelonDB query operations and transactions
- **Error Handling**: Persistence-specific error handling and mapping

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
 * Generates documentation for a single class
 */
function generateClassDocumentation(classDec: ClassDeclaration): string {
  const className = classDec.getName();
  const jsDocInfo = extractCompleteJSDoc(classDec.getJsDocs());
  
  let markdown = `### class \`${className}\`\n\n`;
  
  if (jsDocInfo.description) {
    markdown += `**Description:**\n${jsDocInfo.description}\n\n`;
  }

  if (jsDocInfo.since) {
    markdown += `**Since:** ${jsDocInfo.since}\n\n`;
  }

  if (jsDocInfo.deprecated) {
    markdown += `**⚠️ Deprecated:** ${jsDocInfo.deprecated}\n\n`;
  }

  if (jsDocInfo.examples.length > 0) {
    markdown += `**Usage Examples:**\n`;
    jsDocInfo.examples.forEach(example => {
      markdown += `\`\`\`typescript\n${example}\n\`\`\`\n\n`;
    });
  }

  // Extract constructor
  const constructors = classDec.getConstructors();
  if (constructors.length > 0) {
    markdown += `#### Constructor\n\n`;
    constructors.forEach((constructor) => {
      markdown += generateConstructorDocumentation(constructor);
    });
  }

  // Extract public properties
  const publicProperties = classDec
    .getProperties()
    .filter((prop) => prop.getScope() === Scope.Public);
  
  if (publicProperties.length > 0) {
    markdown += `#### Public Properties\n\n`;
    publicProperties.forEach((prop) => {
      const propName = prop.getName();
      const propType = prop.getType().getText();
      const propJsDoc = extractCompleteJSDoc(prop.getJsDocs());
      
      markdown += `##### \`${propName}: ${propType}\`\n\n`;
      if (propJsDoc.description) {
        markdown += `${propJsDoc.description}\n\n`;
      }
    });
  }

  const publicStaticMethods = classDec
    .getStaticMethods()
    .filter((m) => m.getScope() === Scope.Public);
  if (publicStaticMethods.length > 0) {
    markdown += '#### Public Static Methods\n\n';
    for (const method of publicStaticMethods) {
      markdown += generateMethodDocumentation(method);
    }
  }

  const publicMethods = classDec
    .getInstanceMethods()
    .filter((m) => m.getScope() === Scope.Public);
  if (publicMethods.length > 0) {
    markdown += '#### Public Instance Methods\n\n';
    for (const method of publicMethods) {
      markdown += generateMethodDocumentation(method);
    }
  }

  markdown += '---\n\n';
  return markdown;
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
  parameters.forEach((param, index) => {
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

// Execute the script
generatePersistenceLayerDocs().catch((error) => {
  console.error('❌ Error generating Persistence Layer documentation:', error);
  process.exit(1);
});
