import { Command } from 'commander';
import * as client from '../client.js';
import { format } from '../output.js';

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
    .action(async (contract: string, tokenId: string, opts: { network: string; yaml?: boolean }) => {
      const variables = {
        contract,
        tokenId,
        network: opts.network,
      };

      const result = await client.query(GET_NFT, variables);
      console.log(format(result, !!opts.yaml));
    });
}
