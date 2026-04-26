import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createAccount, createClient } from "genlayer-js";
import { localnet, studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";
import type {
  TransactionHash,
  GenLayerClient,
  DecodedDeployData,
  GenLayerChain,
} from "genlayer-js/types";

const DEFAULT_RPC_URL =
  process.env.GENLAYER_RPC_URL || "http://127.0.0.1:4000/api";
const DEFAULT_NETWORK = process.env.GENLAYER_NETWORK || "localnet";

function getChain() {
  return DEFAULT_NETWORK === "studionet" ? studionet : localnet;
}

function getAccount() {
  const privateKey = process.env.GENLAYER_PRIVATE_KEY as
    | `0x${string}`
    | undefined;

  return privateKey ? createAccount(privateKey) : createAccount();
}

export default async function main(client: GenLayerClient<any>) {
  const filePath = path.resolve(process.cwd(), "contracts/gen_escrow.py");

  try {
    const contractCode = new Uint8Array(readFileSync(filePath));

    await client.initializeConsensusSmartContract();

    const deployTransaction = await client.deployContract({
      code: contractCode,
      args: [],
    });

    const receipt = await client.waitForTransactionReceipt({
      hash: deployTransaction as TransactionHash,
      status: TransactionStatus.FINALIZED,
      retries: 200,
    });

    if (
      receipt.status !== 5 &&
      receipt.status !== 6 &&
      receipt.statusName !== "ACCEPTED" &&
      receipt.statusName !== "FINALIZED"
    ) {
      throw new Error(`Deployment failed. Receipt: ${JSON.stringify(receipt)}`);
    }

    const deployedContractAddress =
      (client.chain as GenLayerChain).id === localnet.id
        ? receipt.data.contract_address
        : (receipt.txDataDecoded as DecodedDeployData)?.contractAddress;

    console.log(`Contract deployed at address: ${deployedContractAddress}`);
  } catch (error) {
    throw new Error(`Error during deployment:, ${error}`);
  }
}

async function runDirectly() {
  const client = createClient({
    chain: getChain(),
    endpoint: DEFAULT_RPC_URL,
    account: getAccount(),
  });

  await main(client);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  runDirectly().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
