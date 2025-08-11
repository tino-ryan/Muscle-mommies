
# Version Control 

## Version Control Setup

We use **Git** as our version control system, hosted on **GitHub** for repository management. Git provides distributed version control with strong branching and merging features. GitHub offers collaborative features like pull requests, issues, and CI/CD integration.

### Why Git and GitHub?
- Industry standard with wide adoption
- Strong community and tooling support
- Easy branching, merging, and collaboration
- Integration with CI/CD pipelines

### Issues Faced
- Initial learning curve for new team members
- Merge conflicts during parallel development

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

### Committing Code
- Use `git` commands to manage commits and branches
- Run linter before commit to ensure code quality
- Consider adding git hooks (e.g., Husky) to automate lint checks before commit (future improvement)

## Summary

The chosen version control and linting setup provide a robust framework to maintain code quality, improve collaboration, and automate formatting. While setup had challenges, the end result supports a smoother development workflow with consistent style and fewer bugs.
