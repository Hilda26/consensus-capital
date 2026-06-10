export const GENLAYER_STUDIONET = {
  name: "GenLayer Studionet",
  chainId: 61999,
  rpcUrl: "https://studio.genlayer.com/api",
  currency: "GEN",
  explorerUrl: "https://explorer-studio.genlayer.com",
} as const;

export const CONSENSUS_CAPITAL_CONTRACT =
  process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS ?? "";

export const isContractConfigured = (): boolean =>
  CONSENSUS_CAPITAL_CONTRACT.length > 0;

export const NOT_CONFIGURED_MESSAGE =
  "ConsensusCapital contract is not configured yet.\nDeploy the GenLayer contract and add NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS to enable live opportunity reviews.";
