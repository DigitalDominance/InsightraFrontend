/**
 * Addresses of the deployed factories and optional global contracts.  These
 * values are pulled from environment variables so that the frontend can be
 * configured without recompiling when deploying to a new network.  The
 * addresses must include the `0x` prefix.  Example `.env.local`:
 *
 * ```
 * NEXT_PUBLIC_BINARY_FACTORY=0x5F23306E9aACbAe41D6ED66De7E78E768603d566
 * NEXT_PUBLIC_CATEGORICAL_FACTORY=0x...
 * NEXT_PUBLIC_SCALAR_FACTORY=0x...
 * NEXT_PUBLIC_BOND_TOKEN=0x...
 * ```
 */

export const BINARY_FACTORY_ADDRESS =
  process.env.NEXT_PUBLIC_BINARY_FACTORY as `0x${string}` | undefined;

export const CATEGORICAL_FACTORY_ADDRESS =
  process.env.NEXT_PUBLIC_CATEGORICAL_FACTORY as `0x${string}` | undefined;

export const SCALAR_FACTORY_ADDRESS =
  process.env.NEXT_PUBLIC_SCALAR_FACTORY as `0x${string}` | undefined;

// Default values for user-submitted market parameters.  These values can be
// provided in your `.env.local` to remove the need for users to enter
// contract addresses on the create page.  If undefined, the create page
// will prompt the user to configure them first.
export const DEFAULT_COLLATERAL =
  process.env.NEXT_PUBLIC_DEFAULT_COLLATERAL as `0x${string}` | undefined;
export const DEFAULT_ORACLE =
  process.env.NEXT_PUBLIC_DEFAULT_ORACLE as `0x${string}` | undefined;
export const DEFAULT_QUESTION_ID =
  process.env.NEXT_PUBLIC_DEFAULT_QUESTION_ID as `0x${string}` | undefined;

// (Optional) the bond token used to pay creation fees; can be undefined if
// your frontend infers it from the factory.
export const BOND_TOKEN_ADDRESS =
  process.env.NEXT_PUBLIC_BOND_TOKEN as `0x${string}` | undefined;

// Export a simple map for easy lookup based on market type
export const FACTORIES: Record<
  'binary' | 'categorical' | 'scalar',
  `0x${string}` | undefined
> = {
  binary: BINARY_FACTORY_ADDRESS,
  categorical: CATEGORICAL_FACTORY_ADDRESS,
  scalar: SCALAR_FACTORY_ADDRESS,
};