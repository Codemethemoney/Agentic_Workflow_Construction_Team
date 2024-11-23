import { GeneratedCode } from '../types';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export async function validateCode(code: GeneratedCode): Promise<ValidationResult> {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  // Validate file structure
  validateFileStructure(code, result);

  // Validate dependencies
  validateDependencies(code, result);

  // Validate code syntax
  await validateSyntax(code, result);

  // Validate type safety if TypeScript
  await validateTypes(code, result);

  // Set final validation status
  result.valid = result.errors.length === 0;

  return result;
}

function validateFileStructure(code: GeneratedCode, result: ValidationResult): void {
  // Check for required files
  const hasMainFile = code.files.some(file => 
    file.path.includes('index.') || file.path.includes('main.')
  );

  if (!hasMainFile) {
    result.errors.push('Missing main entry file');
  }

  // Check file naming conventions
  code.files.forEach(file => {
    if (!isValidFilePath(file.path)) {
      result.errors.push(`Invalid file path: ${file.path}`);
    }
  });
}

function validateDependencies(code: GeneratedCode, result: ValidationResult): void {
  // Check for version conflicts
  const dependencies = { ...code.dependencies };
  
  Object.entries(dependencies).forEach(([name, version]) => {
    if (!isValidSemVer(version)) {
      result.errors.push(`Invalid version for dependency ${name}: ${version}`);
    }
  });

  // Check for security vulnerabilities
  // This would integrate with a security advisory database
}

async function validateSyntax(code: GeneratedCode, result: ValidationResult): Promise<void> {
  for (const file of code.files) {
    try {
      if (file.path.endsWith('.ts') || file.path.endsWith('.js')) {
        // Validate JavaScript/TypeScript syntax
        await validateJavaScriptSyntax(file.content, result);
      } else if (file.path.endsWith('.py')) {
        // Validate Python syntax
        await validatePythonSyntax(file.content, result);
      }
    } catch (error) {
      result.errors.push(`Syntax error in ${file.path}: ${error.message}`);
    }
  }
}

async function validateTypes(code: GeneratedCode, result: ValidationResult): Promise<void> {
  const tsFiles = code.files.filter(file => file.path.endsWith('.ts'));
  
  if (tsFiles.length > 0) {
    try {
      // This would integrate with the TypeScript compiler API
      await validateTypeScript(tsFiles, result);
    } catch (error) {
      result.errors.push(`Type validation error: ${error.message}`);
    }
  }
}

function isValidFilePath(path: string): boolean {
  // Implement file path validation logic
  return /^[a-zA-Z0-9\-_/.]+$/.test(path);
}

function isValidSemVer(version: string): boolean {
  // Implement semver validation logic
  return /^\^?\d+\.\d+\.\d+$/.test(version);
}

async function validateJavaScriptSyntax(content: string, result: ValidationResult): Promise<void> {
  // Implementation of JavaScript/TypeScript syntax validation
}

async function validatePythonSyntax(content: string, result: ValidationResult): Promise<void> {
  // Implementation of Python syntax validation
}

async function validateTypeScript(files: Array<{ path: string; content: string }>, result: ValidationResult): Promise<void> {
  // Implementation of TypeScript validation
}