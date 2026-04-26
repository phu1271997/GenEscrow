"use client";

import { Navbar } from "@/components/Navbar";
import { JobsTable } from "@/components/JobsTable";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow pt-20 pb-12 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 animate-fade-in mt-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              GenEscrow Platform
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Decentralized Escrow with AI Dispute Resolution on GenLayer.
              <br />
              Hire freelancers securely without middlemen.
            </p>
          </div>

          <div className="animate-slide-up">
            <JobsTable />
          </div>

          <div className="mt-8 glass-card p-6 md:p-8 animate-fade-in" style={{ animationDelay: "200ms" }}>
            <h2 className="text-2xl font-bold mb-4">How it Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <div className="text-accent font-bold text-lg">1. Create a Job</div>
                <p className="text-sm text-muted-foreground">
                  Client creates a job and sets clear acceptance criteria. Funds are securely locked in the smart contract.
                </p>
              </div>
              <div className="space-y-2">
                <div className="text-accent font-bold text-lg">2. Submit Work</div>
                <p className="text-sm text-muted-foreground">
                  A freelancer accepts the job and later submits a URL containing their completed work.
                </p>
              </div>
              <div className="space-y-2">
                <div className="text-accent font-bold text-lg">3. Approve/Dispute</div>
                <p className="text-sm text-muted-foreground">
                  Client can approve the work to release funds instantly. If they disagree, either party can raise a dispute.
                </p>
              </div>
              <div className="space-y-2">
                <div className="text-accent font-bold text-lg">4. AI Jury Resolution</div>
                <p className="text-sm text-muted-foreground">
                  If disputed, the GenLayer AI validators fetch the submitted work, analyze it against criteria, and deliver a fair verdict.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/10 py-2">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <a
                href="https://genlayer.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent transition-colors"
              >
                Powered by GenLayer
              </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
