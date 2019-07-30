import { applyFix } from './src/fix';
import loadProject from './src/project';
import { Rule } from './src/rules';

// Rules - dependencies
import checkExternalDependenciesVersions from './src/rules/external-dependencies-versions';
import checkInternalDependenciesVersions from './src/rules/internal-dependencies-versions';

// Rules - packages
import checkPackageAttributesConsistency from './src/rules/package-attributes-consistency';
import checkPackageAttributesMandatory from './src/rules/package-attributes-mandatory';
import checkPackageFolderName from './src/rules/package-folder-name';
import checkPackageNamespaceConsistency from './src/rules/package-namespace-consistency';

// Rules - lerna
import checkLernaAttributes from './src/rules/lerna-unknown-attributes';
import checkLernaWorkspaces from './src/rules/lerna-workspaces';

// Rule - license
import { checkLicenses } from './src/licences';

async function main() {
  const project = await loadProject();
  const rules: Rule[] = [
    checkInternalDependenciesVersions,
    checkExternalDependenciesVersions,
    checkPackageFolderName,
    checkPackageNamespaceConsistency,
    checkPackageAttributesConsistency,
    checkPackageAttributesMandatory,
    checkLernaWorkspaces,
    checkLernaAttributes,
  ];

  // TODO - make optional
  for await (const diagnostic of checkLicenses(project)) {
    console.log(`- ${diagnostic.code} ${diagnostic.message}`);
    if (diagnostic.fix !== undefined) {
      console.log('  ~ auto-fixing!');
      await applyFix(diagnostic.fix);
    }
  }

  console.log();
  console.log('start linting...');
  for (const rule of rules) {
    for (const diagnostic of rule(project)) {
      console.log(`- ${diagnostic.code} ${diagnostic.message}`);
      if (diagnostic.fix !== undefined) {
        console.log('  ~ auto-fixing!');
        await applyFix(diagnostic.fix);
      }
    }
  }
}

main();
