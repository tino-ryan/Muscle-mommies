# Version Control

## Version Control Setup

We use **Git** as our version control system, hosted on **GitHub** for repository management. Git provides distributed version control with strong branching and merging features. GitHub offers collaborative features like pull requests, issues, and CI/CD integration.

### Why Git and GitHub?

- Industry standard with wide adoption
- Strong community and tooling support
- Easy branching, merging, and collaboration
- Integration with CI/CD pipelines

### Issues Faced

-

### Pros

- Robust tracking of project history
- Facilitates team collaboration
- Integrates well with many tools

### Cons

- Complex commands for beginners
- Merge conflicts require manual resolution

## Linting Setup

### Tools Used

- **ESLint**: Primary linter for JavaScript and React code
- **Prettier**: Code formatter integrated with ESLint for consistent styling
- **eslint-plugin-react**: React specific linting rules
- **eslint-plugin-prettier**: Runs Prettier as an ESLint rule
- **@eslint/js**: Base JavaScript config
- **@eslint/markdown**: Linting support for Markdown files

### Why ESLint and Prettier?

- ESLint allows customizable linting rules and supports plugins
- Prettier enforces consistent code formatting automatically
- Integration between ESLint and Prettier avoids conflicts and streamlines dev workflow
- Support for React via plugins
- Markdown linting improves documentation quality

### Configuration Approach

- Used ESLint flat config with `eslint.config.mjs` for modern config style
- Separate overrides for JS, React, Markdown, and test files
- Disabled linting for CSS files as it's out of ESLint scope
- Added React version detection in settings for compatibility
- Enabled Prettier as an ESLint plugin to catch formatting issues during linting

### Issues Faced

- Initial plugin resolution errors due to mismatched plugin names and config structure
- TypeErrors due to outdated plugin API usage (e.g., `sourceCode.getAllComments`)
- Nested `extends` not supported in flat config style, required flattening configs
- Conflicts between ESLint rules and Prettier formatting handled by using `eslint-config-prettier`

### Pros

- Enforces both stylistic and code quality rules
- Catches bugs early with static analysis
- Prettier integration reduces bike-shedding about code style
- Customizable per file type and environment

### Cons

- Initial setup complexity and trial-and-error to get working config
- Some learning curve understanding ESLint flat config
- Requires developers to use compatible editor integrations or run scripts

## Usage Instructions

### Running Linting

- Run `npx eslint .` to check linting errors
- Run `npx eslint . --fix` to auto-fix fixable issues

### VSCode Integration

- Install ESLint and Prettier extensions
- Enable **Format On Save** and ESLint validation in VSCode settings
- Use workspace settings to enforce consistency across team

---

## Semantic Versioning Rules

Format: **MAJOR.MINOR.PATCH**

- **MAJOR**: Breaking changes.
- **MINOR**: New features, backwards compatible.
- **PATCH**: Bug fixes or small changes.

Example progression:

```bash
v1.0.0  → Sprint 1 release
v1.1.0  → Sprint 2 adds features
v1.1.1  → Sprint 3 fixes bugs
```

### Why semantic versioning Rules

- Brendan Griffiths advised this one during the lecture on 14/08/2024 and the team was not familiar with any other versioning methodologies
- Clear and consisntent method which can be understood by Devs all around the world
- Helps with planning sprints and releases
  -Makes it easier to track which features or fixes are in which sprint

---

## Version Tagging – Detailed Guide

We use **Semantic Versioning (MAJOR.MINOR.PATCH)** to clearly communicate the scope of changes in each release.

**What Counts as a Version Change?**

**MAJOR**\
Increase this when we introduce breaking changes — anything that forces developers or users to change how they use the system.

**Examples:**

- Changing database schema in a way that breaks old data
- Removing or renaming API endpoints

**Reason:** Breaking changes require planning for migration, so they must be clearly signaled.

**MINOR**\
Increase this when we add new features that are backward compatible.

**Examples:**

- Adding a new dashboard page
- Introducing an optional API parameter

**Reason:** Signals that the release contains new capabilities but won’t break existing use cases.

**PATCH**\
Increase this for backward-compatible bug fixes or minor improvements.

**Examples:**

- Fixing typos in the UI
- Patching a security vulnerability without changing the interface

**Reason:** Lets the team push out urgent fixes quickly without disrupting feature development.

---

**How to Tag in Git**

**Annotated Tag (Recommended)**\
Includes metadata like author, date, and a description.

```bash
git tag -a v1.0.0 -m "Initial stable release"
git push origin v1.0.0
```

**Lightweight Tag**\
Just a pointer to a commit (not recommended for official releases).

```bash
git tag v1.0.0
git push origin v1.0.0
```

---

**When to Tag**

- **End of each sprint** → Tag the merged `main` branch with a new version.
- **After a hotfix** → Tag `main` immediately so the fix is tracked historically.
- **For major milestones** → Even if not a sprint end, big completed features can be tagged for reference.

---

**9.4 Pre-Release Tags**

For versions not yet ready for production but needing tracking:

```bash
git tag -a v1.0.0-beta.1 -m "Beta release for testing"
git push origin v1.0.0-beta.1
```
