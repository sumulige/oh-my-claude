# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.2.1](https://github.com/sumulige/sumulige-claude/compare/v1.1.2...v1.2.1) (2026-01-18)


### Fixed

* make git hooks executable ([e748915](https://github.com/sumulige/sumulige-claude/commits/e748915a2675664885c69d649133d7f8cc354f89))


* add comprehensive regression tests for core modules ([e3b570e](https://github.com/sumulige/sumulige-claude/commits/e3b570ed1998aefd8d75e2767e78f2d7611eb0b9))
* **release:** 1.2.0 ([03c0c30](https://github.com/sumulige/sumulige-claude/commits/03c0c3096d94293b48943a23cc69d618d940f386))
* significantly improve test coverage to 63.53% ([0b552e0](https://github.com/sumulige/sumulige-claude/commits/0b552e03a42f88587a641da0fa40cbf2f3b136d4))


### Changed

* update CHANGELOG with test coverage improvements ([d82cd19](https://github.com/sumulige/sumulige-claude/commits/d82cd19f97318ad96e7a67509622c2a9ffdcb643))
* update README with v1.2.0 changelog entry ([aa3cbc1](https://github.com/sumulige/sumulige-claude/commits/aa3cbc1d7bb438197e1fa477fcc44646eda97fe5))

## [1.2.0](https://github.com/sumulige/sumulige-claude/compare/v1.1.2...v1.2.0) (2026-01-17)


### Fixed

* make git hooks executable ([e748915](https://github.com/sumulige/sumulige-claude/commits/e748915a2675664885c69d649133d7f8cc354f89))


* add comprehensive regression tests for core modules ([e3b570e](https://github.com/sumulige/sumulige-claude/commits/e3b570ed1998aefd8d75e2767e78f2d7611eb0b9))

## [1.1.0](https://github.com/sumulige/sumulige-claude/compare/v1.0.11...v1.1.0) (2026-01-15)


### Changed

* sync documentation with v1.0.11 ([b00c509](https://github.com/sumulige/sumulige-claude/commits/b00c50928038bf8a4a655e81712420cd3294935d))


* add standard-version for automated releases ([32522fa](https://github.com/sumulige/sumulige-claude/commits/32522fa912dd26a4540cba10532c24d4e29e6daf))


### Added

* add test-workflow skill and enhance CLI commands ([972a676](https://github.com/sumulige/sumulige-claude/commits/972a6762411c5f863d9bfa3e360df7dc7f379aab))

## [1.0.11] - 2026-01-15

### Added
- Complete test suite with 78 tests across 5 modules
- Version-aware migration system (`lib/migrations.js`)
- `smc migrate` command for manual migration
- Auto-migration of old hooks format on `smc sync`
- Code simplifier integration

### Changed
- Modularized codebase for better maintainability

### Fixed
- Test coverage improvements

## [1.0.10] - 2026-01-15

### Added
- Conversation logger Hook (`conversation-logger.cjs`)
- Automatic conversation recording to `DAILY_CONVERSATION.md`
- Date-grouped conversation history

### Fixed
- Auto-migration for old hooks format

## [1.0.9] - 2026-01-15

### Fixed
- Clean up stale session entries

## [1.0.8] - 2026-01-14

### Added
- Skill Marketplace system with external repository support
- Auto-sync mechanism via GitHub Actions (daily schedule)
- 6 new marketplace commands: `list`, `install`, `sync`, `add`, `remove`, `status`
- Claude Code native plugin registry (`.claude-plugin/marketplace.json`)
- Skill categorization system (7 categories)
- Development documentation (`docs/DEVELOPMENT.md`)
- Marketplace user guide (`docs/MARKETPLACE.md`)

### Changed
- Refactored CLI into modular architecture (`lib/` directory)
- Streamlined README with dedicated documentation files

## [1.0.7] - 2026-01-13

### Changed
- Project template updates

## [1.0.6] - 2026-01-14

### Added
- Comprehensive Claude official skills integration via `smc-skills` repository
- 16 production-ready skills for enhanced AI capabilities:
  - **algorithmic-art**: p5.js generative art with seeded randomness
  - **brand-guidelines**: Anthropic brand colors and typography
  - **canvas-design**: Visual art creation for posters and designs
  - **doc-coauthoring**: Structured documentation workflow
  - **docx**: Word document manipulation (tracked changes, comments)
  - **internal-comms**: Company communication templates
  - **manus-kickoff**: Project kickoff templates
  - **mcp-builder**: MCP server construction guide
  - **pdf**: PDF manipulation (forms, merge, split)
  - **pptx**: PowerPoint presentation tools
  - **skill-creator**: Skill creation guide
  - **slack-gif-creator**: Animated GIFs for Slack
  - **template**: Skill template
  - **theme-factory**: 10 pre-set themes for artifacts
  - **web-artifacts-builder**: React/Tailwind artifact builder
  - **webapp-testing**: Playwright browser testing
  - **xlsx**: Spreadsheet operations

### Changed
- Updated hooks compatibility with latest Claude Code format
- Improved documentation with PROJECT_STRUCTURE.md and Q&A.md

### Fixed
- Hook format compatibility issues

## [1.0.5] - 2025-01-13

### Fixed
- Update hooks to new Claude Code format

## [1.0.4] - 2025-01-12

### Added
- Comprehensive smc usage guide in README

## [1.0.3] - 2025-01-11

### Fixed
- Template command now copies all files including commands, skills, templates

## [1.0.2] - 2025-01-11

### Added
- Initial stable release
