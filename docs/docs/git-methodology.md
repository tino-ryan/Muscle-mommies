# Git Methodology 

This document explains how our team will use a git during the ThriftFinder project.  
We are using a **Hybrid GitHub Flow** with a dedicated `dev` branch for sprint development and `main` for stable releases.  
The `docs` branch will be used to deploy documentation.

---

## Branch Structure

| Branch         | Purpose | Rules |
|----------------|---------|-------|
| `main`         | Production-ready, stable code. | Only merge from `dev` at the end of a sprint. Tag each release. |
| `dev`          | Integration branch for current sprint work. | All features and fixes branch off here. |
| `feature/*`    | Individual new features. | Create from `dev` and merge back into `dev` via Pull Request (PR). |
| `fix/*`        | Bug fixes for `dev` work. | Create from `dev` and merge back into `dev` via PR. |
| `hotfix/*`     | Urgent fixes for `main`. | Create from `main`, merge into both `main` and `dev`. |
| `docs`         | Deployment branch for documentation site (e.g., Docusaurus). | Merges only from `main` after each sprint or doc updates. |

---

## Why hybrid
- Github flow is simpler works for small teams and short timelines but lacks  a dev branch
- Git flow is very controlled and robust but  has too much branch handling and our project is not large enough to make the additional effort worth it 
-We want the simplicity of github flow with the addition of a dev branch to ensure our deployed main branch is always perfect
---

##  Workflow Overview

### Cloning the Repository
```bash
git clone https://github.com/tino-ryan/Muscle-mommies.git
cd Muscle-mommies
```

### Updating Your Local Copy
Always update your local `dev` before starting work:
```bash
git checkout dev
git pull origin dev
```

### Creating a Feature Branch
```bash
git checkout dev
git pull origin dev
git checkout -b feature/<short-description>
```
Example:
```bash
git checkout -b feature/add-chat-interface
```

### Working on Your Branch
- Make small, frequent commits.
- Follow **Conventional Commit** format:
```
feat(scope): short description
fix(scope): short description
```
Example:
```bash
git add .
git commit -m "feat(chat): add emoji picker"
```

### Pushing Changes
```bash
git push -u origin feature/<short-description>
```

### Merging a Feature into `dev`
1. Open a Pull Request (PR) in GitHub from your feature branch into `dev`.
2. Request a review.
3. Resolve comments and approve.
4. Merge via GitHub’s interface.
5. Delete the branch after merge.

---

## Sprint Release Process

At the end of each sprint:
1. Merge `dev` into `main`:
```bash
git checkout main
git pull origin main
git merge dev
```
2. Tag the release (Semantic Versioning: MAJOR.MINOR.PATCH):
```bash
git tag -a v1.1.0 -m "Sprint 1 release: added chat module and store analytics"
git push origin v1.1.0
```
3. Deploy production from `main`.

---

## Hotfix Process

If production has a critical bug:
```bash
git checkout main
git pull origin main
git checkout -b hotfix/fix-login-issue
```
- Make the fix.
- Commit and push.
- Merge into `main` **and** `dev`:
```bash
git checkout main
git merge hotfix/fix-login-issue
git checkout dev
git merge hotfix/fix-login-issue
```
- Tag and deploy if needed.

---

## Documentation Deployment (`docs` Branch)

Our documentation ( Docusaurus) is deployed from the `docs` branch.

### Updating Docs:
```bash
# Switch to main to get the latest
git checkout main
git pull origin main

# Switch to docs branch
git checkout docs
git merge main

# Build and deploy
npm run build
git push origin docs
```

---

## Git Command Reference

| Task | Command |
|------|---------|
| Clone repo | `git clone <url>` |
| Switch branch | `git checkout <branch>` |
| Create new branch | `git checkout -b <branch>` |
| Pull latest changes | `git pull origin <branch>` |
| Stage changes | `git add .` |
| Commit changes | `git commit -m "<message>"` |
| Push changes | `git push origin <branch>` |
| Tag a release | `git tag -a vX.X.X -m "message"` |
| Push tags | `git push origin vX.X.X` |

---

## Best Practices

- Keep branches small and focused.
- Commit often with clear messages.
- Always pull before pushing to avoid conflicts.
- Use PR reviews to maintain quality.
- Keep `main` production-ready at all times.

---
