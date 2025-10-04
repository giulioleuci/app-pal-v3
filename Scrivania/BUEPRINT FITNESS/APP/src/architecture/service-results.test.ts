import { Project, SyntaxKind } from 'ts-morph';
import { describe, expect, it } from 'vitest';

describe('Service Result Contract', () => {
  it('all public methods in Application Service classes should return a Promise<Result<...>>', () => {
    const project = new Project({ tsConfigFilePath: 'tsconfig.json' });
    project.addSourceFilesAtPaths(['src/features/**/services/**/*.ts', 'src/app/services/**/*.ts']);

    const violations: string[] = [];

    project.getSourceFiles().forEach((sourceFile) => {
      sourceFile.getClasses().forEach((classDecl) => {
        const className = classDecl.getName();
        // Only check Application Services (not QueryServices which are adapters)
        if (className && className.endsWith('Service') && !className.endsWith('QueryService')) {
          classDecl.getMethods().forEach((method) => {
            if (
              method.hasModifier(SyntaxKind.PublicKeyword) ||
              (!method.hasModifier(SyntaxKind.PrivateKeyword) &&
                !method.hasModifier(SyntaxKind.ProtectedKeyword))
            ) {
              const returnType = method.getReturnType().getText(method);
              if (!returnType.startsWith('Promise<Result<')) {
                violations.push(
                  `${className}.${method.getName()} has an invalid return type: ${returnType}`
                );
              }
            }
          });
        }
      });
    });

    expect(violations, `Violations found:\n${violations.join('\n')}`).toEqual([]);
  });
});
