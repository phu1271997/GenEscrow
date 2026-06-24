export interface Job {
  job_id: string;
  client: string;
  freelancer: string;
  amount: string;
  description: string;
  criteria: string;
  deadline: string;
  submission_url: string;
  status: string;
  verdict: string;
  freelancer_pct: number;
  reason: string;
}

export interface Appeal {
  job_id: string;
  appealer: string;
  stake: number;
  previous_verdict: string;
  final_verdict: string;
  status: string;
  reason: string;
}

export interface TransactionReceipt {
  status: string;
  hash: string;
  blockNumber?: number;
  [key: string]: any;
}
