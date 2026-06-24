# CHANGELOG — GenEscrow Milestone Upgrades

Tài liệu này ghi nhận chi tiết các thay đổi đột phá qua 3 Milestone nâng cấp của dự án **GenEscrow** trên GenLayer.

---

## [Milestone 1] AI Consensus Upgrade: Từ Format-Check sang MEANING-Check

### 1. Phân tích Thay đổi
*   **Trước (Baseline):**
    *   Sử dụng `gl.eq_principle.strict_eq(get_verdict)` yêu cầu so sánh bằng tuyệt đối từng ký tự chuỗi JSON đầu ra của các AI Validators. Nếu cách diễn đạt lý do (`reason`) lệch một vài chữ, consensus sẽ thất bại.
    *   Hội đồng AI chỉ kiểm tra đơn giản và trả về verdict thô: `{"verdict": "RELEASE|REFUND|PARTIAL"}`.
    *   Không xử lý lỗi cào thông tin web: nếu URL chết, `web.render` quăng lỗi làm treo transaction.
    *   Địa chỉ ví so sánh trực tiếp dạng case-sensitive, không chuẩn hóa. Thiếu kiểm tra sự tồn tại của Job ID.
*   **Sau (Nâng cấp):**
    *   Chuyển sang cơ chế đồng thuận ngữ nghĩa chuyên sâu thông qua **Equivalence Principle** với `gl.eq_principle.prompt_comparative`.
    *   AI Jury trả về schema JSON mở rộng và chặt chẽ:
        ```json
        {
          "verdict": "RELEASE | REFUND | PARTIAL",
          "freelancer_pct": int,
          "reason": "str"
        }
        ```
    *   Định nghĩa luật đồng thuận ngữ nghĩa rõ ràng: Các validator đồng thuận khi và chỉ khi cùng đưa ra một loại verdict (`RELEASE`, `REFUND` hoặc `PARTIAL`). Trong trường hợp giải ngân một phần (`PARTIAL`), tỷ lệ tiền giải ngân (`freelancer_pct`) giữa các validator không được lệch nhau quá 10%. Toàn bộ sự khác biệt về câu chữ trong trường lý do (`reason`) đều được bỏ qua.
    *   Tích hợp xử lý ngoại lệ cào thông tin web: Nếu `web.render` thất bại, nội dung lỗi được đóng gói làm bằng chứng và gửi tới prompt để AI phân định (ví dụ: URL không truy cập được sẽ dẫn tới phán quyết `REFUND` hợp lý).
    *   Bổ sung kiểm tra sự tồn tại của `job_id` trong mọi write method, raise lỗi rõ ràng. Chuẩn hóa tất cả địa chỉ ví về chữ thường (`.lower()`) trước khi so sánh.
*   **Lý do (Rationale):**
    *   Nâng cao độ tin cậy và tỷ lệ thành công của consensus trên mạng lưới phi tập trung. AI không bao giờ trả về 100% giống nhau từng từ, vì thế so sánh ngữ nghĩa là giải pháp duy nhất khả thi cho các Intelligent Contract phức tạp.
    *   Đảm bảo tính bảo mật, chống spam nộp bài lỗi, và bảo vệ quyền lợi của Client khi freelancer nộp URL giả mạo.

