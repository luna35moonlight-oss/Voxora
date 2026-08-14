/**
 * DEVELOPMENT TEST ASSET — NOT VOXORA PRODUCTION ART
 *
 * The binary `.riv` is intentionally NOT committed. Redistribution rights for
 * community-hosted Rive files are not a Voxora ownership grant. Runtime validation
 * loads the officially documented public Rive community URL at test/dev time only.
 */

export const RIVE_DEV_TEST_ASSET = {
  marker: 'DEVELOPMENT TEST ASSET — NOT VOXORA PRODUCTION ART' as const,
  assetName: 'Avatar Pack Use Case',
  originalSource: 'Rive Community / official React Native runtime documentation example',
  sourceUrl: 'https://public.rive.app/community/runtime-files/2195-4346-avatar-pack-use-case.riv',
  communityFileId: '2195-4346',
  creatorOrOwner: 'Rive community example (not Voxora-owned)',
  licenceOrUsage:
    'Used only as a development/runtime validation reference via the public Rive CDN URL. ' +
    'Not redistributed in this repository. Not represented as Voxora production artwork. ' +
    'Replace with licensed Voxora-owned `.riv` assets before production release.',
  redistributionInRepositoryPermitted: false,
  repositoryLocation: 'Metadata only: apps/mobile/src/scene/riveDevAsset.ts (binary not committed)',
  whySafeForDevelopmentValidation:
    'Loaded from Rive’s public community runtime CDN for documented runtime examples; ' +
    'no third-party binary is copied into the Voxora repository; clearly marked non-production.',
  replacementRequirementForProduction:
    'Supply Voxora-owned production `.riv` assets that satisfy conductor/rive-production-asset-contract.md',
  artboardName: 'Avatar 1',
  stateMachineName: 'avatar',
  knownBooleanInputs: ['isHappy', 'isSad'] as const,
  notes:
    'This third-party asset does not implement the Voxora production state-machine contract. ' +
    'See riveStateAdapter.ts for the documented mapping between Voxora runtime states and this asset’s inputs.',
} as const;

export type RiveDevTestAsset = typeof RIVE_DEV_TEST_ASSET;
