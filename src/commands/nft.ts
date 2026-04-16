import { Command } from 'commander';
import { query } from '../client.js';
import { format } from '../output.js';
import { ValidationError, handleError } from '../errors.js';
import { getActiveEndpointName } from '../endpoints.js';
import type { NFTResponse, EthNFTResponse, NFTOptions } from '../types.js';

const GET_NFT_BLOCKTICITY = `
query GetNFT($tokenId: String!, $contract: String!, $network: Network) {
  nft(tokenId: $tokenId, contract: $contract, network: $network) {
    name
    description
    network
    tokenId
    contractAddress
    transactionHash
    metadata {
      description
      name
      externalUrl
      attributes {
        traitType
        value
      }
    }
    blockNumber
    tokenUri
  }
}
`;

const GET_NFT_ETHEREUM = `
query GetNFT($tokenId: TokenId!, $contract: AddressString!) {
  nft(tokenId: $tokenId, contract: $contract) {
    name
    tokenId
    standard
    contract {
      address
      name
      symbol
    }
    metadata {
      uri
      name
      description
      image
      externalUrl
      attributes {
        traitType
        value
      }
    }
  }
}
`;

export function registerNftCommands(parent: Command): void {
  parent
    .command('nft <contract> <tokenId>')
    .description('Get NFT metadata by contract address and token ID')
    .option('--network <network>', 'Network name (for blockticity endpoint, e.g. BTIC)', 'BTIC')
    .option('--yaml', 'Output as YAML instead of JSON')
    .action(async (contract: string, tokenId: string, opts: NFTOptions & { network: string }) => {
      try {
        if (!contract || contract.trim() === '') {
          throw new ValidationError('Contract address is required', 'contract');
        }
        if (!tokenId || tokenId.trim() === '') {
          throw new ValidationError('Token ID is required', 'tokenId');
        }

        const endpoint = getActiveEndpointName();

        if (endpoint === 'blockticity') {
          const variables = { contract, tokenId, network: opts.network };
          const result = await query<NFTResponse['data']>(GET_NFT_BLOCKTICITY, variables);
          console.log(format(result, !!opts.yaml));
        } else {
          const variables = { contract, tokenId };
          const result = await query<EthNFTResponse['data']>(GET_NFT_ETHEREUM, variables);
          console.log(format(result, !!opts.yaml));
        }
      } catch (error) {
        handleError(error);
      }
    });
}
