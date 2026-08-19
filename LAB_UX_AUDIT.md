# Vuln-World Lab UX & Investigation Flow Audit

| Lab | Realistic UI | Normal Workflow | Relevant HTTP Request Discoverable | Burp Investigation Possible | Vulnerability Understandable | Hints Useful | Completion Meaningful | Reset Works | Mobile Responsive | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| SocialSphere (IDOR, BOLA, XSS) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| BookBay (SQLi) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| PixDrop (SSRF) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| FindIt (Reflected XSS) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| FileVault (Path Traversal, Cmd Inj) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| PayDesk (CSRF) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| ProfileHub (File Upload) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| MailBox (Auth/Session) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| AccountHub (JWT) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| DataHub (CORS) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| DropMart (Race Condition) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| TemplateWorks (SSTI) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| LinkHub (Open Redirect) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| ProjectHub (Info Disclosure/Misconfig) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| ShopZone (Business Logic/API Manip) | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |

### UX Audit Notes
* **SocialSphere**: Completely redesigned with a realistic feed, sidebar, and profile navigation. The `?id=2` parameter is now naturally discoverable by clicking on a friend's profile, allowing learners to intercept it via Burp Suite and observe the server incorrectly returning private contact details for unauthorized users.
* **BookBay**: The search bar organically generates `GET /search?q=` allowing easy parameter manipulation.
* **PixDrop**: URL import form organically generates `GET /import?url=` demonstrating server-side fetch behavior.
* **FileVault**: Download links naturally generate `GET /download?file=public.txt`.
* **Universal Improvements**: All labs now inherit the `shared/style.css` which enforces a clean, mobile-responsive layout, cards, predictable typography, and centered containers. Empty states and realistic placeholders are utilized across the platform.
