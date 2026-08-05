# Phase C & H — Security & Role Matrix Report

## Security Audit & Access Control

### 1. Capability & Role Matrix Enforcement
- **`SUPER_ADMIN`**: Global capabilities (`dashboard:view`, `dashboard:view-global-summary`, `umkms:view-all`, `products:view-all`, `users:view`, `analytics:view-global`, `audit:view-global`, `users:create-superadmin`, etc.).
- **`ADMIN`**: Operational global management access based on policy.
- **`PERANGKAT_DESA`**: Operational access to catalog management (`umkms:view-all`, `products:view-all`, `analytics:view-global`), restricted from user management and global audit logs.
- **`PELAKU_UMKM`**: Owner-scoped access (`umkms:view-own`, `products:view-own`), hidden from all global administration routes.

### 2. Password & Session Security Contract
- **Self-Service Change Password**:
  - Verifies current password hash via Argon2id.
  - Rejects new password if identical to current password.
  - Requires minimum length of 8 characters.
  - Revokes all active sessions upon successful password change.
  - Clears session cookies safely.
  - Audit log event `auth.password_changed` recorded without sensitive credentials or hashes.

### 3. Metadata Redaction
- Centralized `sanitizeMetadata` helper recursively redacts sensitive key patterns (`password`, `secret`, `token`, `hash`, `cookie`, `csrf`, `authorization`, `connectionstring`, etc.) from all audit log views and exports.
