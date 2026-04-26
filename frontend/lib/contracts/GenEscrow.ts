import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import type { Job, TransactionReceipt } from "./types";

class GenEscrowContract {
  private contractAddress: `0x${string}`;
  private client: ReturnType<typeof createClient>;

  constructor(
    contractAddress: string,
    address?: string | null,
    studioUrl?: string
  ) {
    this.contractAddress = contractAddress as `0x${string}`;

    const config: any = {
      chain: studionet,
    };

    if (address) {
      config.account = address as `0x${string}`;
    }

    if (studioUrl) {
      config.endpoint = studioUrl;
    }

    this.client = createClient(config);
  }

  updateAccount(address: string): void {
    const config: any = {
      chain: studionet,
      account: address as `0x${string}`,
    };
    this.client = createClient(config);
  }

  async getJobs(): Promise<Job[]> {
    try {
      const jobsDict: any = await this.client.readContract({
        address: this.contractAddress,
        functionName: "get_all_jobs",
        args: [],
      });

      if (jobsDict && typeof jobsDict === 'object' && !(jobsDict instanceof Map)) {
         // handle as simple dictionary if dict is returned
         return Object.values(jobsDict) as Job[];
      }

      if (jobsDict instanceof Map) {
        return Array.from(jobsDict.values()).map((v: any) => {
            const obj = Array.from((v as any).entries()).reduce((acc: any, [key, val]: any) => {
                acc[key] = val;
                return acc;
            }, {});
            return obj as Job;
        });
      }

      return [];
    } catch (error) {
      console.error("Error fetching jobs:", error);
      throw new Error("Failed to fetch jobs");
    }
  }

  async createJob(jobId: string, description: string, criteria: string, deadline: string, amount: string): Promise<TransactionReceipt> {
      const txHash = await this.client.writeContract({
        address: this.contractAddress,
        functionName: "create_job",
        args: [jobId, description, criteria, deadline, amount],
        value: BigInt(0),
      });

      return await this.client.waitForTransactionReceipt({ hash: txHash, status: "ACCEPTED" as any, retries: 24, interval: 5000 }) as TransactionReceipt;
  }
  
  async acceptJob(jobId: string): Promise<TransactionReceipt> {
      const txHash = await this.client.writeContract({
        address: this.contractAddress,
        functionName: "accept_job",
        args: [jobId],
        value: BigInt(0),
      });
      return await this.client.waitForTransactionReceipt({ hash: txHash, status: "ACCEPTED" as any, retries: 24, interval: 5000 }) as TransactionReceipt;
  }

  async submitWork(jobId: string, url: string): Promise<TransactionReceipt> {
      const txHash = await this.client.writeContract({
        address: this.contractAddress,
        functionName: "submit_work",
        args: [jobId, url],
        value: BigInt(0),
      });
      return await this.client.waitForTransactionReceipt({ hash: txHash, status: "ACCEPTED" as any, retries: 24, interval: 5000 }) as TransactionReceipt;
  }

  async approveJob(jobId: string): Promise<TransactionReceipt> {
      const txHash = await this.client.writeContract({
        address: this.contractAddress,
        functionName: "approve_job",
        args: [jobId],
        value: BigInt(0),
      });
      return await this.client.waitForTransactionReceipt({ hash: txHash, status: "ACCEPTED" as any, retries: 24, interval: 5000 }) as TransactionReceipt;
  }

  async disputeJob(jobId: string): Promise<TransactionReceipt> {
      const txHash = await this.client.writeContract({
        address: this.contractAddress,
        functionName: "dispute_job",
        args: [jobId],
        value: BigInt(0),
      });
      return await this.client.waitForTransactionReceipt({ hash: txHash, status: "ACCEPTED" as any, retries: 24, interval: 5000 }) as TransactionReceipt;
  }

  async resolveDispute(jobId: string): Promise<TransactionReceipt> {
      const txHash = await this.client.writeContract({
        address: this.contractAddress,
        functionName: "resolve_dispute",
        args: [jobId],
        value: BigInt(0),
      });
      return await this.client.waitForTransactionReceipt({ hash: txHash, status: "ACCEPTED" as any, retries: 24, interval: 5000 }) as TransactionReceipt;
  }
}

export default GenEscrowContract;
