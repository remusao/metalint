import { Project } from '../project';
import { Diagnostic, DiagnosticSeverity } from '../rules';

/**
 * Check that names of sub-packages are consistent with folder names.
 *
 * TODO - autofix should try to get values from .metalint.json, then template, in this order of priority.
 */
export default function* packageAttributesConsistency(
  project: Project,
): IterableIterator<Diagnostic> {
  if (project.packages.length === 0) {
    return;
  }

  // Store set of attributes to ignore
  const ignoreAttributes: Set<string> = new Set();

  for (const { name, pkg } of project.packages) {
    if (
      project.metalint.workspaces !== undefined &&
      project.metalint.workspaces.pkg !== undefined
    ) {
      for (const [attribute, value] of Object.entries(project.metalint.workspaces.pkg)) {
        ignoreAttributes.add(attribute);
        const normalizedValue = JSON.stringify(pkg[attribute]);
        const normalizedExpected = JSON.stringify(value);

        if (value === null && pkg[attribute] !== undefined) {
          yield {
            code: '[pkg/attributes-consistency]',
            message: `sub-package '${name}' defines disabled attribute '${attribute}', got ${normalizedValue}`,
            severity: DiagnosticSeverity.Error,
          };
        } else if (value !== null && pkg[attribute] === undefined) {
          yield {
            code: '[pkg/attributes-consistency]',
            message: `sub-package '${name}' does not define attribute '${attribute}', expected ${normalizedExpected}`,
            severity: DiagnosticSeverity.Error,
          };
        } else {
          if (normalizedValue !== normalizedExpected) {
            yield {
              code: '[pkg/attributes-consistency]',
              message: `sub-package '${name}' attribute ${attribute} mismatch: got ${normalizedValue}, expected ${normalizedExpected}`,
              severity: DiagnosticSeverity.Error,
            };
          }
        }
      }
    }
  }

  // Make sure that the following attributes have the same values in all sub-packages.
  for (const attribute of [
    'author',
    'browser',
    'bugs',
    'contributors',
    'files',
    'homepage',
    'license',
    'main',
    'module',
    'repository',
    'types',
    'version',
  ]) {
    if (ignoreAttributes.has(attribute) === false) {
      const values: Set<string> = new Set();
      const found: string[] = [];
      for (const { name, pkg } of project.packages) {
        const normalizedValue = JSON.stringify(pkg[attribute]);
        values.add(normalizedValue);
        found.push(`${name}/package.json[${attribute}]=${normalizedValue}`);
      }

      if (values.size !== 1) {
        yield {
          code: '[pkg/attributes-consistency]',
          message: `sub-packages have inconsistent values for attribute ${attribute}: ${found.join(', ')}`,
          severity: DiagnosticSeverity.Error,
        }
      }
    }
  }
}
