# Ist

Ist is a micro-app that reads your task list from [Todoist](https://todoist.com/), then displays the most important task that can currently be worked on.

If you paste a [Dynalist](https://dynalist.io/) URL into a Todoist comment, it will be converted into an interactive checklist.

For more about the design of this app, see [the project proposal](/strategy/strategy.md).

LLM Tooling Disclosure: I manually wrote all human-readable text (including this document). I can read and understand Javascript, but have always found manual development overly laborious (and TypeScript impossible) due to a seemingly impassable comprehension ceiling. As of the summer of 2025, I use various LLMs via VS Code extensions (e.g. Cline, Continue) to explain and modify sections of code. I review all generated code, and frequently reject it and tighten my specifications. This tooling has allowed me to convert the codebase to TypeScript, vastly improve architectural design, and quickly add occasional new features. I minimize tech debt through ESLint rules and regularly reviewing the Dependency Cruiser graph.
