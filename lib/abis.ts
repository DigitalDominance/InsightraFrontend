/**
 * Minimal ABIs required by the frontend to interact with the Insightra
 * prediction market contracts.  These definitions avoid the overhead of
 * importing full artifact JSONs and enable tree‑shaking for smaller
 * bundles.
 */

// Full ERC20 interface.  While the OutcomeToken contracts only implement
// mint/burn externally, using the full ERC20 ABI here allows common UI
// helpers (balanceOf, transfer, approve, allowance) to work with any
// ERC20‑compatible collateral or bond token.  The `decimals` and
// `symbol` functions are needed to render human‑readable amounts.  Note:
// outcome tokens also implement mint/burn via their market; those
// functions are not included here because only the market may call them.
export const ERC20_ABI = [
  { type: 'function', name: 'decimals', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
  { type: 'function', name: 'symbol',   stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { type: 'function', name: 'name',     stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { type: 'function', name: 'totalSupply', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'balanceOf', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'allowance', stateMutability: 'view', inputs: [ { name: 'owner', type: 'address' }, { name: 'spender', type: 'address' } ], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'approve', stateMutability: 'nonpayable', inputs: [ { name: 'spender', type: 'address' }, { name: 'value', type: 'uint256' } ], outputs: [{ type: 'bool' }] },
  { type: 'function', name: 'transfer', stateMutability: 'nonpayable', inputs: [ { name: 'to', type: 'address' }, { name: 'value', type: 'uint256' } ], outputs: [{ type: 'bool' }] },
  { type: 'function', name: 'transferFrom', stateMutability: 'nonpayable', inputs: [ { name: 'from', type: 'address' }, { name: 'to', type: 'address' }, { name: 'value', type: 'uint256' } ], outputs: [{ type: 'bool' }] },
  { type: 'event', name: 'Transfer', inputs: [ { indexed: true, name: 'from', type: 'address' }, { indexed: true, name: 'to', type: 'address' }, { indexed: false, name: 'value', type: 'uint256' } ] },
  { type: 'event', name: 'Approval', inputs: [ { indexed: true, name: 'owner', type: 'address' }, { indexed: true, name: 'spender', type: 'address' }, { indexed: false, name: 'value', type: 'uint256' } ] },
] as const;

// Base factory interface shared by Binary, Categorical and Scalar factories.  This
// ABI includes registry helpers and DAO moderation functions in addition to
// immutable configuration variables.  See FactoryBase.sol for details.
export const FACTORY_BASE_ABI = [
  // Immutable configuration
  { type: 'function', name: 'feeSink', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
  { type: 'function', name: 'bondToken', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
  { type: 'function', name: 'creationFee', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'defaultRedeemFeeBps', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  // Market registry
  { type: 'function', name: 'marketCount', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'allMarkets', stateMutability: 'view', inputs: [ { type: 'uint256', name: 'index' } ], outputs: [{ type: 'address' }] },
  { type: 'function', name: 'isMarket', stateMutability: 'view', inputs: [ { type: 'address', name: 'market' } ], outputs: [{ type: 'bool' }] },
  { type: 'function', name: 'isRemoved', stateMutability: 'view', inputs: [ { type: 'address', name: 'market' } ], outputs: [{ type: 'bool' }] },
  // DAO moderation
  { type: 'function', name: 'setDefaultRedeemFeeBps', stateMutability: 'nonpayable', inputs: [ { type: 'uint256', name: 'bps' } ], outputs: [] },
  { type: 'function', name: 'removeListing', stateMutability: 'nonpayable', inputs: [ { type: 'address', name: 'market' }, { type: 'string', name: 'reason' } ], outputs: [] },
  { type: 'function', name: 'restoreListing', stateMutability: 'nonpayable', inputs: [ { type: 'address', name: 'market' } ], outputs: [] },
  // Events
  { type: 'event', name: 'DefaultRedeemFeeUpdated', inputs: [ { indexed: false, name: 'bps', type: 'uint256' } ] },
  { type: 'event', name: 'MarketRegistered', inputs: [ { indexed: true, name: 'market', type: 'address' } ] },
  { type: 'event', name: 'ListingRemoved', inputs: [ { indexed: true, name: 'market', type: 'address' }, { indexed: false, name: 'reason', type: 'string' } ] },
  { type: 'event', name: 'ListingRestored', inputs: [ { indexed: true, name: 'market', type: 'address' } ] },
] as const;

// Binary factory ABI – extends the base with create/submit.  The owner‑only
// `createBinary` is exposed for governance; regular users call
// `submitBinary` after paying the creation fee.  A `BinaryCreated` event
// announces the new market and its questionId.  See BinaryFactory.sol.
export const BINARY_FACTORY_ABI = [
  ...FACTORY_BASE_ABI,
  { type: 'function', name: 'createBinary', stateMutability: 'nonpayable', inputs: [ { name: 'collateral', type: 'address' }, { name: 'oracle', type: 'address' }, { name: 'questionId', type: 'bytes32' }, { name: 'marketName', type: 'string' } ], outputs: [ { type: 'address' } ] },
  { type: 'function', name: 'submitBinary', stateMutability: 'nonpayable', inputs: [ { name: 'collateral', type: 'address' }, { name: 'oracle', type: 'address' }, { name: 'questionId', type: 'bytes32' }, { name: 'marketName', type: 'string' } ], outputs: [ { type: 'address' } ] },
  { type: 'event', name: 'BinaryCreated', inputs: [ { indexed: false, name: 'market', type: 'address' }, { indexed: false, name: 'questionId', type: 'bytes32' } ] },
] as const;

// Categorical factory ABI – extends the base with create/submit.  The
// `createCategorical` function is restricted to the owner; regular users
// call `submitCategorical` to pay the creation fee.  A
// `CategoricalCreated` event signals the new market and its questionId.
export const CATEGORICAL_FACTORY_ABI = [
  ...FACTORY_BASE_ABI,
  { type: 'function', name: 'createCategorical', stateMutability: 'nonpayable', inputs: [ { name: 'collateral', type: 'address' }, { name: 'oracle', type: 'address' }, { name: 'questionId', type: 'bytes32' }, { name: 'marketName', type: 'string' }, { name: 'numOutcomes', type: 'uint8' }, { name: 'outcomeNames', type: 'string[]' } ], outputs: [ { type: 'address' } ] },
  { type: 'function', name: 'submitCategorical', stateMutability: 'nonpayable', inputs: [ { name: 'collateral', type: 'address' }, { name: 'oracle', type: 'address' }, { name: 'questionId', type: 'bytes32' }, { name: 'marketName', type: 'string' }, { name: 'numOutcomes', type: 'uint8' }, { name: 'outcomeNames', type: 'string[]' } ], outputs: [ { type: 'address' } ] },
  { type: 'event', name: 'CategoricalCreated', inputs: [ { indexed: false, name: 'market', type: 'address' }, { indexed: false, name: 'questionId', type: 'bytes32' } ] },
] as const;

// Scalar factory ABI – extends the base with create/submit.  A scalar market
// uses LONG/SHORT tokens; the `scalarDecimals` value is purely
// informational (no on‑chain math uses it).  A `ScalarCreated` event
// contains the new market address and questionId.
export const SCALAR_FACTORY_ABI = [
  ...FACTORY_BASE_ABI,
  { type: 'function', name: 'createScalar', stateMutability: 'nonpayable', inputs: [ { name: 'collateral', type: 'address' }, { name: 'oracle', type: 'address' }, { name: 'questionId', type: 'bytes32' }, { name: 'marketName', type: 'string' }, { name: 'scalarMin', type: 'int256' }, { name: 'scalarMax', type: 'int256' }, { name: 'scalarDecimals', type: 'uint32' } ], outputs: [ { type: 'address' } ] },
  { type: 'function', name: 'submitScalar', stateMutability: 'nonpayable', inputs: [ { name: 'collateral', type: 'address' }, { name: 'oracle', type: 'address' }, { name: 'questionId', type: 'bytes32' }, { name: 'marketName', type: 'string' }, { name: 'scalarMin', type: 'int256' }, { name: 'scalarMax', type: 'int256' }, { name: 'scalarDecimals', type: 'uint32' } ], outputs: [ { type: 'address' } ] },
  { type: 'event', name: 'ScalarCreated', inputs: [ { indexed: false, name: 'market', type: 'address' }, { indexed: false, name: 'questionId', type: 'bytes32' } ] },
] as const;

// Binary market ABI – full surface used by the frontend.  Includes both
// pre‑resolution (split/merge) and post‑resolution (redeem) flows as well
// as public variables from MarketBase.
export const BINARY_MARKET_ABI = [
  // Pre‑resolution
  { type: 'function', name: 'split', stateMutability: 'nonpayable', inputs: [ { name: 'amount', type: 'uint256' } ], outputs: [] },
  { type: 'function', name: 'merge', stateMutability: 'nonpayable', inputs: [ { name: 'sets', type: 'uint256' } ], outputs: [] },
  // Settlement
  { type: 'function', name: 'finalizeFromOracle', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  { type: 'function', name: 'redeem', stateMutability: 'nonpayable', inputs: [ { name: 'amount', type: 'uint256' } ], outputs: [ { type: 'uint256' } ] },
  // Views
  { type: 'function', name: 'isResolved', stateMutability: 'view', inputs: [], outputs: [ { type: 'bool' } ] },
  { type: 'function', name: 'marketType', stateMutability: 'view', inputs: [], outputs: [ { type: 'uint8' } ] },
  { type: 'function', name: 'yesToken', stateMutability: 'view', inputs: [], outputs: [ { type: 'address' } ] },
  { type: 'function', name: 'noToken',  stateMutability: 'view', inputs: [], outputs: [ { type: 'address' } ] },
  { type: 'function', name: 'outcomeYes', stateMutability: 'view', inputs: [], outputs: [ { type: 'bool' } ] },
  // MarketBase variables
  { type: 'function', name: 'collateral', stateMutability: 'view', inputs: [], outputs: [ { type: 'address' } ] },
  { type: 'function', name: 'oracle', stateMutability: 'view', inputs: [], outputs: [ { type: 'address' } ] },
  { type: 'function', name: 'questionId', stateMutability: 'view', inputs: [], outputs: [ { type: 'bytes32' } ] },
  { type: 'function', name: 'status', stateMutability: 'view', inputs: [], outputs: [ { type: 'uint8' } ] },
  { type: 'function', name: 'redeemFeeBps', stateMutability: 'view', inputs: [], outputs: [ { type: 'uint256' } ] },
  { type: 'function', name: 'feeSink', stateMutability: 'view', inputs: [], outputs: [ { type: 'address' } ] },
  { type: 'function', name: 'collateralLocked', stateMutability: 'view', inputs: [], outputs: [ { type: 'uint256' } ] },
  { type: 'function', name: 'resolvedAt', stateMutability: 'view', inputs: [], outputs: [ { type: 'uint256' } ] },
  { type: 'function', name: 'resolvedAnswer', stateMutability: 'view', inputs: [], outputs: [ { type: 'bytes' } ] },
  // Events
  { type: 'event', name: 'Split', inputs: [ { indexed: true, name: 'user', type: 'address' }, { indexed: false, name: 'collateralIn', type: 'uint256' } ] },
  { type: 'event', name: 'Merge', inputs: [ { indexed: true, name: 'user', type: 'address' }, { indexed: false, name: 'setsBurned', type: 'uint256' } ] },
  { type: 'event', name: 'Finalized', inputs: [ { indexed: true, name: 'questionId', type: 'bytes32' }, { indexed: false, name: 'encodedOutcome', type: 'bytes' } ] },
  { type: 'event', name: 'Redeemed', inputs: [ { indexed: true, name: 'user', type: 'address' }, { indexed: false, name: 'collateralOut', type: 'uint256' }, { indexed: false, name: 'meta', type: 'bytes' } ] },
  { type: 'event', name: 'Cancelled', inputs: [ { indexed: true, name: 'questionId', type: 'bytes32' } ] },
] as const;

// Categorical market ABI – includes split/merge/redeem, outcome helpers and
// MarketBase variables.  See CategoricalMarket.sol for implementation
export const CATEGORICAL_MARKET_ABI = [
  { type: 'function', name: 'split', stateMutability: 'nonpayable', inputs: [ { name: 'amount', type: 'uint256' } ], outputs: [] },
  { type: 'function', name: 'merge', stateMutability: 'nonpayable', inputs: [ { name: 'sets', type: 'uint256' } ], outputs: [] },
  { type: 'function', name: 'finalizeFromOracle', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  { type: 'function', name: 'redeem', stateMutability: 'nonpayable', inputs: [ { name: 'amount', type: 'uint256' } ], outputs: [ { type: 'uint256' } ] },
  { type: 'function', name: 'isResolved', stateMutability: 'view', inputs: [], outputs: [ { type: 'bool' } ] },
  { type: 'function', name: 'marketType', stateMutability: 'view', inputs: [], outputs: [ { type: 'uint8' } ] },
  { type: 'function', name: 'outcomeCount', stateMutability: 'view', inputs: [], outputs: [ { type: 'uint8' } ] },
  { type: 'function', name: 'winner', stateMutability: 'view', inputs: [], outputs: [ { type: 'uint8' } ] },
  { type: 'function', name: 'tokens', stateMutability: 'view', inputs: [ { name: 'idx', type: 'uint8' } ], outputs: [ { type: 'address' } ] },
  // MarketBase variables
  { type: 'function', name: 'collateral', stateMutability: 'view', inputs: [], outputs: [ { type: 'address' } ] },
  { type: 'function', name: 'oracle', stateMutability: 'view', inputs: [], outputs: [ { type: 'address' } ] },
  { type: 'function', name: 'questionId', stateMutability: 'view', inputs: [], outputs: [ { type: 'bytes32' } ] },
  { type: 'function', name: 'status', stateMutability: 'view', inputs: [], outputs: [ { type: 'uint8' } ] },
  { type: 'function', name: 'redeemFeeBps', stateMutability: 'view', inputs: [], outputs: [ { type: 'uint256' } ] },
  { type: 'function', name: 'feeSink', stateMutability: 'view', inputs: [], outputs: [ { type: 'address' } ] },
  { type: 'function', name: 'collateralLocked', stateMutability: 'view', inputs: [], outputs: [ { type: 'uint256' } ] },
  { type: 'function', name: 'resolvedAt', stateMutability: 'view', inputs: [], outputs: [ { type: 'uint256' } ] },
  { type: 'function', name: 'resolvedAnswer', stateMutability: 'view', inputs: [], outputs: [ { type: 'bytes' } ] },
  // Events
  { type: 'event', name: 'Split', inputs: [ { indexed: true, name: 'user', type: 'address' }, { indexed: false, name: 'collateralIn', type: 'uint256' } ] },
  { type: 'event', name: 'Merge', inputs: [ { indexed: true, name: 'user', type: 'address' }, { indexed: false, name: 'setsBurned', type: 'uint256' } ] },
  { type: 'event', name: 'Finalized', inputs: [ { indexed: true, name: 'questionId', type: 'bytes32' }, { indexed: false, name: 'encodedOutcome', type: 'bytes' } ] },
  { type: 'event', name: 'Redeemed', inputs: [ { indexed: true, name: 'user', type: 'address' }, { indexed: false, name: 'collateralOut', type: 'uint256' }, { indexed: false, name: 'meta', type: 'bytes' } ] },
  { type: 'event', name: 'Cancelled', inputs: [ { indexed: true, name: 'questionId', type: 'bytes32' } ] },
] as const;

// Scalar market ABI – covers split/merge, long/short redemption and
// configuration getters.  See ScalarMarket.sol for details.
export const SCALAR_MARKET_ABI = [
  // Pre‑resolution
  { type: 'function', name: 'split', stateMutability: 'nonpayable', inputs: [ { name: 'amount', type: 'uint256' } ], outputs: [] },
  { type: 'function', name: 'merge', stateMutability: 'nonpayable', inputs: [ { name: 'sets', type: 'uint256' } ], outputs: [] },
  // Settlement
  { type: 'function', name: 'finalizeFromOracle', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  { type: 'function', name: 'redeemLong', stateMutability: 'nonpayable', inputs: [ { name: 'amount', type: 'uint256' } ], outputs: [ { type: 'uint256' } ] },
  { type: 'function', name: 'redeemShort', stateMutability: 'nonpayable', inputs: [ { name: 'amount', type: 'uint256' } ], outputs: [ { type: 'uint256' } ] },
  { type: 'function', name: 'isResolved', stateMutability: 'view', inputs: [], outputs: [ { type: 'bool' } ] },
  { type: 'function', name: 'marketType', stateMutability: 'view', inputs: [], outputs: [ { type: 'uint8' } ] },
  // Views
  { type: 'function', name: 'longToken', stateMutability: 'view', inputs: [], outputs: [ { type: 'address' } ] },
  { type: 'function', name: 'shortToken', stateMutability: 'view', inputs: [], outputs: [ { type: 'address' } ] },
  { type: 'function', name: 'scalarMin', stateMutability: 'view', inputs: [], outputs: [ { type: 'int256' } ] },
  { type: 'function', name: 'scalarMax', stateMutability: 'view', inputs: [], outputs: [ { type: 'int256' } ] },
  { type: 'function', name: 'scalarDecimals', stateMutability: 'view', inputs: [], outputs: [ { type: 'uint32' } ] },
  { type: 'function', name: 'resolvedValue', stateMutability: 'view', inputs: [], outputs: [ { type: 'int256' } ] },
  { type: 'function', name: 'fNumerator', stateMutability: 'view', inputs: [], outputs: [ { type: 'uint256' } ] },
  // MarketBase variables
  { type: 'function', name: 'collateral', stateMutability: 'view', inputs: [], outputs: [ { type: 'address' } ] },
  { type: 'function', name: 'oracle', stateMutability: 'view', inputs: [], outputs: [ { type: 'address' } ] },
  { type: 'function', name: 'questionId', stateMutability: 'view', inputs: [], outputs: [ { type: 'bytes32' } ] },
  { type: 'function', name: 'status', stateMutability: 'view', inputs: [], outputs: [ { type: 'uint8' } ] },
  { type: 'function', name: 'redeemFeeBps', stateMutability: 'view', inputs: [], outputs: [ { type: 'uint256' } ] },
  { type: 'function', name: 'feeSink', stateMutability: 'view', inputs: [], outputs: [ { type: 'address' } ] },
  { type: 'function', name: 'collateralLocked', stateMutability: 'view', inputs: [], outputs: [ { type: 'uint256' } ] },
  { type: 'function', name: 'resolvedAt', stateMutability: 'view', inputs: [], outputs: [ { type: 'uint256' } ] },
  { type: 'function', name: 'resolvedAnswer', stateMutability: 'view', inputs: [], outputs: [ { type: 'bytes' } ] },
  // Events
  { type: 'event', name: 'Split', inputs: [ { indexed: true, name: 'user', type: 'address' }, { indexed: false, name: 'collateralIn', type: 'uint256' } ] },
  { type: 'event', name: 'Merge', inputs: [ { indexed: true, name: 'user', type: 'address' }, { indexed: false, name: 'setsBurned', type: 'uint256' } ] },
  { type: 'event', name: 'Finalized', inputs: [ { indexed: true, name: 'questionId', type: 'bytes32' }, { indexed: false, name: 'encodedOutcome', type: 'bytes' } ] },
  { type: 'event', name: 'Redeemed', inputs: [ { indexed: true, name: 'user', type: 'address' }, { indexed: false, name: 'collateralOut', type: 'uint256' }, { indexed: false, name: 'meta', type: 'bytes' } ] },
  { type: 'event', name: 'Cancelled', inputs: [ { indexed: true, name: 'questionId', type: 'bytes32' } ] },
] as const;


// Minimal KasOracle ABI needed for question creation flow
export const KAS_ORACLE_ABI = [
  // views
  { type: 'function', name: 'questionFee', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'bondToken', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
  // public create (returns id)
  {
    type: 'function',
    name: 'createQuestionPublic',
    stateMutability: 'nonpayable',
    inputs: [
      {
        type: 'tuple',
        name: 'p',
        components: [
          { type: 'uint8',  name: 'qtype' },
          { type: 'uint32', name: 'options' },
          { type: 'int256', name: 'scalarMin' },
          { type: 'int256', name: 'scalarMax' },
          { type: 'uint32', name: 'scalarDecimals' },
          { type: 'uint32', name: 'timeout' },
          { type: 'uint8',  name: 'bondMultiplier' },
          { type: 'uint8',  name: 'maxRounds' },
          { type: 'bytes32',name: 'templateHash' },
          { type: 'string', name: 'dataSource' },
          { type: 'address',name: 'consumer' },
          { type: 'uint64', name: 'openingTs' }
        ]
      },
      { type: 'bytes32', name: 'salt' }
    ],
    outputs: [{ type: 'bytes32' }]
  },
  // events
  {
    type: 'event',
    name: 'QuestionCreated',
    inputs: [
      { indexed: true, name: 'id', type: 'bytes32' },
      { indexed: false, name: 'params', type: 'tuple', components: [
        { type: 'uint8',  name: 'qtype' },
        { type: 'uint32', name: 'options' },
        { type: 'int256', name: 'scalarMin' },
        { type: 'int256', name: 'scalarMax' },
        { type: 'uint32', name: 'scalarDecimals' },
        { type: 'uint32', name: 'timeout' },
        { type: 'uint8',  name: 'bondMultiplier' },
        { type: 'uint8',  name: 'maxRounds' },
        { type: 'bytes32',name: 'templateHash' },
        { type: 'string', name: 'dataSource' },
        { type: 'address',name: 'consumer' },
        { type: 'uint64', name: 'openingTs' }
      ] }
    ]
  }
] as const;
