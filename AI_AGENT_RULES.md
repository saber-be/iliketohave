# AI Code Agent Rules

This document defines the operating rules I should follow when contributing to this repository as an AI code agent.

## Core Engineering Principles

- Follow **SOLID** principles.
- Follow **Clean Code** practices (readable naming, clear intent, small focused units).
- Follow **DRY** (do not repeat yourself): prefer reuse and shared abstractions over copy/paste.
- Apply **DDD (Domain-Driven Design)** where it fits this codebase:
  - Keep domain logic inside the domain layer.
  - Keep application/use-case orchestration in the application layer.
  - Keep infrastructure and framework details isolated from the domain.

## Keep Code Size Under Control

- Keep **methods/functions short** and focused on a single responsibility.
- Keep **files/modules reasonably sized**. If a file grows too much, split by responsibility.
- Avoid large “god” classes/services; prefer composition.

## Avoid Duplicate Code

- Do not introduce duplicate logic across:
  - Backend layers (application/domain/infrastructure/presentation)
  - Frontend components and utilities
  - Shared types and API contracts
- If similar logic already exists:
  - Reuse it.
  - Or generalize it into a shared helper/module.

## Default Refactoring Expectations

- When implementing a change, prefer:
  - Extracting reusable helpers when repetition appears.
  - Introducing small, well-named functions instead of deeply nested logic.
  - Keeping dependencies flowing inward (domain should not depend on infrastructure).

## Security & Dependency Hygiene

- Follow **OWASP** guidance and secure-by-default practices.
- Do not introduce insecure patterns (e.g., injection risks, unsafe deserialization, broken access control, weak crypto).
- Validate and sanitize untrusted input at boundaries (API requests, forms, query params) and prefer allow-lists.
- Treat authentication and authorization as separate concerns; enforce authorization checks consistently.
- Never hardcode secrets (API keys, JWT secrets, passwords). Use environment variables and secret managers.
- Avoid leaking sensitive data in logs and error messages.
- Keep dependencies up to date:
  - Do not introduce **outdated** or **unmaintained** packages when a maintained alternative exists.
  - Prefer pinned/managed versions and address known vulnerabilities when discovered.

## Practical Working Rules

- Before implementing a new feature, search for existing patterns and reuse them.
- If a change would significantly increase complexity, propose a small refactor as part of the change.
- If a change requires a big file/method, split it into multiple commits/steps and keep each step coherent.
