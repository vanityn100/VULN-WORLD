# Vuln-World Lab Audit Matrix (Learning Authenticity)

| Vulnerability | Lab | Authenticity Classification | Burp Investigation | Completion | Reset | Safety | Status |
|---------------|-----|---------------------------|--------------------|------------|-------|--------|--------|
| IDOR | SocialSphere | **Genuine** | ✓ | ✓ | ✓ | ✓ | PASS |
| BOLA | SocialSphere | **Genuine** | ✓ | ✓ | ✓ | ✓ | PASS |
| Broken Access Control | SocialSphere | **Genuine** | ✓ | ✓ | ✓ | ✓ | PASS |
| Stored XSS | SocialSphere | **Genuine** | ✓ | ✓ | ✓ | ✓ | PASS |
| SQL Injection | BookBay | **Genuine** | ✓ | ✓ | ✓ | ✓ | PASS |
| SSRF | PixDrop | **Controlled** | ✓ | ✓ | ✓ | ✓ | PASS |
| CSRF | PayDesk | **Genuine** | ✓ | ✓ | ✓ | ✓ | PASS |
| Reflected XSS | FindIt | **Genuine** | ✓ | ✓ | ✓ | ✓ | PASS |
| Path Traversal | FileVault | **Controlled** | ✓ | ✓ | ✓ | ✓ | PASS |
| Command Injection | FileVault | **Simulation** | ✓ | ✓ | ✓ | ✓ | PASS |
| File Upload | ProfileHub | **Simulation** | ✓ | ✓ | ✓ | ✓ | PASS |
| Weak Authentication | MailBox | **Genuine** | ✓ | ✓ | ✓ | ✓ | PASS |
| JWT Vulnerabilities | AccountHub | **Simulation** | ✓ | ✓ | ✓ | ✓ | PASS |
| CORS Misconfiguration | DataHub | **Genuine** | ✓ | ✓ | ✓ | ✓ | PASS |
| Race Conditions | DropMart | **Genuine** | ✓ | ✓ | ✓ | ✓ | PASS |
| SSTI | TemplateWorks | **Simulation** | ✓ | ✓ | ✓ | ✓ | PASS |
| Open Redirect | LinkHub | **Genuine** | ✓ | ✓ | ✓ | ✓ | PASS |
| Information Disclosure | ProjectHub | **Genuine** | ✓ | ✓ | ✓ | ✓ | PASS |
| Security Misconfiguration| ProjectHub | **Genuine** | ✓ | ✓ | ✓ | ✓ | PASS |
| Business Logic | ShopZone | **Genuine** | ✓ | ✓ | ✓ | ✓ | PASS |
| API Parameter Manipulation| ShopZone | **Genuine** | ✓ | ✓ | ✓ | ✓ | PASS |

### Classification Key
* **Genuine**: The actual vulnerable mechanism exists natively (e.g., real database queries, real HTTP session misconfigurations, real DOM manipulation).
* **Controlled**: A genuine vulnerable mechanism exists but is deliberately restricted/sandboxed at the code level to prevent arbitrary host exploitation (e.g., constrained `http.get`, path boundary checks).
* **Simulation**: The application conceptually imitates the vulnerability using safe conditional responses or simple string matching without implementing the underlying dangerous mechanism (e.g., no actual `child_process`, no actual JWT signature parser, no true template engine).
