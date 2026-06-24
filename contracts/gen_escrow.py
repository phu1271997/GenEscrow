# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

import json
from dataclasses import dataclass
from genlayer import *

@allow_storage
@dataclass
class Job:
    job_id: str
    client: str
    freelancer: str
    amount: str
    description: str
    criteria: str
    deadline: str
    submission_url: str
    status: str
    verdict: str
    freelancer_pct: u256
    reason: str

@allow_storage
@dataclass
class Appeal:
    job_id: str
    appealer: str
    stake: u256
    previous_verdict: str
    final_verdict: str
    status: str  # "PENDING", "UPHELD", "OVERTURNED"
    reason: str

class GenEscrow(gl.Contract):
    jobs: TreeMap[str, Job]
    appeals: TreeMap[str, Appeal]

    def __init__(self):
        pass

    def _resolve(self, criteria: str, description: str, url: str) -> str:
        def get_verdict() -> str:
            # Handle web render failure gracefully
            try:
                web_data = gl.nondet.web.render(url, mode="text")
            except Exception as e:
                web_data = f"Error: Could not render or access the submission URL. Details: {str(e)}"

            task = f"""
Evaluate the freelancer's work based on the job description and criteria.
Job Description: {description}
Acceptance Criteria: {criteria}

Freelancer Submission Content:
{web_data}

Based on the criteria, make a decision:
- "RELEASE": The work fully meets the criteria. (freelancer_pct must be 100)
- "REFUND": The work completely fails to meet the criteria or is irrelevant. (freelancer_pct must be 0)
- "PARTIAL": The work partially meets the criteria. (freelancer_pct must be between 1 and 99, representing the percentage of funds that should be released to the freelancer)

Respond in JSON format:
{{
    "verdict": "RELEASE" | "REFUND" | "PARTIAL",
    "freelancer_pct": int, // 0 to 100
    "reason": "str" // detailed explanation of the decision
}}
It is mandatory that you respond only using the JSON format above, nothing else.
"""
            try:
                result = gl.nondet.exec_prompt(task, response_format="json")
                verdict = str(result.get("verdict", "")).strip().upper()
                if verdict not in ["RELEASE", "REFUND", "PARTIAL"]:
                    raise Exception(f"Invalid verdict value: {verdict}")
                
                pct_val = result.get("freelancer_pct", 0)
                if not isinstance(pct_val, int):
                    try:
                        pct_val = int(pct_val)
                    except:
                        pct_val = 0
                if pct_val < 0: pct_val = 0
                if pct_val > 100: pct_val = 100
                
                # Enforce consistency
                if verdict == "RELEASE":
                    pct_val = 100
                elif verdict == "REFUND":
                    pct_val = 0
                
                reason_val = str(result.get("reason", "No reason provided"))
                
                cleaned_result = {
                    "verdict": verdict,
                    "freelancer_pct": pct_val,
                    "reason": reason_val
                }
                return json.dumps(cleaned_result, sort_keys=True)
            except Exception as e:
                return json.dumps({
                    "verdict": "REFUND",
                    "freelancer_pct": 0,
                    "reason": f"AI Execution failed: {str(e)}"
                }, sort_keys=True)

        principle = """
The outputs are equivalent if and only if:
1. Both outputs have the exact same 'verdict' value (which must be 'RELEASE', 'REFUND', or 'PARTIAL').
2. If the verdict is 'PARTIAL', their 'freelancer_pct' values must be close to each other, meaning the absolute difference between their 'freelancer_pct' values is less than or equal to 10.
The 'reason' string can be different.
"""
        return gl.eq_principle.prompt_comparative(get_verdict, principle)

    def _resolve_appeal(self, criteria: str, description: str, url: str, prev_verdict: str, prev_reason: str) -> str:
        def get_appeal_verdict() -> str:
            # Handle web render failure gracefully
            try:
                web_data = gl.nondet.web.render(url, mode="text")
            except Exception as e:
                web_data = f"Error: Could not render or access the submission URL. Details: {str(e)}"

            task = f"""
You are a Senior Forensic AI Arbitrator reviewing an appealed dispute.
An appeal has been lodged against the previous AI Jury's decision.

Job Description: {description}
Acceptance Criteria: {criteria}
Freelancer Submission Content:
{web_data}

Previous AI Jury Verdict: {prev_verdict}
Previous AI Jury Reason: {prev_reason}

Your task is to conduct a highly critical, meticulous review of the submission. You must determine whether the previous verdict was correct or if it needs to be overturned.
Make your decision:
- "RELEASE": The work fully meets the criteria. (freelancer_pct must be 100)
- "REFUND": The work completely fails to meet the criteria or is irrelevant. (freelancer_pct must be 0)
- "PARTIAL": The work partially meets the criteria. (freelancer_pct must be between 1 and 99, representing the percentage of funds that should be released to the freelancer)

Respond in JSON format:
{{
    "verdict": "RELEASE" | "REFUND" | "PARTIAL",
    "freelancer_pct": int, // 0 to 100
    "reason": "str" // detailed explanation of why you uphold or overturn the previous verdict
}}
It is mandatory that you respond only using the JSON format above, nothing else.
"""
            try:
                result = gl.nondet.exec_prompt(task, response_format="json")
                verdict = str(result.get("verdict", "")).strip().upper()
                if verdict not in ["RELEASE", "REFUND", "PARTIAL"]:
                    raise Exception(f"Invalid verdict value: {verdict}")
                
                pct_val = result.get("freelancer_pct", 0)
                if not isinstance(pct_val, int):
                    try:
                        pct_val = int(pct_val)
                    except:
                        pct_val = 0
                if pct_val < 0: pct_val = 0
                if pct_val > 100: pct_val = 100
                
                # Enforce consistency
                if verdict == "RELEASE":
                    pct_val = 100
                elif verdict == "REFUND":
                    pct_val = 0
                
                reason_val = str(result.get("reason", "No reason provided"))
                
                cleaned_result = {
                    "verdict": verdict,
                    "freelancer_pct": pct_val,
                    "reason": reason_val
                }
                return json.dumps(cleaned_result, sort_keys=True)
            except Exception as e:
                return json.dumps({
                    "verdict": "REFUND",
                    "freelancer_pct": 0,
                    "reason": f"AI Appeal Execution failed: {str(e)}"
                }, sort_keys=True)

        principle = """
The outputs are equivalent if and only if:
1. Both outputs have the exact same 'verdict' value (which must be 'RELEASE', 'REFUND', or 'PARTIAL').
2. If the verdict is 'PARTIAL', their 'freelancer_pct' values must be close to each other, meaning the absolute difference between their 'freelancer_pct' values is less than or equal to 10.
The 'reason' string can be different.
"""
        return gl.eq_principle.prompt_comparative(get_appeal_verdict, principle)

    @gl.public.write
    def create_job(self, job_id: str, description: str, criteria: str, deadline: str, amount: str) -> None:
        sender_address = gl.message.sender_address.as_hex.lower()
        
        # Validate job_id
        if not job_id or len(job_id.strip()) == 0:
            raise Exception("Job ID cannot be empty")
        
        if job_id in self.jobs:
            raise Exception("Job already exists")
        
        # Validate amount
        try:
            amt_val = int(amount)
            if amt_val <= 0:
                raise Exception("Amount must be greater than 0")
        except ValueError:
            if not amount or len(amount.strip()) == 0:
                raise Exception("Amount cannot be empty")
        
        job = Job(
            job_id=job_id,
            client=sender_address,
            freelancer="",
            amount=amount,
            description=description,
            criteria=criteria,
            deadline=deadline,
            submission_url="",
            status="OPEN",
            verdict="",
            freelancer_pct=0,
            reason=""
        )
        self.jobs[job_id] = job

    @gl.public.write
    def accept_job(self, job_id: str) -> None:
        if job_id not in self.jobs:
            raise Exception("Job not found")
        job = self.jobs[job_id]
        if job.status != "OPEN":
            raise Exception("Job is not OPEN")
        
        sender = gl.message.sender_address.as_hex.lower()
        if sender == job.client.lower():
            raise Exception("Client cannot accept their own job")
            
        job.freelancer = sender
        job.status = "ACCEPTED"

    @gl.public.write
    def submit_work(self, job_id: str, url: str) -> None:
        if job_id not in self.jobs:
            raise Exception("Job not found")
        job = self.jobs[job_id]
        if job.status != "ACCEPTED":
            raise Exception("Job is not ACCEPTED")
        if gl.message.sender_address.as_hex.lower() != job.freelancer.lower():
            raise Exception("Only freelancer can submit")
        if not url or len(url.strip()) == 0:
            raise Exception("Submission URL cannot be empty")
            
        job.submission_url = url
        job.status = "SUBMITTED"

    @gl.public.write
    def approve_job(self, job_id: str) -> None:
        if job_id not in self.jobs:
            raise Exception("Job not found")
        job = self.jobs[job_id]
        if job.status != "SUBMITTED":
            raise Exception("Job is not SUBMITTED")
        if gl.message.sender_address.as_hex.lower() != job.client.lower():
            raise Exception("Only client can approve")
            
        job.status = "APPROVED"
        job.verdict = "RELEASE"
        job.freelancer_pct = 100
        job.reason = "Approved by client"

    @gl.public.write
    def dispute_job(self, job_id: str) -> None:
        if job_id not in self.jobs:
            raise Exception("Job not found")
        job = self.jobs[job_id]
        if job.status != "SUBMITTED":
            raise Exception("Job is not SUBMITTED")
            
        sender = gl.message.sender_address.as_hex.lower()
        if sender != job.client.lower() and sender != job.freelancer.lower():
            raise Exception("Only client or freelancer can dispute")
            
        job.status = "DISPUTED"

    @gl.public.write
    def resolve_dispute(self, job_id: str) -> None:
        if job_id not in self.jobs:
            raise Exception("Job not found")
        job = self.jobs[job_id]
        if job.status != "DISPUTED":
            raise Exception("Job is not DISPUTED")
            
        result_str = self._resolve(job.criteria, job.description, job.submission_url)
        result_json = json.loads(result_str)
        
        job.status = "RESOLVED"
        job.verdict = result_json["verdict"]
        job.freelancer_pct = result_json["freelancer_pct"]
        job.reason = result_json["reason"]

    @gl.public.write
    def request_appeal(self, job_id: str, stake: u256) -> None:
        if job_id not in self.jobs:
            raise Exception("Job not found")
        job = self.jobs[job_id]
        if job.status != "RESOLVED":
            raise Exception("Job must be RESOLVED to appeal")
        
        sender = gl.message.sender_address.as_hex.lower()
        if sender != job.client.lower() and sender != job.freelancer.lower():
            raise Exception("Only client or freelancer can appeal")
        
        if job_id in self.appeals:
            raise Exception("Appeal already requested for this job")
            
        if stake <= 0:
            raise Exception("Appeal stake must be greater than 0")
            
        appeal = Appeal(
            job_id=job_id,
            appealer=sender,
            stake=stake,
            previous_verdict=job.verdict,
            final_verdict="",
            status="PENDING",
            reason=""
        )
        self.appeals[job_id] = appeal
        job.status = "APPEALED"

    @gl.public.write
    def resolve_appeal(self, job_id: str) -> None:
        if job_id not in self.jobs:
            raise Exception("Job not found")
        job = self.jobs[job_id]
        if job.status != "APPEALED":
            raise Exception("Job is not in APPEALED state")
        if job_id not in self.appeals:
            raise Exception("Appeal record not found")
            
        appeal = self.appeals[job_id]
        if appeal.status != "PENDING":
            raise Exception("Appeal is already resolved")
            
        result_str = self._resolve_appeal(
            job.criteria, job.description, job.submission_url,
            appeal.previous_verdict, job.reason
        )
        result_json = json.loads(result_str)
        
        final_verdict = result_json["verdict"]
        final_pct = result_json["freelancer_pct"]
        final_reason = result_json["reason"]
        
        if final_verdict != appeal.previous_verdict:
            appeal.status = "OVERTURNED"
        else:
            appeal.status = "UPHELD"
            
        appeal.final_verdict = final_verdict
        appeal.reason = final_reason
        
        job.status = "FINALIZED"
        job.verdict = final_verdict
        job.freelancer_pct = final_pct
        job.reason = final_reason

    @gl.public.view
    def get_job(self, job_id: str) -> Job:
        if job_id not in self.jobs:
            raise Exception("Job not found")
        return self.jobs[job_id]

    @gl.public.view
    def get_appeal(self, job_id: str) -> Appeal:
        if job_id not in self.appeals:
            raise Exception("Appeal not found")
        return self.appeals[job_id]

    @gl.public.view
    def get_all_jobs(self) -> dict:
        return {k: v for k, v in self.jobs.items()}
