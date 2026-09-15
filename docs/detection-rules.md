# pgArmor Detection Rules

> Initial catalog of deterministic security detection rules for PostgreSQL Row-Level Security (RLS).
> This document is a working proposal and is subject to review and validation.

## Rule Structure

Each detection rule should contain:

- **Rule ID**
- **Title**
- **Severity**
- **Category**
- **Description**
- **Detection Logic**
- **Evidence**
- **Potential Impact**
- **Recommendation**
- **False Positive Considerations**

---

## RLS-001 — Role with BYPASSRLS capability

**Severity:** High  
**Category:** RLS Bypass

### Description

Detects roles with the PostgreSQL `BYPASSRLS` attribute when those roles may interact with tables protected by Row-Level Security.

Roles with `BYPASSRLS` are not subject to RLS policies.

### Detection Logic

A finding is generated when:

1. A role has `BYPASSRLS = true`.
2. The database contains tables protected by RLS.
3. The role has privileges or inherited access that allows interaction with those tables.

### Evidence

The finding should identify:

- Role
- BYPASSRLS status
- Affected table(s)
- Relevant privileges

### Potential Impact

The role may access or modify rows without the restrictions imposed by the table's RLS policies.

### Recommendation

Verify whether `BYPASSRLS` is explicitly required for the role. Remove the capability from application or user roles that should be restricted by RLS.

### False Positive Considerations

`BYPASSRLS` is not inherently a vulnerability. Administrative or trusted internal roles may legitimately require it.

The finding should therefore consider the role's effective access to RLS-protected tables rather than flagging every role with `BYPASSRLS`.
