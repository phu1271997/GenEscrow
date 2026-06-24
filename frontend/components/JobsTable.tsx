"use client";

import { useState } from "react";
import { Loader2, AlertCircle, ChevronDown, ChevronUp, ExternalLink, Scale, ShieldAlert, CheckCircle, HelpCircle } from "lucide-react";
import { useJobs, useJobAction, useGenEscrowContract, useAppeal } from "@/lib/hooks/useGenEscrow";
import { useWallet } from "@/lib/genlayer/wallet";
import { AddressDisplay } from "./AddressDisplay";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import type { Job } from "@/lib/contracts/types";

export function JobsTable() {
  const contract = useGenEscrowContract();
  const { data: jobs, isLoading, isError, error: fetchError } = useJobs();

  if (isLoading) {
    return (
      <div className="brand-card p-12 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-accent" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading jobs from GenLayer...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="brand-card p-12 text-center border-red-500/20 bg-red-500/5">
        <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
        <h3 className="text-xl font-bold mb-2">Error Loading Jobs</h3>
        <p className="text-muted-foreground mb-4">{fetchError?.message || "An unexpected error occurred"}</p>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="brand-card p-12 text-center">
        <AlertCircle className="w-16 h-16 mx-auto text-yellow-400 opacity-60 mb-4" />
        <h3 className="text-xl font-bold mb-2">Setup Required</h3>
        <p className="text-muted-foreground">Please set NEXT_PUBLIC_CONTRACT_ADDRESS in your .env file</p>
      </div>
    );
  }

  if (!jobs || jobs.length === 0) {
    return (
      <div className="brand-card p-16 text-center">
        <Scale className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
        <h3 className="text-xl font-bold mb-2">No Escrow Jobs Found</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          There are no escrow contracts deployed yet. Click "New Job" above to create the first secure agreement!
        </p>
      </div>
    );
  }

  return (
    <div className="brand-card p-6 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-left">
              <th className="px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-semibold">Job Details</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-semibold">Status / Verdict</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-semibold">Parties</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {jobs.map((job) => (
              <JobRow key={job.job_id} job={job} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function JobRow({ job }: { job: Job }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAppealModalOpen, setIsAppealModalOpen] = useState(false);
  const [appealStake, setAppealStake] = useState("10");
  
  const { address } = useWallet();
  const { mutate: performAction, isPending, variables } = useJobAction();

  // Query appeal data if the job is APPEALED or FINALIZED
  const shouldFetchAppeal = job.status === "APPEALED" || job.status === "FINALIZED";
  const { data: appeal, isLoading: isAppealLoading } = useAppeal(shouldFetchAppeal ? job.job_id : "");

  const isClient = address?.toLowerCase() === job.client?.toLowerCase();
  const isFreelancer = address?.toLowerCase() === job.freelancer?.toLowerCase();
  const isParticipant = isClient || isFreelancer;

  // Specific action states for loaders
  const isResolvingThis = isPending && variables?.jobId === job.job_id && variables?.action === "resolve";
  const isResolvingAppealThis = isPending && variables?.jobId === job.job_id && variables?.action === "resolve_appeal";
  const isActionPendingThis = isPending && variables?.jobId === job.job_id;

  // Determine status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20">OPEN</Badge>;
      case "ACCEPTED":
        return <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/20">ACCEPTED</Badge>;
      case "SUBMITTED":
        return <Badge className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">SUBMITTED</Badge>;
      case "APPROVED":
        return <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">APPROVED</Badge>;
      case "DISPUTED":
        return <Badge className="bg-orange-500/10 text-orange-400 border border-orange-500/20 animate-pulse">DISPUTED</Badge>;
      case "RESOLVED":
        return <Badge className="bg-teal-500/10 text-teal-400 border border-teal-500/20">RESOLVED</Badge>;
      case "APPEALED":
        return <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse">APPEALED</Badge>;
      case "FINALIZED":
        return <Badge className="bg-slate-500/10 text-slate-400 border border-slate-500/20">FINALIZED</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Determine verdict badge styling
  const getVerdictBadge = (verdict: string, pct: number) => {
    if (!verdict) return null;
    switch (verdict) {
      case "RELEASE":
        return <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 ml-2">RELEASE (100%)</Badge>;
      case "REFUND":
        return <Badge className="bg-rose-500/20 text-rose-300 border border-rose-500/30 ml-2">REFUND (0%)</Badge>;
      case "PARTIAL":
        return <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 ml-2">PARTIAL ({pct}%)</Badge>;
      default:
        return <Badge className="ml-2">{verdict}</Badge>;
    }
  };

  const handleAppealSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const stake = parseInt(appealStake);
    if (isNaN(stake) || stake <= 0) return;
    performAction({ action: "appeal", jobId: job.job_id, stake });
    setIsAppealModalOpen(false);
  };

  return (
    <>
      <tr className="hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        {/* Column 1: Details */}
        <td className="px-4 py-4 max-w-xs md:max-w-md">
          <div className="flex items-start gap-2">
            <button className="mt-1 text-muted-foreground hover:text-white">
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <div>
              <p className="font-semibold text-white line-clamp-1">{job.description}</p>
              <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                <span>Amount: <strong className="text-accent">{job.amount} GEN</strong></span>
                <span>Deadline: <strong>{job.deadline}</strong></span>
              </div>
            </div>
          </div>
        </td>

        {/* Column 2: Status / Verdict */}
        <td className="px-4 py-4">
          <div className="flex items-center">
            {getStatusBadge(job.status)}
            {job.verdict && getVerdictBadge(job.verdict, job.freelancer_pct)}
          </div>
          {job.status === "RESOLVED" && (
            <span className="text-[10px] text-muted-foreground block mt-1">Appeal window open</span>
          )}
        </td>

        {/* Column 3: Parties */}
        <td className="px-4 py-4 text-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground uppercase w-8">Client:</span>
              <AddressDisplay address={job.client} maxLength={6} />
              {isClient && <Badge variant="secondary" className="text-[9px] px-1 py-0 scale-90 origin-left">You</Badge>}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground uppercase w-8">Free:</span>
              {job.freelancer ? (
                <>
                  <AddressDisplay address={job.freelancer} maxLength={6} />
                  {isFreelancer && <Badge variant="secondary" className="text-[9px] px-1 py-0 scale-90 origin-left">You</Badge>}
                </>
              ) : (
                <span className="text-xs text-muted-foreground italic">Vacant</span>
              )}
            </div>
          </div>
        </td>

        {/* Column 4: Actions */}
        <td className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-end gap-2 flex-wrap">
            {/* Accept Job */}
            {job.status === "OPEN" && !isClient && (
              <Button size="sm" variant="gradient" disabled={isActionPendingThis} onClick={() => performAction({ action: "accept", jobId: job.job_id })}>
                {isActionPendingThis ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Accept Job"}
              </Button>
            )}

            {/* Submit Work */}
            {job.status === "ACCEPTED" && isFreelancer && (
              <Button size="sm" variant="gradient" disabled={isActionPendingThis} onClick={() => {
                const url = prompt("Enter submission URL (e.g. link to Github repo or document):");
                if (url) performAction({ action: "submit", jobId: job.job_id, url });
              }}>
                {isActionPendingThis ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Submit Work"}
              </Button>
            )}

            {/* Approve / Dispute */}
            {job.status === "SUBMITTED" && isClient && (
              <>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={isActionPendingThis} onClick={() => performAction({ action: "approve", jobId: job.job_id })}>
                  Approve
                </Button>
                <Button size="sm" variant="destructive" disabled={isActionPendingThis} onClick={() => performAction({ action: "dispute", jobId: job.job_id })}>
                  Dispute
                </Button>
              </>
            )}
            {job.status === "SUBMITTED" && isFreelancer && (
              <Button size="sm" variant="destructive" disabled={isActionPendingThis} onClick={() => performAction({ action: "dispute", jobId: job.job_id })}>
                Dispute (Client MIA)
              </Button>
            )}

            {/* Resolve Dispute via AI Jury */}
            {job.status === "DISPUTED" && (
              <Button size="sm" variant="gradient" disabled={isActionPendingThis} onClick={() => performAction({ action: "resolve", jobId: job.job_id })}>
                {isResolvingThis ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    AI Deliberating...
                  </>
                ) : (
                  <>
                    <Scale className="w-3.5 h-3.5 mr-1.5" />
                    Resolve via AI Jury
                  </>
                )}
              </Button>
            )}

            {/* Appeal Verdict */}
            {job.status === "RESOLVED" && isParticipant && (
              <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white" disabled={isActionPendingThis} onClick={() => setIsAppealModalOpen(true)}>
                <ShieldAlert className="w-3.5 h-3.5 mr-1.5" />
                Appeal Verdict
              </Button>
            )}

            {/* Resolve Appeal via Forensic AI */}
            {job.status === "APPEALED" && (
              <Button size="sm" variant="gradient" disabled={isActionPendingThis} onClick={() => performAction({ action: "resolve_appeal", jobId: job.job_id })}>
                {isResolvingAppealThis ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Forensic AI Reviewing...
                  </>
                ) : (
                  <>
                    <Scale className="w-3.5 h-3.5 mr-1.5" />
                    Resolve Appeal
                  </>
                )}
              </Button>
            )}
            
            {/* Expand / Collapse indicator for non-action rows */}
            {job.status === "APPROVED" && (
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Released</span>
            )}
            {job.status === "FINALIZED" && (
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Finalized</span>
            )}
          </div>
        </td>
      </tr>

      {/* Expanded Row details */}
      {isExpanded && (
        <tr className="bg-white/[0.02]">
          <td colSpan={4} className="px-8 py-4 text-sm border-t border-white/5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Side: Criteria & Work */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Acceptance Criteria</h4>
                  <p className="text-white bg-white/5 p-3 rounded-lg border border-white/5 whitespace-pre-wrap">{job.criteria}</p>
                </div>
                {job.submission_url && (
                  <div>
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Freelancer Submission</h4>
                    <a
                      href={job.submission_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-accent hover:underline bg-white/5 px-3 py-2 rounded-lg border border-white/5 font-mono text-xs"
                    >
                      {job.submission_url}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* Right Side: Verdict Details & Appeal Information */}
              <div className="space-y-4">
                {/* AI Jury Verdict Details */}
                {job.verdict && (
                  <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-accent uppercase tracking-wide">AI Jury Resolution Details</h4>
                      <Badge variant="secondary" className="text-[10px]">
                        Verdict: {job.verdict}
                      </Badge>
                    </div>
                    {job.verdict === "PARTIAL" && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Payout Distribution:</span>
                          <span>Freelancer ({job.freelancer_pct}%) / Client ({100 - job.freelancer_pct}%)</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-accent" style={{ width: `${job.freelancer_pct}%` }}></div>
                        </div>
                      </div>
                    )}
                    <div>
                      <span className="text-[10px] text-muted-foreground font-semibold block uppercase">AI Arbitrator Reasoning:</span>
                      <p className="text-xs text-slate-300 italic mt-1 bg-black/20 p-2.5 rounded border border-white/5">
                        "{job.reason}"
                      </p>
                    </div>
                  </div>
                )}

                {/* Appeal Information */}
                {shouldFetchAppeal && (
                  <div className="bg-rose-950/20 border border-rose-900/30 p-4 rounded-xl space-y-3">
                    <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wide flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4" />
                      Dispute Appeal Record
                    </h4>
                    
                    {isAppealLoading ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Fetching appeal state from contract...
                      </div>
                    ) : appeal ? (
                      <div className="text-xs space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-slate-300 bg-black/20 p-2.5 rounded border border-white/5">
                          <div>
                            <span className="text-[10px] text-muted-foreground block uppercase">Appealed By:</span>
                            <AddressDisplay address={appeal.appealer} maxLength={8} />
                          </div>
                          <div>
                            <span className="text-[10px] text-muted-foreground block uppercase">Anti-Spam Stake:</span>
                            <strong className="text-rose-300">{appeal.stake} GEN</strong>
                          </div>
                          <div className="mt-1">
                            <span className="text-[10px] text-muted-foreground block uppercase">Appeal Status:</span>
                            <Badge className={
                              appeal.status === "PENDING" ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" :
                              appeal.status === "OVERTURNED" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                              "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                            }>
                              {appeal.status}
                            </Badge>
                          </div>
                          <div className="mt-1">
                            <span className="text-[10px] text-muted-foreground block uppercase">Previous Verdict:</span>
                            <span className="line-through text-slate-400">{appeal.previous_verdict}</span>
                          </div>
                        </div>

                        {appeal.status !== "PENDING" && (
                          <div className="space-y-1">
                            <span className="text-[10px] text-rose-300 font-semibold block uppercase">Forensic AI Arbitrator Reasoning:</span>
                            <p className="text-slate-300 italic bg-black/20 p-2.5 rounded border border-white/5">
                              "{appeal.reason}"
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground italic py-2">
                        No appeal record found on-chain.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}

      {/* Appeal Modal */}
      {isAppealModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#1c1c24] border border-white/10 rounded-xl p-6 w-full max-w-md animate-slide-up shadow-2xl">
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2 text-rose-400">
              <ShieldAlert className="w-5 h-5" />
              Appeal AI Jury Verdict
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              If you disagree with the AI Jury's decision, you can lodge a formal appeal. 
              The case will be re-evaluated by a Senior Forensic AI Arbitrator.
              <br />
              <strong className="text-rose-300">Important:</strong> To prevent spam, you must lock an anti-spam stake. 
              If the verdict is overturned, your stake is fully returned. If upheld, the stake is forfeited.
            </p>
            
            <form onSubmit={handleAppealSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">Anti-Spam Stake (GEN)</label>
                <input
                  type="number"
                  required
                  min="1"
                  className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white"
                  value={appealStake}
                  onChange={(e) => setAppealStake(e.target.value)}
                />
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="ghost" onClick={() => setIsAppealModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white">
                  Submit Appeal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
