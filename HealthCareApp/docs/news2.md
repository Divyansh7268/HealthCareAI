# National Early Warning Score (NEWS) 2

The VirtualCare offline rule engine implements the NEWS2 scoring system.

## Reference
Royal College of Physicians. National Early Warning Score (NEWS) 2: Standardising the assessment of acute-illness severity in the NHS. Updated report of a working party. London: RCP, 2017.

## Implementation Details

The implementation (`src/clinical/news2/news2Calculator.js`) adheres strictly to **Scale 1** (the standard scale). 
**Scale 2** (for patients with hypercapnic respiratory failure and a target SpO2 of 88-92%) is supported in the codebase but currently disabled in the UI pending clinical safety review.

### Scored Parameters
- Respiration rate
- SpO2 (Scale 1)
- Supplemental Oxygen use
- Systolic blood pressure
- Pulse
- Consciousness (AVPU - Alert, Voice, Pain, Unresponsive, **Confused**)
- Temperature

### Risk Categories & Escalation
Total scores are categorized into:
- **Low Risk** (Score 0-4)
- **Low-Medium Risk** (Score of 3 in any single parameter) - Triggers escalation flag.
- **Medium Risk** (Score 5-6) - Triggers escalation flag.
- **High Risk** (Score 7 or more) - Triggers escalation flag.

Any generated NEWS2 score is appended with a mandatory disclaimer:
> "NEWS2 is a risk-stratification score. It does not diagnose a condition. Clinical judgment is required in all cases."
