import { Project } from 'ts-morph';
import { describe, expect, it } from 'vitest';

const ILLEGAL_DEPENDENCIES = ['/data/', '/services/', '/hooks/', '/components/'];
const ALLOWED_EXTERNAL = ['tsyringe', 'immer', 'date-fns', 'zod', 'uuid'];

describe('Domain Layer Purity', () => {
  it('should not have any dependencies on outer layers or unapproved external libraries', () => {
    const project = new Project({ tsConfigFilePath: 'tsconfig.json' });

    const violations: string[] = [];

    // Get all domain files, excluding tests
    const domainFiles = project
      .addSourceFilesAtPaths(['src/features/**/domain/**/*.ts', 'src/shared/domain/**/*.ts'])
      .filter((file) => {
        const filePath = file.getFilePath();
        return (
          !filePath.includes('__tests__') &&
          !filePath.includes('.test.') &&
          !filePath.includes('.spec.')
        );
      });

    domainFiles.forEach((sourceFile) => {
      const filePath = sourceFile.getFilePath();

      // Only process files that are actually in the domain directory
      if (!filePath.includes('/domain/')) {
        return;
      }

      sourceFile.getImportDeclarations().forEach((importDecl) => {
        const moduleSpecifier = importDecl.getModuleSpecifierValue();
        const isIllegalInternal = ILLEGAL_DEPENDENCIES.some((dep) => moduleSpecifier.includes(dep));
        const isExternal = !moduleSpecifier.startsWith('@/') && !moduleSpecifier.startsWith('.');
        const isUnapprovedExternal =
          isExternal && !ALLOWED_EXTERNAL.some((lib) => moduleSpecifier.startsWith(lib));

        if (isIllegalInternal || isUnapprovedExternal) {
          violations.push(`Illegal import '${moduleSpecifier}' found in ${filePath}`);
        }
      });
    });

    expect(violations, `Violations found:\n${violations.join('\n')}`).toEqual([]);
  });
});
