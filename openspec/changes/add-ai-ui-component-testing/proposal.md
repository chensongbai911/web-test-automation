# Change: Add AI-Enhanced UI Component Testing

## Why

Current automation fails on modern UI frameworks (Element Plus, Ant Design Vue, Naive UI) due to complex DOM structures and non-native interaction patterns. We need an AI-driven approach to recognize components, apply correct interactions, and generate valid data to increase coverage and reliability.

## What Changes

- Introduce AI Component Recognizer to detect UI frameworks and component types.
- Add Strategy Library with framework-specific interaction flows (Select, DatePicker, Cascader, Upload, etc.).
- Add AI Data Generator for valid inputs (dates, options, numeric ranges, text with rules).
- Enhance Execution Engine with adaptive waits, retries, and healing.
- Expand Reporting to visualize coverage, AI decisions, and component-level results.
- Persist AI artifacts (`aiInsights`, component metadata) for report.

## Impact

- Specs affected: `ui-testing` capability.
- Code impact: `src/ai-component-recognizer.js`, `src/complex-form-handler.js`, `src/content-script.js`, `src/ai-test-orchestrator.js`, `src/report.js`, `src/floating-ball.js` (optional UI), `manifest.json` (if needed for modules).
