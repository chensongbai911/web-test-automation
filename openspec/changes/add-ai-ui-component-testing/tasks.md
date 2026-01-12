## 1. Implementation

- [ ] 1.1 Implement `src/ai-component-recognizer.js` (framework detect, component classify, metadata extract)
- [ ] 1.2 Integrate recognizer into `src/content-script.js` and `src/ai-test-orchestrator.js`
- [ ] 1.3 Build Strategy Library (Select/DatePicker/Cascader/Upload/Checkbox/Radio/Switch/Slider)
- [ ] 1.4 Add adaptive waits, retries, and healing for dynamic panels and async states
- [ ] 1.5 Implement AI Data Generator (valid dates, options, numeric ranges, text)
- [ ] 1.6 Persist AI artifacts (`aiInsights`, component metadata) to storage
- [ ] 1.7 Expand `src/report.js` with coverage progress and AI decision timeline (component-level when available)
- [ ] 1.8 Optional UI tools (floating-ball): quick component overlay, interaction preview
- [ ] 1.9 Update `manifest.json` only if new modules require permissions

## 2. Validation

- [ ] 2.1 Unit sanity in content-script interactions for each component type
- [ ] 2.2 Run smoke tests on pages using Element Plus and Ant Design Vue
- [ ] 2.3 Verify reporting sections load without errors and reflect AI artifacts

## 3. Documentation

- [ ] 3.1 Update `README.md` with AI UI testing overview
- [ ] 3.2 Add `UI_COMPONENT_TESTING_OPTIMIZATION.md` references in project docs
