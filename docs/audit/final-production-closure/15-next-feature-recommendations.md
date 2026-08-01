# Next Release Feature Recommendations & Scoring

## 1. Feature Evaluation Framework

Each feature candidate is scored across 6 dimensions (scale 1 to 5):
* **UV**: User Value
* **OV**: Operational Value
* **IC**: Implementation Cost (1 = low cost, 5 = high cost)
* **RK**: Risk (1 = low risk, 5 = high risk)
* **SF**: Scope Fit
* **DR**: Dependency Readiness

---

## 2. Scored Candidate Feature Matrix

| Feature Candidate | UV | OV | IC | RK | SF | DR | Score (Total) | Classification |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Separate Health & Readiness Endpoints** | 4 | 5 | 1 | 1 | 5 | 5 | **27 / 30** | `RECOMMENDED NEXT RELEASE` |
| **Dashboard Inquiry CSV Export** | 4 | 4 | 2 | 1 | 5 | 5 | **25 / 30** | `RECOMMENDED NEXT RELEASE` |
| **Admin Audit Logs UI** | 3 | 4 | 2 | 1 | 4 | 5 | **23 / 30** | `USEFUL BUT OPTIONAL` |
| **Orphan Media Garbage Collection UI** | 2 | 4 | 2 | 1 | 4 | 5 | **22 / 30** | `USEFUL BUT OPTIONAL` |
| **E-Commerce Checkout & Payment Gateway** | 5 | 3 | 5 | 5 | 1 | 1 | **12 / 30** | `REJECT (OUT OF SCOPE)` |
| **Automated Shipping Calculator** | 3 | 2 | 4 | 4 | 1 | 1 | **11 / 30** | `REJECT (OUT OF SCOPE)` |

---

## 3. Scope Boundaries & Policy

To preserve app stability and village market focus, the following features remain **EXPLICITLY REJECTED**:
* Public buyer user registration / consumer cart / checkout system.
* Payment gateway integrations (Midtrans, Xendit, etc.).
* Automated shipping cost calculators / courier APIs.
* Automated WhatsApp Business API bots.
