import { Command } from 'commander';
import { query } from '../client.js';
import { format } from '../output.js';
import { ValidationError, handleError } from '../errors.js';
import type { NFTResponse, NFTOptions } from '../types.js';

const GET_NFT = `
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

export function registerNftCommands(parent: Command): void {
  parent
    .command('nft <contract> <tokenId>')
    .description('Get NFT metadata by contract address and token ID')
    .option('--network <network>', 'Network name (e.g. BTIC)', 'BTIC')
    .option('--yaml', 'Output as YAML instead of JSON')
    .action(async (contract: string, tokenId: string, opts: NFTOptions & { network: string }) => {
      try {
        if (!contract || contract.trim() === '') {
          throw new ValidationError('Contract address is required', 'contract');
        }
        if (!tokenId || tokenId.trim() === '') {
          throw new ValidationError('Token ID is required', 'tokenId');
        }

        const variables = {
          contract,
          tokenId,
          network: opts.network,
        };

        const result = await query<NFTResponse['data']>(GET_NFT, variables);
        console.log(format(result, !!opts.yaml));
      } catch (error) {
        handleError(error);
      }
    });
}
