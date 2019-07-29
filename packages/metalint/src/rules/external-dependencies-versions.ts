import { iterDependencies, Project } from '../project';
import { Diagnostic, DiagnosticSeverity } from '../rules';

type VersionBounds = Map<string, Array<{ workspace: string; version: string }>>;

function collectVersions(project: Project): VersionBounds {
  const versionBounds: VersionBounds = new Map();

  for (const {
    pkg,
    version,
    workspace: { name },
  } of iterDependencies(project)) {
    let versions = versionBounds.get(pkg);
    if (versions === undefined) {
      versions = [];
      versionBounds.set(pkg, versions);
    }

    versions.push({
      version,
      workspace: name,
    });
  }

  return versionBounds;
}

/**
 * Check that external dependencies from all 'package.json' have the exact same version
 */
export default function* externalDependenciesVersions(
  project: Project,
): IterableIterator<Diagnostic> {
  for (const [pkg, versions] of collectVersions(project)) {
    if (versions.every(({ version }) => version === versions[0].version) === false) {
      yield {
        code: '[deps/external]',
        message: `found multiple versions of ${pkg}: ${versions
          .map(({ workspace, version }) => `${workspace}="${version}"`)
          .join(', ')}`,
        severity: DiagnosticSeverity.Error,
      };
    }
  }
}
