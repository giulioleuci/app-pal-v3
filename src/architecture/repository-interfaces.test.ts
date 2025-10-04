import { Project } from 'ts-morph';
import { describe, expect, it } from 'vitest';

describe('Repository Interfaces', () => {
  it('all Repository classes should implement their corresponding IRepository interface', () => {
    const project = new Project({ tsConfigFilePath: 'tsconfig.json' });
    project.addSourceFilesAtPaths('src/features/**/data/*Repository.ts');

    const violations: string[] = [];

    project.getSourceFiles().forEach((sourceFile) => {
      sourceFile.getClasses().forEach((classDecl) => {
        const className = classDecl.getName();
        if (className && className.endsWith('Repository')) {
          const expectedInterfaceName = `I${className}`;
          const implementedInterfaces = classDecl.getImplements().map((i) => i.getText());
          if (!implementedInterfaces.includes(expectedInterfaceName)) {
            violations.push(`${className} does not implement ${expectedInterfaceName}.`);
          }
        }
      });
    });

    expect(violations, `Violations found:\n${violations.join('\n')}`).toEqual([]);
  });
});
