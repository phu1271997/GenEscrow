"use client";

import { Loader2, AlertCircle } from "lucide-react";
import { useJobs, useJobAction, useGenEscrowContract } from "@/lib/hooks/useGenEscrow";
import { useWallet } from "@/lib/genlayer/wallet";
import { AddressDisplay } from "./AddressDisplay";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import type { Job } from "@/lib/contracts/types";

export function JobsTable() {
  const contract = useGenEscrowContract();
  const { data: jobs, isLoading, isError } = useJobs();
  const { address } = useWallet();
  const { mutate: performAction, isPending } = useJobAction();

  if (isLoading) {
    return (
      <div className="brand-card p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="brand-card p-12 text-center">
        <AlertCircle className="w-16 h-16 mx-auto text-yellow-400 opacity-60 mb-4" />
        <h3 className="text-xl font-bold mb-2">Setup Required</h3>
        <p className="text-muted-foreground">Please set NEXT_PUBLIC_CONTRACT_ADDRESS in .env</p>
      </div>
    );
  }

  if (!jobs || jobs.length === 0) {
    return (
      <div className="brand-card p-12 text-center">
        <h3 className="text-xl font-bold mb-2">No Jobs Yet</h3>
        <p className="text-muted-foreground">Create a job to get started!</p>
      </div>
    );
  }

  return (
    <div className="brand-card p-6 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">Job</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">Status/Verdict</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">Client</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">Freelancer</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {jobs.map((job) => {
              const isClient = address?.toLowerCase() === job.client?.toLowerCase();
              const isFreelancer = address?.toLowerCase() === job.freelancer?.toLowerCase();

              return (
                <tr key={job.job_id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-4">
                    <p className="font-semibold">{job.description}</p>
                    <p className="text-xs text-muted-foreground">Amount: {job.amount} GEN</p>
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant="outline" className="mb-1">{job.status}</Badge>
                    {job.verdict && <Badge className="ml-2 bg-green-500/20 text-green-400 border-green-500/30">{job.verdict}</Badge>}
                  </td>
                  <td className="px-4 py-4">
                    <AddressDisplay address={job.client} maxLength={8} />
                    {isClient && <Badge variant="secondary" className="text-[10px] ml-1">You</Badge>}
                  </td>
                  <td className="px-4 py-4">
                    {job.freelancer ? (
                      <>
                        <AddressDisplay address={job.freelancer} maxLength={8} />
                        {isFreelancer && <Badge variant="secondary" className="text-[10px] ml-1">You</Badge>}
                      </>
                    ) : <span className="text-xs text-muted-foreground">None</span>}
                  </td>
                  <td className="px-4 py-4 flex gap-2 flex-wrap">
                    {job.status === "OPEN" && !isClient && (
                      <Button size="sm" variant="gradient" disabled={isPending} onClick={() => performAction({ action: "accept", jobId: job.job_id })}>Accept Job</Button>
                    )}
                    {job.status === "ACCEPTED" && isFreelancer && (
                      <Button size="sm" variant="gradient" disabled={isPending} onClick={() => {
                        const url = prompt("Enter submission URL:");
                        if (url) performAction({ action: "submit", jobId: job.job_id, url });
                      }}>Submit Work</Button>
                    )}
                    {job.status === "SUBMITTED" && isClient && (
                      <>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" disabled={isPending} onClick={() => performAction({ action: "approve", jobId: job.job_id })}>Approve</Button>
                        <Button size="sm" variant="destructive" disabled={isPending} onClick={() => performAction({ action: "dispute", jobId: job.job_id })}>Dispute</Button>
                      </>
                    )}
                    {job.status === "SUBMITTED" && isFreelancer && (
                      <Button size="sm" variant="destructive" disabled={isPending} onClick={() => performAction({ action: "dispute", jobId: job.job_id })}>Dispute (Client MIA)</Button>
                    )}
                    {job.status === "DISPUTED" && (
                      <Button size="sm" variant="gradient" disabled={isPending} onClick={() => performAction({ action: "resolve", jobId: job.job_id })}>Resolve via AI Jury</Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
