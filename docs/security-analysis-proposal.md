# Security Analysis Proposal

> Initial proposal for the security analysis model of pgArmor.
> This document is intended for discussion and does not represent the final architecture or implementation.

## 1. Objective

pgArmor aims to analyze PostgreSQL security configurations, with an initial focus on Row-Level Security (RLS), in order to identify potentially insecure configurations, excessive access, and authorization risks.

The goal is not only to verify whether RLS exists, but to understand the effective access that database roles may obtain through the combination of:

- RLS configuration
- Policies
- Roles and role memberships
- Privileges
- Table ownership
- RLS bypass capabilities

The analysis should produce structured security findings that explain the detected condition, its potential impact, supporting evidence, and possible remediation.

## 2. Initial Scope

The first version of the security analysis will focus exclusively on PostgreSQL.

Two possible analysis sources are considered:

### SQL files

pgArmor could analyze database definitions before deployment, including:

- Schema definitions
- Migrations
- RLS policies
- Roles and privileges

### Existing PostgreSQL database

pgArmor could connect to an existing PostgreSQL instance and inspect its security metadata directly.

The exact input mechanisms will be defined during the architecture phase.

## 3. Security Model

For each relevant database object, pgArmor should be able to understand the relationship between:

Database
→ Schema
→ Table
→ Roles
→ Privileges
→ RLS configuration
→ Policies
→ Effective access

The main question of the security engine should be:

> What access can a given role effectively obtain over the rows of a protected table?

This is more useful than simply checking whether a table has RLS enabled.

## 4. Information to Collect

The initial security model may require information about:

### Tables

- Schema
- Table name
- Owner
- RLS enabled/disabled
- FORCE ROW LEVEL SECURITY status

### Roles

- Login capability
- Role memberships
- Superuser status
- BYPASSRLS capability

### Privileges

Relevant privileges granted directly or inherited through roles.

### RLS Policies

For each policy:

- Policy name
- Target table
- Applicable roles
- Applicable command
- USING expression
- WITH CHECK expression
- Permissive/restrictive behavior

## 5. Detection Engine

The collected metadata should be transformed into a normalized security model.

A detection engine can then evaluate this model using deterministic security rules.

Initial detection categories may include:

- RLS bypass conditions
- Excessive role privileges
- Overly broad policies
- Unexpected policy exposure
- Incomplete or suspicious operation coverage
- Dangerous relationships between ownership, roles and RLS
- Potential multi-tenant isolation failures

Not every unusual configuration should automatically be considered a vulnerability.

Findings should distinguish between confirmed dangerous conditions, potentially risky configurations, and informational observations.

## 6. Security Findings

A finding should contain enough information to be independently understood and reviewed.

Proposed fields:

- Rule ID
- Title
- Severity
- Affected object
- Evidence
- Security impact
- Recommendation

Example:

```json
{
  "rule_id": "RLS-001",
  "title": "Role can bypass Row-Level Security",
  "severity": "high",
  "object": "role:app_backend",
  "evidence": {
    "bypassrls": true
  },
  "impact": "The role may access rows without RLS enforcement.",
  "recommendation": "Review whether BYPASSRLS is required for this role."
}
```

# 7. Initial MVP

The first technical milestone could be a small PostgreSQL laboratory containing intentionally secure and insecure RLS configurations.

`pgArmor` should be capable of:

* **Collecting** the relevant PostgreSQL security metadata.
* **Building** an internal representation of the security configuration.
* **Running** a small set of deterministic detection rules.
* **Producing** structured findings.

The first MVP **does not require AI/ML**.

Once the deterministic security analysis is reliable, AI-assisted analysis could be evaluated separately for tasks where it provides measurable value, such as:
* Contextual explanation
* Prioritization
* Remediation guidance

---

# 8. Open Questions

Before defining the final architecture, the project should clarify:

1. **Scope of Analysis:** Should the first MVP analyze a live PostgreSQL database, SQL files, or both?
2. **Database Version:** What PostgreSQL versions should initially be supported?
3. **Classification Criteria:** What security conditions should `pgArmor` classify as vulnerabilities versus warnings?
4. **Analysis Focus:** Should `pgArmor` initially focus only on RLS or include general PostgreSQL privilege analysis?
5. **Severity Scoring:** How should severity be calculated?
6. **Data Representation:** How should findings be represented internally?
7. **Architectural Boundaries:** Which components should belong to the core analysis engine versus the UI?
