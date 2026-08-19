# Vuln-World Difficulty Audit

## Overview
This document outlines the difficulty model and audit for the Vuln-World platform, ensuring that difficulty reflects actual investigation complexity and application architecture rather than artificial obfuscation.

### Difficulty Definitions
*   **BEGINNER**: Learn the vulnerability. The vulnerability is typically accessible via a single endpoint with an obvious parameter.
*   **INTERMEDIATE**: Investigate the application. The vulnerability requires interacting with multiple endpoints, understanding session state, or analyzing API data flows.
*   **ADVANCED**: Analyze a realistic attack surface. The vulnerability involves complex multi-step workflows, interrelated endpoints, background processing, or architecture-level boundaries.

---

## Lab Audit

### SocialSphere
*   **Vulnerabilities**: IDOR (Beginner), Broken Access Control (Beginner), BOLA (Intermediate), Stored XSS (Intermediate), Broken Function-Level Auth (Intermediate)
*   **Why this difficulty is appropriate**: IDOR is straightforward (change parameter), while BOLA and Stored XSS require understanding multiple endpoints (creation vs. rendering/API fetches) and maintaining session state across a realistic social feed architecture.
*   **Safety boundaries**: All data is local mock infrastructure.
*   **Status**: PASS

### BookBay
*   **Vulnerabilities**: SQL Injection (Intermediate)
*   **Why this difficulty is appropriate**: It requires the learner to understand how the search input traverses through a realistic cart and checkout architecture without breaking the application logic.
*   **Safety boundaries**: Uses local SQLite.
*   **Status**: PASS

### TemplateWorks
*   **Vulnerabilities**: SSTI (Advanced)
*   **Why this difficulty is appropriate**: The learner must map the lifecycle of an email campaign (creation, saving, editing, and previewing) and identify that the rendering API is a separate processing step that unsafely interprets the stored template string.
*   **Safety boundaries**: RCE is disabled; only context data extraction is supported.
*   **Status**: PASS

### PixDrop
*   **Vulnerabilities**: SSRF (Intermediate)
*   **Why this difficulty is appropriate**: The learner must identify that the application fetches URLs on behalf of the user, and test whether it respects internal boundaries.
*   **Safety boundaries**: Only fetches predefined localhost endpoints.
*   **Status**: PASS

### ShopZone
*   **Vulnerabilities**: API Parameter Manipulation (Beginner), Business Logic (Intermediate)
*   **Why this difficulty is appropriate**: The user must interact with multiple stages (cart, checkout) and deduce how total cost is calculated and manipulated before the final order is placed.
*   **Safety boundaries**: Mock checkout, no real payments.
*   **Status**: PASS

### MailBox
*   **Vulnerabilities**: Weak Authentication (Beginner), Session Management Issues (Intermediate), Password Reset Vulnerabilities (Intermediate)
*   **Why this difficulty is appropriate**: The learner interacts with authentication flows that reflect common architectural mistakes, rather than just simple query parameters.
*   **Safety boundaries**: Hardcoded mock credentials.
*   **Status**: PASS

### AccountHub
*   **Vulnerabilities**: JWT Vulnerabilities (Intermediate), Privilege Escalation (Intermediate)
*   **Why this difficulty is appropriate**: Requires manipulating claims and understanding token-based authorization structures across a realistic hub.
*   **Safety boundaries**: Hardcoded mock JWT secrets.
*   **Status**: PASS

### FileVault
*   **Vulnerabilities**: Path Traversal (Beginner), Command Injection (Advanced)
*   **Why this difficulty is appropriate**: Path traversal is simple (parameter manipulation). Command injection requires interacting with a more complex system API and finding the vulnerable boundary.
*   **Safety boundaries**: No real shell execution, simulated filesystem boundaries.
*   **Status**: PASS

### DropMart
*   **Vulnerabilities**: Race Conditions (Advanced)
*   **Why this difficulty is appropriate**: The learner must understand state transitions between inventory check, cart, and payment, and execute concurrent requests before the state finalizes.
*   **Safety boundaries**: Isolated state variables.
*   **Status**: PASS

### DataHub
*   **Vulnerabilities**: CORS (Intermediate), Broken Authorization (Intermediate)
*   **Why this difficulty is appropriate**: The learner must manipulate HTTP headers (Origin) and analyze the API responses to extract cross-origin data.
*   **Safety boundaries**: Safe mock responses.
*   **Status**: PASS

### PayDesk
*   **Vulnerabilities**: CSRF (Intermediate)
*   **Why this difficulty is appropriate**: The learner must understand state-changing requests and build an exploit to forge them from an external origin.
*   **Safety boundaries**: Local mock endpoints.
*   **Status**: PASS

### ProfileHub
*   **Vulnerabilities**: File Upload (Intermediate)
*   **Why this difficulty is appropriate**: The learner must interact with multipart form data and bypass content-type and extension filters.
*   **Safety boundaries**: Mock processing.
*   **Status**: PASS

### LinkHub
*   **Vulnerabilities**: Open Redirect (Beginner)
*   **Why this difficulty is appropriate**: Simple GET request manipulation that redirects the browser. Perfect for teaching the concept.
*   **Safety boundaries**: Does not execute scripts.
*   **Status**: PASS

### ProjectHub
*   **Vulnerabilities**: Information Disclosure (Beginner), Security Misconfiguration (Beginner)
*   **Why this difficulty is appropriate**: The learner simply needs to inspect the full API JSON responses or error messages to find exposed data.
*   **Safety boundaries**: Mock sensitive data.
*   **Status**: PASS

### FindIt
*   **Vulnerabilities**: Reflected XSS (Beginner), DOM XSS (Advanced)
*   **Why this difficulty is appropriate**: Reflected is a simple URL parameter. DOM XSS requires understanding how JavaScript on the client side sinks untrusted data from the fragment or URL parameters into the DOM without sanitization.
*   **Safety boundaries**: Standard browser XSS mitigations apply.
*   **Status**: PASS
