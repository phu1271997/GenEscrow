"use client";

import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { useCreateJob } from "@/lib/hooks/useGenEscrow";
import { Button } from "./ui/button";

export function CreateJobModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { mutateAsync: createJob, isPending } = useCreateJob();
  const [description, setDescription] = useState("");
  const [criteria, setCriteria] = useState("");
  const [deadline, setDeadline] = useState("");
  const [amount, setAmount] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createJob({ description, criteria, deadline, amount });
      onClose();
    } catch (e) {
      // Error is handled in hook
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#1c1c24] border border-white/10 rounded-xl p-6 w-full max-w-md animate-slide-up shadow-2xl">
        <h2 className="text-2xl font-bold mb-4">Create Escrow Job</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Description</label>
            <input
              type="text"
              required
              className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Acceptance Criteria</label>
            <textarea
              required
              className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white"
              value={criteria}
              onChange={(e) => setCriteria(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Deadline</label>
            <input
              type="text"
              required
              className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              placeholder="e.g. 2026-12-31"
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Amount (GEN)</label>
            <input
              type="number"
              required
              min="1"
              className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" disabled={isPending}>
              {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Create
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
