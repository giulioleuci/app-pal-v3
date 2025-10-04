import { Project, SyntaxKind } from 'ts-morph';
import { describe, expect, it } from 'vitest';

describe('Architectural Rules: Persistence Layer', () => {
  const project = new Project();
  project.addSourceFilesAtPaths('src/features/**/data/**/*.ts');

  it('all Repositories should implement their corresponding IRepository interface', () => {
    const violations: string[] = [];

    project.getSourceFiles().forEach((sourceFile) => {
      sourceFile.getClasses().forEach((classDecl) => {
        const className = classDecl.getName();
        if (className && className.endsWith('Repository')) {
          const expectedInterfaceName = `I${className}`;
          const implementedInterfaces = classDecl.getImplements().map((i) => i.getText());
          if (!implementedInterfaces.includes(expectedInterfaceName)) {
            violations.push(`${className} does not implement ${expectedInterfaceName}`);
          }
        }
      });
    });

    expect(violations, `Violations found: ${violations.join('\n')}`).toEqual([]);
  });

  it('Repositories should use Model.hydrate() instead of new Model()', () => {
    const violations: string[] = [];

    project.getSourceFiles().forEach((sourceFile) => {
      // Find all 'new' expressions, e.g., "new ProfileModel(...)"
      const newExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.NewExpression);

      newExpressions.forEach((expression) => {
        const identifier = expression.getExpression();
        const typeName = identifier.getText();

        if (typeName.endsWith('Model')) {
          violations.push(
            `Illegal use of 'new ${typeName}()' in ${sourceFile.getFilePath()}. ` +
              `Use '${typeName}.hydrate()' instead.`
          );
        }
      });
    });

    expect(violations, `Violations found: ${violations.join('\n')}`).toEqual([]);
  });

  it('Repositories should inject interfaces, not concrete repository classes', () => {
    const violations: string[] = [];

    project.getSourceFiles().forEach((sourceFile) => {
      sourceFile.getClasses().forEach((classDecl) => {
        const className = classDecl.getName();
        if (className && className.endsWith('Repository')) {
          const constructor = classDecl.getConstructors()[0];
          if (constructor) {
            constructor.getParameters().forEach((param) => {
              const paramType = param.getTypeNode()?.getText();
              // Check if parameter is a repository type but NOT an interface
              // (interfaces start with "I" followed by the class name)
              if (
                paramType &&
                paramType.endsWith('Repository') &&
                paramType !== className &&
                !paramType.startsWith('I')
              ) {
                violations.push(
                  `${className} illegally injects concrete class '${paramType}'. ` +
                    `Inject the 'I${paramType}' interface instead.`
                );
              }
            });
          }
        }
      });
    });

    expect(violations, `Violations found: ${violations.join('\n')}`).toEqual([]);
  });
});