### 2. Các file thay đổi
*   [gen_escrow.py](file:///Users/peter/Downloads/AI/GenEscrow_genlayer/contracts/gen_escrow.py)
*   [test_gen_escrow.py](file:///Users/peter/Downloads/AI/GenEscrow_genlayer/test/test_gen_escrow.py)

---

## [Milestone 2] Tính năng lớn: Luồng Kháng nghị Tranh chấp (Dispute Appeal Flow)

### 1. Phân tích Thay đổi
*   **Trước (Baseline):**
    *   Phán quyết ban đầu của AI Jury là chung cuộc. Không có cách nào để khiếu nại hoặc xem xét lại nếu một bên cảm thấy phán quyết chưa thỏa đáng.
*   **Sau (Nâng cấp):**
    *   Thiết kế và cài đặt toàn bộ luồng kháng nghị tranh chấp (Dispute Appeal Flow) hoàn chỉnh.
    *   Bên không đồng ý với verdict đầu tiên có thể gọi `request_appeal(job_id, stake)` trong trạng thái `RESOLVED`.
    *   Yêu cầu người kháng nghị phải khóa một lượng tiền phạt spam ảo (`stake: int > 0`). Trạng thái Job chuyển thành `APPEALED`.
    *   Hợp đồng hỗ trợ gọi `resolve_appeal(job_id)` để kích hoạt một phiên tòa AI độc lập thứ hai. Phiên tòa này sử dụng một prompt đặc biệt nghiêm ngặt đóng vai trò **Senior Forensic AI Arbitrator** (phân tích dưới góc nhìn hoài nghi, đối chiếu phán quyết cũ và bằng chứng).
    *   **Luật kinh tế của Appeal:** Nếu phán quyết mới khác biệt phán quyết cũ (lật án thành công/`OVERTURNED`), hoàn trả stake cho người kháng nghị. Nếu phán quyết mới giữ nguyên (bác đơn/`UPHELD`), stake bị tịch thu và cộng vào Job. Trạng thái Job chuyển thành kết quả chung cuộc `FINALIZED`.
*   **Lý do (Rationale):**
    *   Cung cấp một cơ chế bảo vệ hai lớp (two-instance court) giống như hệ thống pháp lý ngoài đời thực. Giảm thiểu rủi ro sai lệch phán quyết của AI trong các vụ tranh chấp lớn và trừng phạt các hành vi khiếu nại vô căn cứ (spam).

### 2. Các file thay đổi
*   [gen_escrow.py](file:///Users/peter/Downloads/AI/GenEscrow_genlayer/contracts/gen_escrow.py)
*   [test_gen_escrow.py](file:///Users/peter/Downloads/AI/GenEscrow_genlayer/test/test_gen_escrow.py)

---

## [Milestone 3] Tích hợp Frontend, Nâng cao UX & Polish Kỹ thuật

### 1. Phân tích Thay đổi
*   **Trước (Baseline):**
    *   Sau khi deploy contract, nhà phát triển phải sao chép địa chỉ thủ công vào `.env`.
    *   Giao diện bảng danh sách công việc đơn điệu, chỉ hiển thị trạng thái chữ thô, không hiển thị lý do AI đưa ra phán quyết hay tỷ lệ phần trăm giải ngân.
    *   Thiếu các trạng thái chờ (loading) trực quan khi giao dịch đang được xử lý trên chuỗi hoặc khi AI Jury đang hội ý.
    *   Không hỗ trợ bất kỳ tính năng khiếu nại (Appeal) nào trên UI.
*   **Sau (Nâng cấp):**
    *   **Tự động hóa Deploy:** Script `deploy/deployScript.ts` tự động tạo/ghi đè file `frontend/.env` ngay sau khi deploy thành công.
    *   **TypeScript Wrapper & Hooks:** Đồng bộ toàn bộ các phương thức mới (`requestAppeal`, `resolveAppeal`, `getAppeal`) và các trường dữ liệu mới sang frontend.
    *   **UI/UX Nâng cấp vượt trội:**
        *   Thiết kế bảng danh sách công việc dưới dạng các hàng có thể mở rộng (expandable row) cực kỳ mượt mà.
        *   Hiển thị chi tiết lý do phân xử của AI và tỷ lệ phần trăm phân chia số tiền bằng thanh tiến trình (progress bar) trực quan khi mở rộng.
        *   Tích hợp Modal "Appeal Verdict" trực quan cho phép các bên nhập số tiền cọc kháng nghị.
        *   Hiển thị chi tiết thông tin kháng nghị (Ai kháng nghị, số tiền cọc, trạng thái appeal `PENDING/UPHELD/OVERTURNED`, và lập luận forensic của AI).
        *   Trạng thái loading động hiển thị thông điệp phù hợp: *"AI Jury đang hội ý..."* khi resolving dispute, hoặc *"Forensic AI đang thẩm định..."* khi resolving appeal.
        *   Thêm các Empty State chất lượng cao và thông báo lỗi chi tiết khi giao dịch thất bại.
*   **Lý do (Rationale):**
    *   Đưa các nâng cấp kỹ thuật từ contract lên giao diện người dùng thực tế một cách đồng bộ và sinh động, mang lại trải nghiệm chuyên nghiệp, mượt mà và chứng minh sức mạnh của Intelligent Contracts trên GenLayer.

### 2. Các file thay đổi
*   [deployScript.ts](file:///Users/peter/Downloads/AI/GenEscrow_genlayer/deploy/deployScript.ts)
*   [types.ts](file:///Users/peter/Downloads/AI/GenEscrow_genlayer/frontend/lib/contracts/types.ts)
*   [GenEscrow.ts](file:///Users/peter/Downloads/AI/GenEscrow_genlayer/frontend/lib/contracts/GenEscrow.ts)
*   [useGenEscrow.ts](file:///Users/peter/Downloads/AI/GenEscrow_genlayer/frontend/lib/hooks/useGenEscrow.ts)
*   [JobsTable.tsx](file:///Users/peter/Downloads/AI/GenEscrow_genlayer/frontend/components/JobsTable.tsx)
