# { "Depends": "py-genlayer:test" }

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

class GenEscrow(gl.Contract):
    jobs: TreeMap[str, Job]

    def __init__(self):
        pass

    def _resolve(self, criteria: str, description: str, url: str) -> str:
        def get_verdict() -> str:
            web_data = gl.nondet.web.render(url, mode="text")
            task = f"""
Evaluate the freelancer's work based on the job description and criteria.
Job Description: {description}
Acceptance Criteria: {criteria}

Freelancer Submission Content:
{web_data}

Based on the criteria, make a decision:
- "RELEASE": The work fully meets the criteria.
- "REFUND": The work completely fails to meet the criteria or is irrelevant.
- "PARTIAL": The work partially meets the criteria.

Respond in JSON:
{{
    "verdict": str // "RELEASE", "REFUND", or "PARTIAL"
}}
It is mandatory that you respond only using the JSON format above, nothing else.
            """
            result = gl.nondet.exec_prompt(task, response_format="json")
            return json.dumps(result, sort_keys=True)

        result_json = json.loads(gl.eq_principle.strict_eq(get_verdict))
        return result_json["verdict"]

    @gl.public.write
    def create_job(self, job_id: str, description: str, criteria: str, deadline: str, amount: str) -> None:
        sender_address = gl.message.sender_address.as_hex
        
        if job_id in self.jobs:
            raise Exception("Job already exists")
        
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
            verdict=""
        )
        self.jobs[job_id] = job

    @gl.public.write
    def accept_job(self, job_id: str) -> None:
        job = self.jobs[job_id]
        if job.status != "OPEN":
            raise Exception("Job is not OPEN")
        job.freelancer = gl.message.sender_address.as_hex
        job.status = "ACCEPTED"

    @gl.public.write
    def submit_work(self, job_id: str, url: str) -> None:
        job = self.jobs[job_id]
        if job.status != "ACCEPTED":
            raise Exception("Job is not ACCEPTED")
        if gl.message.sender_address.as_hex != job.freelancer:
            raise Exception("Only freelancer can submit")
        job.submission_url = url
        job.status = "SUBMITTED"

    @gl.public.write
    def approve_job(self, job_id: str) -> None:
        job = self.jobs[job_id]
        if job.status != "SUBMITTED":
            raise Exception("Job is not SUBMITTED")
        if gl.message.sender_address.as_hex != job.client:
            raise Exception("Only client can approve")
        job.status = "APPROVED"
        job.verdict = "RELEASE"

    @gl.public.write
    def dispute_job(self, job_id: str) -> None:
        job = self.jobs[job_id]
        if job.status != "SUBMITTED":
            raise Exception("Job is not SUBMITTED")
        sender = gl.message.sender_address.as_hex
        if sender != job.client and sender != job.freelancer:
            raise Exception("Only client or freelancer can dispute")
        job.status = "DISPUTED"

    @gl.public.write
    def resolve_dispute(self, job_id: str) -> None:
        job = self.jobs[job_id]
        if job.status != "DISPUTED":
            raise Exception("Job is not DISPUTED")
            
        verdict = self._resolve(job.criteria, job.description, job.submission_url)
        job.status = "RESOLVED"
        job.verdict = verdict

    @gl.public.view
    def get_job(self, job_id: str) -> Job:
        return self.jobs[job_id]

    @gl.public.view
    def get_all_jobs(self) -> dict:
        return {k: v for k, v in self.jobs.items()}
