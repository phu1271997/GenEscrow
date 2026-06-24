import json
from gltest import get_contract_factory, get_default_account, create_accounts
from gltest.helpers import load_fixture
from gltest.assertions import tx_execution_succeeded

def deploy_contract():
    factory = get_contract_factory("GenEscrow")
    contract = factory.deploy()
    return contract

def test_gen_escrow_complete_flow_and_appeal():
    # 1. Deploy Contract
    contract = load_fixture(deploy_contract)
    
    # Create accounts for client and freelancer
    # get_default_account() will be client, we create a freelancer account
    default_account = get_default_account()
    accounts = create_accounts(1)
    freelancer = accounts[0]
    
    # 2. Create Job (Client is default_account)
    job_id = "job_123"
    desc = "Build Next.js web app"
    criteria = "Must have responsive layout and 3 pages"
    deadline = "2026-12-31"
    amount = "100"
    
    create_res = contract.create_job(args=[job_id, desc, criteria, deadline, amount])
    assert tx_execution_succeeded(create_res)
    
    # Verify job state
    job = contract.get_job(args=[job_id]).call()
    assert job["job_id"] == job_id
    assert job["client"].lower() == default_account.address.lower()
    assert job["status"] == "OPEN"
    assert job["amount"] == "100"
    
    # 3. Accept Job (Freelancer)
    freelancer_contract = contract.connect(freelancer)
    accept_res = freelancer_contract.accept_job(args=[job_id])
    assert tx_execution_succeeded(accept_res)
    
    # Verify status is ACCEPTED
    job = contract.get_job(args=[job_id]).call()
    assert job["status"] == "ACCEPTED"
    assert job["freelancer"].lower() == freelancer.address.lower()
    
    # 4. Submit Work (Freelancer)
    url = "https://example.com/submission"
    submit_res = freelancer_contract.submit_work(args=[job_id, url])
    assert tx_execution_succeeded(submit_res)
    
    # Verify status is SUBMITTED
    job = contract.get_job(args=[job_id]).call()
    assert job["status"] == "SUBMITTED"
    assert job["submission_url"] == url
    
    # 5. Dispute Job (Client)
    dispute_res = contract.dispute_job(args=[job_id])
    assert tx_execution_succeeded(dispute_res)
    
    job = contract.get_job(args=[job_id]).call()
    assert job["status"] == "DISPUTED"
    
    # 6. Resolve Dispute (AI Jury)
    # We trigger AI resolution.
    # Note: wait_interval/wait_retries are used because AI resolution runs consensus.
    resolve_res = contract.resolve_dispute(
        args=[job_id],
        wait_interval=10000,
        wait_retries=20
    )
    assert tx_execution_succeeded(resolve_res)
    
    job = contract.get_job(args=[job_id]).call()
    assert job["status"] == "RESOLVED"
    # Verdict should be set by AI (either RELEASE, REFUND, or PARTIAL)
    assert job["verdict"] in ["RELEASE", "REFUND", "PARTIAL"]
    print(f"Dispute resolved. Verdict: {job['verdict']}, Pct: {job['freelancer_pct']}, Reason: {job['reason']}")
    
    # 7. Request Appeal (Freelancer appeals)
    # Freelancer is unhappy with the verdict, requests appeal with 50 stake
    appeal_stake = 50
    appeal_res = freelancer_contract.request_appeal(args=[job_id, appeal_stake])
    assert tx_execution_succeeded(appeal_res)
    
    # Verify Job and Appeal state
    job = contract.get_job(args=[job_id]).call()
    assert job["status"] == "APPEALED"
    
    appeal = contract.get_appeal(args=[job_id]).call()
    assert appeal["job_id"] == job_id
    assert appeal["appealer"].lower() == freelancer.address.lower()
    assert appeal["stake"] == appeal_stake
    assert appeal["status"] == "PENDING"
    assert appeal["previous_verdict"] == job["verdict"]
    
    # 8. Resolve Appeal (AI Forensic Arbitrator)
    resolve_appeal_res = contract.resolve_appeal(
        args=[job_id],
        wait_interval=10000,
        wait_retries=20
    )
    assert tx_execution_succeeded(resolve_appeal_res)
    
    # Verify final states
    job = contract.get_job(args=[job_id]).call()
    assert job["status"] == "FINALIZED"
    assert job["verdict"] in ["RELEASE", "REFUND", "PARTIAL"]
    
    appeal = contract.get_appeal(args=[job_id]).call()
    assert appeal["status"] in ["UPHELD", "OVERTURNED"]
    assert appeal["final_verdict"] == job["verdict"]
    print(f"Appeal resolved. Status: {appeal['status']}, Final Verdict: {job['verdict']}, Reason: {job['reason']}")

def test_gen_escrow_edge_cases():
    contract = load_fixture(deploy_contract)
    accounts = create_accounts(1)
    freelancer = accounts[0]
    
    # Test empty job_id
    res = contract.create_job(args=["", "desc", "criteria", "deadline", "100"])
    assert not tx_execution_succeeded(res)
    
    # Create a valid job for further testing
    job_id = "edge_job"
    contract.create_job(args=[job_id, "desc", "criteria", "deadline", "100"])
    
    # Test client accepting their own job (should fail)
    res_accept = contract.accept_job(args=[job_id])
    assert not tx_execution_succeeded(res_accept)
    
    # Freelancer accepts
    freelancer_contract = contract.connect(freelancer)
    freelancer_contract.accept_job(args=[job_id])
    
    # Client trying to submit work (should fail)
    res_submit = contract.submit_work(args=[job_id, "https://example.com"])
    assert not tx_execution_succeeded(res_submit)
    
    # Dispute before submit (should fail)
    res_dispute = contract.dispute_job(args=[job_id])
    assert not tx_execution_succeeded(res_dispute)
