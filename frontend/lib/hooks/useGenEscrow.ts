"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import GenEscrowContract from "../contracts/GenEscrow";
import { getContractAddress, getStudioUrl } from "../genlayer/client";
import { useWallet } from "../genlayer/wallet";
import { success, error, configError } from "../utils/toast";
import type { Job } from "../contracts/types";

export function useGenEscrowContract(): GenEscrowContract | null {
  const { address } = useWallet();
  const contractAddress = getContractAddress();
  const studioUrl = getStudioUrl();

  const contract = useMemo(() => {
    if (!contractAddress) {
      configError(
        "Setup Required",
        "Contract address not configured. Please set NEXT_PUBLIC_CONTRACT_ADDRESS in your .env file.",
      );
      return null;
    }
    return new GenEscrowContract(contractAddress, address, studioUrl);
  }, [contractAddress, address, studioUrl]);

  return contract;
}

export function useJobs() {
  const contract = useGenEscrowContract();

  return useQuery<Job[], Error>({
    queryKey: ["jobs"],
    queryFn: () => {
      if (!contract) {
        return Promise.resolve([]);
      }
      return contract.getJobs();
    },
    refetchOnWindowFocus: true,
    staleTime: 2000,
    enabled: !!contract,
  });
}

export function useCreateJob() {
  const contract = useGenEscrowContract();
  const { address } = useWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { description: string; criteria: string; deadline: string; amount: string }) => {
      if (!contract) throw new Error("Contract not configured.");
      if (!address) throw new Error("Wallet not connected.");
      const jobId = Math.random().toString(36).substring(2, 15);
      return contract.createJob(jobId, data.description, data.criteria, data.deadline, data.amount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      success("Job created successfully!");
    },
    onError: (err: any) => {
      console.error(err);
      error("Failed to create job", { description: err?.message });
    },
  });
}

export function useJobAction() {
  const contract = useGenEscrowContract();
  const { address } = useWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ action, jobId, url }: { action: string; jobId: string; url?: string }) => {
      if (!contract) throw new Error("Contract not configured.");
      if (!address) throw new Error("Wallet not connected.");

      switch(action) {
        case "accept":
          return contract.acceptJob(jobId);
        case "submit":
          if (!url) throw new Error("Submission URL is required");
          return contract.submitWork(jobId, url);
        case "approve":
          return contract.approveJob(jobId);
        case "dispute":
          return contract.disputeJob(jobId);
        case "resolve":
          return contract.resolveDispute(jobId);
        default:
          throw new Error("Unknown action");
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      success(`Action ${variables.action} successful!`);
    },
    onError: (err: any, variables) => {
      console.error(err);
      error(`Failed to ${variables.action}`, { description: err?.message });
    },
  });
}
