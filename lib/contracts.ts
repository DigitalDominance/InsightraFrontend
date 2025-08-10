/**
 * Network & contract addresses are injected via environment variables.
 * Provide them in `.env.local` for your deployment:
 *
 * NEXT_PUBLIC_BINARY_FACTORY=0x...
 * NEXT_PUBLIC_CATEGORICAL_FACTORY=0x...
 * NEXT_PUBLIC_SCALAR_FACTORY=0x...
 * NEXT_PUBLIC_DEFAULT_COLLATERAL=0x...
 * NEXT_PUBLIC_DEFAULT_ORACLE=0x...
 * NEXT_PUBLIC_DEFAULT_QUESTION_ID=0x0000000000000000000000000000000000000000000000000000000000000000
 * NEXT_PUBLIC_BOND_TOKEN=0x...
 */

export const BINARY_FACTORY_ADDRESS =
  process.env.NEXT_PUBLIC_BINARY_FACTORY as `0x${string}` | undefined;

export const CATEGORICAL_FACTORY_ADDRESS =
  process.env.NEXT_PUBLIC_CATEGORICAL_FACTORY as `0x${string}` | undefined;

export const SCALAR_FACTORY_ADDRESS =
  process.env.NEXT_PUBLIC_SCALAR_FACTORY as `0x${string}` | undefined;

export const DEFAULT_COLLATERAL =
  process.env.NEXT_PUBLIC_DEFAULT_COLLATERAL as `0x${string}` | undefined;

export const DEFAULT_ORACLE =
  process.env.NEXT_PUBLIC_DEFAULT_ORACLE as `0x${string}` | undefined;

export const DEFAULT_QUESTION_ID =
  process.env.NEXT_PUBLIC_DEFAULT_QUESTION_ID as `0x${string}` | undefined;

export const BOND_TOKEN_ADDRESS =
  process.env.NEXT_PUBLIC_BOND_TOKEN as `0x${string}` | undefined;

export const FACTORIES: Record<'binary' | 'categorical' | 'scalar', `0x${string}` | undefined> = {
  binary: BINARY_FACTORY_ADDRESS,
  categorical: CATEGORICAL_FACTORY_ADDRESS,
  scalar: SCALAR_FACTORY_ADDRESS,
};
