/**
 * Script to analyze React hooks for potential performance issues.
 *
 * This script scans all hooks in the project and identifies:
 * - Potential infinite loops in useEffect dependencies
 * - Heavy computations without proper memoization
 * - Hooks calling multiple other hooks that might cause re-render cascades
 * - useMemo/useCallback with missing or problematic dependencies
 */

import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface HookAnalysis {
  filePath: string;
  hookName: string;
  issues: Issue[];
  complexity: 'low' | 'medium' | 'high' | 'critical';
  score: number;
}

interface Issue {
  type: 'infinite-loop' | 'heavy-computation' | 'cascade' | 'missing-deps' | 'complex-memo';
  severity: 'low' | 'medium' | 'high' | 'critical';
  line: number;
  description: string;
  suggestion: string;
}

class HookAnalyzer {
  private results: HookAnalysis[] = [];

  analyze(sourceDir: string): HookAnalysis[] {
    this.scanDirectory(sourceDir);
    return this.results.sort((a, b) => b.score - a.score);
  }

  private scanDirectory(dir: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      // Skip node_modules and other directories
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') {
        continue;
      }

      if (entry.isDirectory()) {
        this.scanDirectory(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        // Only analyze hook files
        if (entry.name.startsWith('use') || fullPath.includes('/hooks/')) {
          this.analyzeFile(fullPath);
        }
      }
    }
  }

  private analyzeFile(filePath: string): void {
    const content = fs.readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true
    );

    const hooks = this.findHookFunctions(sourceFile);

    for (const hook of hooks) {
      const analysis = this.analyzeHook(hook, content, filePath);
      if (analysis.issues.length > 0) {
        this.results.push(analysis);
      }
    }
  }

  private findHookFunctions(sourceFile: ts.SourceFile): ts.FunctionDeclaration[] {
    const hooks: ts.FunctionDeclaration[] = [];

    const visit = (node: ts.Node) => {
      if (ts.isFunctionDeclaration(node)) {
        const name = node.name?.getText();
        if (name?.startsWith('use')) {
          hooks.push(node);
        }
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return hooks;
  }

  private analyzeHook(hookNode: ts.FunctionDeclaration, content: string, filePath: string): HookAnalysis {
    const hookName = hookNode.name?.getText() || 'anonymous';
    const issues: Issue[] = [];

    // Get the text of the hook body
    const hookText = hookNode.getText();
    const lines = content.split('\n');

    // 1. Check for useEffect without dependencies (potential infinite loop)
    const useEffectWithoutDeps = /useEffect\s*\([^,)]+\s*\)/g;
    let match;
    while ((match = useEffectWithoutDeps.exec(hookText)) !== null) {
      const line = this.getLineNumber(content, match.index);
      issues.push({
        type: 'infinite-loop',
        severity: 'critical',
        line,
        description: 'useEffect without dependency array - will run on every render',
        suggestion: 'Add dependency array as second argument to useEffect'
      });
    }

    // 2. Check for heavy computations in render body (not memoized)
    const heavyOperations = [
      /\.map\([^)]+\)\.filter\([^)]+\)\.reduce/g,  // Chained array operations
      /\.sort\([^)]+\)\.map\([^)]+\)\.filter/g,
      /for\s*\([^)]*\)\s*\{[^}]*for\s*\([^)]*\)/g,  // Nested loops
      /reduce\([^)]*\)[^}]*\{[^}]*reduce/g,  // Nested reduces
    ];

    for (const pattern of heavyOperations) {
      while ((match = pattern.exec(hookText)) !== null) {
        const line = this.getLineNumber(content, match.index);
        // Check if it's inside useMemo or useCallback
        const beforeMatch = hookText.substring(0, match.index);
        const inMemo = /useMemo\s*\(\s*\(\s*\)\s*=>\s*\{[^}]*$/.test(beforeMatch);

        if (!inMemo) {
          issues.push({
            type: 'heavy-computation',
            severity: 'high',
            line,
            description: 'Heavy computation detected without memoization',
            suggestion: 'Wrap computation in useMemo to prevent recalculation on every render'
          });
        }
      }
    }

    // 3. Check for multiple observe queries (cascade risk)
    const observeQueryCalls = (hookText.match(/useObserveQuery/g) || []).length;
    if (observeQueryCalls > 2) {
      issues.push({
        type: 'cascade',
        severity: 'high',
        line: this.getLineNumber(content, hookText.indexOf('useObserveQuery')),
        description: `Hook calls useObserveQuery ${observeQueryCalls} times, risking re-render cascade`,
        suggestion: 'Consider combining queries or using a single query with joins'
      });
    }

    // 4. Check for useMemo with complex objects/arrays in dependencies
    const useMemoPattern = /useMemo\s*\(\s*[^,]+,\s*\[([^\]]+)\]/g;
    while ((match = useMemoPattern.exec(hookText)) !== null) {
      const deps = match[1];
      // Check for object/array dependencies
      if (deps.match(/\{|\[/) || deps.match(/\w+\.\w+\.\w+/)) {
        const line = this.getLineNumber(content, match.index);
        issues.push({
          type: 'complex-memo',
          severity: 'medium',
          line,
          description: 'useMemo with complex object/array dependency may cause unnecessary recalculations',
          suggestion: 'Use primitive values or stable references in dependency array'
        });
      }
    }

    // 5. Check for missing dependencies in useMemo/useCallback
    const callbackPattern = /use(?:Memo|Callback)\s*\(\s*(?:\(\s*\)\s*=>)?\s*\{([^}]+)\}[^,]*,\s*\[([^\]]*)\]/g;
    while ((match = callbackPattern.exec(hookText)) !== null) {
      const body = match[1];
      const deps = match[2];

      // Extract variable references from body
      const references = body.match(/\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g) || [];
      const uniqueRefs = [...new Set(references)];

      // Check if all references are in dependencies
      const depsList = deps.split(',').map(d => d.trim()).filter(d => d);
      const missingDeps = uniqueRefs.filter(ref => {
        // Skip keywords, built-in functions, and constants
        if (['const', 'let', 'var', 'if', 'else', 'return', 'function', 'true', 'false', 'null', 'undefined'].includes(ref)) {
          return false;
        }
        return !depsList.includes(ref) && !ref.match(/^[A-Z]/);  // Skip constants
      });

      if (missingDeps.length > 0 && missingDeps.length < 5) { // Avoid false positives
        const line = this.getLineNumber(content, match.index);
        issues.push({
          type: 'missing-deps',
          severity: 'medium',
          line,
          description: `Potentially missing dependencies: ${missingDeps.slice(0, 3).join(', ')}`,
          suggestion: 'Add missing dependencies to avoid stale closures'
        });
      }
    }

    // 6. Check for deeply nested useMemo (complexity issue)
    const nestedMemoCount = (hookText.match(/useMemo[^}]*useMemo/g) || []).length;
    if (nestedMemoCount > 0) {
      issues.push({
        type: 'complex-memo',
        severity: 'high',
        line: this.getLineNumber(content, hookText.indexOf('useMemo')),
        description: 'Nested useMemo detected - indicates overly complex hook',
        suggestion: 'Consider splitting into multiple hooks or extracting to a service'
      });
    }

    // Calculate complexity score
    const score = this.calculateScore(issues, hookText);
    const complexity = this.determineComplexity(score);

    return {
      filePath,
      hookName,
      issues,
      complexity,
      score
    };
  }

  private getLineNumber(content: string, index: number): number {
    return content.substring(0, index).split('\n').length;
  }

  private calculateScore(issues: Issue[], hookText: string): number {
    let score = 0;

    // Base score on issue severity
    for (const issue of issues) {
      switch (issue.severity) {
        case 'critical': score += 100; break;
        case 'high': score += 50; break;
        case 'medium': score += 20; break;
        case 'low': score += 5; break;
      }
    }

    // Add score for hook complexity (lines of code)
    const lines = hookText.split('\n').length;
    score += Math.floor(lines / 10);

    // Add score for number of React hooks called
    const hookCalls = (hookText.match(/use[A-Z]\w+/g) || []).length;
    score += hookCalls * 5;

    return score;
  }

  private determineComplexity(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 150) return 'critical';
    if (score >= 75) return 'high';
    if (score >= 30) return 'medium';
    return 'low';
  }

  generateReport(analyses: HookAnalysis[]): string {
    let report = '# Hook Performance Analysis Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;
    report += `Total hooks analyzed: ${analyses.length}\n\n`;

    // Critical issues
    const critical = analyses.filter(a => a.complexity === 'critical');
    if (critical.length > 0) {
      report += '## 🔴 CRITICAL ISSUES\n\n';
      for (const analysis of critical) {
        report += this.formatAnalysis(analysis);
      }
    }

    // High severity
    const high = analyses.filter(a => a.complexity === 'high');
    if (high.length > 0) {
      report += '## 🟠 HIGH PRIORITY ISSUES\n\n';
      for (const analysis of high) {
        report += this.formatAnalysis(analysis);
      }
    }

    // Medium severity
    const medium = analyses.filter(a => a.complexity === 'medium');
    if (medium.length > 0) {
      report += '## 🟡 MEDIUM PRIORITY ISSUES\n\n';
      for (const analysis of medium.slice(0, 10)) { // Limit to 10
        report += this.formatAnalysis(analysis);
      }
    }

    // Summary
    report += '\n## Summary\n\n';
    report += `- Critical: ${critical.length}\n`;
    report += `- High: ${high.length}\n`;
    report += `- Medium: ${medium.length}\n\n`;

    return report;
  }

  private formatAnalysis(analysis: HookAnalysis): string {
    let output = `### ${analysis.hookName}\n\n`;
    output += `**File:** \`${analysis.filePath}\`\n`;
    output += `**Complexity:** ${analysis.complexity.toUpperCase()} (Score: ${analysis.score})\n\n`;

    for (const issue of analysis.issues) {
      output += `- **[${issue.severity.toUpperCase()}]** Line ${issue.line}: ${issue.description}\n`;
      output += `  - *Suggestion:* ${issue.suggestion}\n`;
    }

    output += '\n';
    return output;
  }
}

// Run analysis
const analyzer = new HookAnalyzer();
const projectRoot = path.join(__dirname, '../src');
const results = analyzer.analyze(projectRoot);
const report = analyzer.generateReport(results);

// Write report to file
const reportPath = path.join(__dirname, '../HOOK_ANALYSIS_REPORT.md');
fs.writeFileSync(reportPath, report);

console.log(`Analysis complete. Report written to ${reportPath}`);
console.log(`\nFound ${results.length} hooks with potential issues:`);
console.log(`- Critical: ${results.filter(r => r.complexity === 'critical').length}`);
console.log(`- High: ${results.filter(r => r.complexity === 'high').length}`);
console.log(`- Medium: ${results.filter(r => r.complexity === 'medium').length}`);
