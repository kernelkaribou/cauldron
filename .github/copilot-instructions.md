# Development Instructions

## Workflow and Process

- Track the functional design and framework of the application internally for development context.
- Maintain the project README for public consumption with instructions, feature highlights, and design (architecture and security). No emojis. Not overly technical or verbose — only what matters.
- Use GitHub as the remote repository.
- Always publish to a `dev` branch. Use feature branches pushed to `dev` (automated). The developer creates PRs from `dev` to `main` and handles releases manually.
- Maintain a VERSION file. Before any merge to `main`, ensure VERSION reflects the appropriate number (developer will signal when ready).
- CI/CD: pushing to `dev` creates a dev tag package for testing; pushing to `main` builds the latest release package.
- Break disparate tasks into individual approaches — never lump together.
- Docker is the preferred environment for both the end result and testing.
- Test code with minimal host changes: use virtual environments (Python) or local Docker builds.
- Unit test coverage is required as we approach a release.

## Quality and Security

- Audits always consider security, performance, best practices, and reusability — use the rubber duck method.
- Any new feature added or full feature removal gets a full audit after implementation.
- No backwards compatibility code paths until the application is actually released (out of alpha). Breaking changes for existing implementations are acceptable during alpha.

## Branch Discipline

- Always check `dev` commit history vs `main` when starting new tasks.
- Feature branches merge into `dev` only.
