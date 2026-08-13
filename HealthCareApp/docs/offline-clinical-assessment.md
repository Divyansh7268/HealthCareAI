# Offline Clinical Assessment

When VirtualCare is disconnected from the internet, it cannot rely on the Gemini Multimodal AI for probabilistic clinical reasoning. Instead, it falls back to a deterministic offline assessment engine (`src/clinical/offlineAssessment.js`).

## Architecture

The offline assessment orchestrates several deterministic modules:

1. **NEWS2 Calculator**: Calculates a risk score based on vitals.
2. **GCS Calculator**: Calculates coma scale if consciousness is impaired.
3. **Vital Sign Rule Engine**: Checks for extreme, physically impossible, or immediately life-threatening physiological outliers (e.g. SpO2 < 50%).
4. **Red Flag Engine**: Scans text input for predefined medical emergency keywords (e.g., "chest pain", "unconscious").
5. **Completeness Validator**: Checks for missing required data.

## Overall Status Calculation

The system distils these inputs into one of the following overall status labels:

1. **Emergency review recommended**: Triggered by a NEWS2 score > 6, or any Red Flag keyword.
2. **Urgent review recommended**: Triggered by a NEWS2 score of 5-6, or any vital sign boundary warning.
3. **Clinical concern**: Triggered by a NEWS2 score containing a single parameter score of 3.
4. **Unable to assess**: Triggered if vital signs are too incomplete to run NEWS2.
5. **No immediate red flag detected**: All scores normal.

## Storage and Sync

Offline assessments are saved to the `offline_assessments` table in the local SQLite database.
When connectivity is restored, the `SyncManager` uploads the visit data to the backend, which *then* runs the full Gemini AI Assessment. Both the offline and online assessments are preserved.
