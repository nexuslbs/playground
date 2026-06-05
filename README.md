# 🤖 Playground

A sandbox for testing AI agents across multiple projects.

This repo contains various projects, code snippets, and scenarios used to evaluate and debug autonomous coding agents — from simple tasks to complex multi-step workflows.

## Purpose

- **Agent evaluation** — test how agents handle real-world coding tasks
- **Workflow testing** — experiment with PRs, code reviews, CI/CD, and multi-agent coordination
- **Integration demos** — showcase agent capabilities with different languages, frameworks, and toolchains
- **Reproduction cases** — isolate and reproduce edge cases for agent debugging
- **GitHub App auth** — verify agent identity and permission models end-to-end

## Structure

Projects live in top-level directories, each with its own context and instructions.

| Directory | Purpose |
|-----------|---------|
| *add directories here as projects are created* |

### Adding a new project

1. Create a directory with a descriptive name (e.g., `python-api-demo/`)
2. Add a `README.md` inside it describing the project and what the agent should do
3. Optionally include `AGENTS.md` or `.cursorrules` for agent-specific context

## How agents interact with this repo

This repo uses **branch + PR workflow** — direct pushes to `main` are blocked by branch protection. Agents should:

1. Create a feature branch from `main`
2. Make changes
3. Open a PR
4. Have it reviewed and merged

The GitHub App `hermes-nexuslbs` is installed on this org with Pull Requests (Read & Write) and Contents (Read) permissions for autonomous agent operations.

## Contributing

This is an agent testing ground — feel free to throw in projects, bugs, or challenges that you'd like to see an agent tackle. Open a PR or create an issue to suggest scenarios.

---

*Maintained by [NexusLabs](https://github.com/nexuslbs)*
