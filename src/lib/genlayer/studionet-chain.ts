import { GENLAYER_STUDIONET } from "./config";

export const STUDIONET_CHAIN = {
  id: GENLAYER_STUDIONET.chainId,
  name: GENLAYER_STUDIONET.name,
  nativeCurrency: { name: GENLAYER_STUDIONET.currency, symbol: GENLAYER_STUDIONET.currency, decimals: 18 },
  rpcUrls: {
    default: { http: [GENLAYER_STUDIONET.rpcUrl] },
    public: { http: [GENLAYER_STUDIONET.rpcUrl] },
  },
  blockExplorers: {
    default: { name: "GenLayer Explorer", url: GENLAYER_STUDIONET.explorerUrl },
  },
} as const;

export const STUDIONET_HEX = "0x" + GENLAYER_STUDIONET.chainId.toString(16);
