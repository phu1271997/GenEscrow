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
}

export interface TransactionReceipt {
  status: string;
  hash: string;
  blockNumber?: number;
  [key: string]: any;
}
