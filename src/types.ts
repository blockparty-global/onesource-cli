// GraphQL response types for OneSource API

export interface GraphQLResponse<T = Record<string, unknown>> {
  data?: T;
  errors?: GraphQLError[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GraphQLQueryVariables = Record<string, any>;

export interface GraphQLError {
  message: string;
  locations?: Array<{
    line: number;
    column: number;
  }>;
  path?: (string | number)[];
  extensions?: Record<string, unknown>;
}

export interface PageInfo {
  hasNextPage: boolean;
  endCursor: string;
  count: number;
}

export interface PaginatedResponse<T> {
  totalCount: number;
  pageInfo: PageInfo;
  entries: T[];
}

// Address type
export interface Address {
  address: string;
}

// Value type (for currency amounts)
export interface Value {
  raw: string;
  formatted: string;
  decimals: number;
}

// Gas information
export interface Gas {
  limit: number;
  price?: number;
  used?: number;
  feeCap?: number;
  tipCap?: number;
}

// Block types
export interface Block {
  number: number;
  hash: string;
  timestamp: string;
  transactionCount: number;
  gasUsed: number;
  gasLimit: number;
  difficulty: string;
  size: number;
  confirmations: number;
}

export type BlocksResponse = PaginatedResponse<Block>;

// Transaction types
export interface Transaction {
  hash: string;
  timestamp: string;
  from: Address;
  to?: Address;
  value: Value;
  gas: Gas;
  nonce: number;
  confirmations: number;
  status: 'SUCCESS' | 'FAILED';
  block: {
    number: number;
    hash?: string;
    timestamp?: string;
  };
  contractCreated?: {
    address: string;
    name?: string;
  };
}

export interface TransactionStats {
  totalCount: number;
  totalValue: Value;
  averageGasPrice: number;
  averageGasUsed: number;
  uniqueAddresses: number;
}

export interface TransactionsResponse extends PaginatedResponse<Transaction> {
  stats: TransactionStats;
}

// NFT types
export interface NFTAttribute {
  traitType: string;
  value: string | number | boolean;
}

export interface NFTMetadata {
  description?: string;
  name?: string;
  externalUrl?: string;
  attributes?: NFTAttribute[];
}

export interface NFT {
  name?: string;
  description?: string;
  network: string;
  tokenId: string;
  contractAddress: string;
  transactionHash: string;
  metadata?: NFTMetadata;
  blockNumber: number;
  tokenUri?: string;
}

// Ethereum endpoint NFT types
export interface EthNFTMetadata {
  uri?: string;
  name?: string;
  description?: string;
  image?: string;
  externalUrl?: string;
  attributes?: NFTAttribute[];
}

export interface EthNFTContract {
  address: string;
  name?: string;
  symbol?: string;
}

export interface EthNFT {
  name?: string;
  tokenId: string;
  standard: string;
  contract: EthNFTContract;
  metadata?: EthNFTMetadata;
}

// API Response types
export type BlockResponse = GraphQLResponse<{ block: Block }>;
export type BlocksListResponse = GraphQLResponse<{ blocks: BlocksResponse }>;
export type TransactionResponse = GraphQLResponse<{ transaction: Transaction }>;
export type TransactionsListResponse = GraphQLResponse<{ transactions: TransactionsResponse }>;
export type NFTResponse = GraphQLResponse<{ nft: NFT }>;
export type EthNFTResponse = GraphQLResponse<{ nft: EthNFT }>;

// Command option types
export interface CommonOptions {
  yaml?: boolean;
}

export interface PaginationOptions {
  first?: string;
  after?: string;
  orderBy?: string;
  order?: string;
}

export interface BlockOptions extends CommonOptions {
  hash?: string;
}

export interface BlocksOptions extends CommonOptions, PaginationOptions {
  numberMin?: string;
  numberMax?: string;
}

export type TransactionOptions = CommonOptions;

export interface TransactionsOptions extends CommonOptions, PaginationOptions {
  from?: string;
  to?: string;
  blockMin?: string;
  blockMax?: string;
  status?: string;
}

export interface NFTOptions extends CommonOptions {
  network?: string;
}
