import { Project, Scope } from 'ts-morph';
import { describe, expect, it } from 'vitest';

describe('Domain Model Constructors', () => {
  it(
    'all classes extending BaseModel should have a protected constructor',
    { timeout: 15000 },
    () => {
      const project = new Project({ tsConfigFilePath: 'tsconfig.json' });
      project.addSourceFilesAtPaths([
        'src/features/**/domain/**/*.ts',
        'src/shared/domain/**/*.ts',
      ]);

      const violations: string[] = [];

      project.getSourceFiles().forEach((sourceFile) => {
        sourceFile.getClasses().forEach((classDecl) => {
          const baseClass = classDecl.getBaseClass();
          if (baseClass && baseClass.getName() === 'BaseModel') {
            const constructor = classDecl.getConstructors()[0];
            if (!constructor || constructor.getScope() !== Scope.Protected) {
              violations.push(`${classDecl.getName()} does not have a protected constructor.`);
            }
          }
        });
      });

      expect(violations, `Violations found:\n${violations.join('\n')}`).toEqual([]);
    }
  );
});
