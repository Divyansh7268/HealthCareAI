# Glasgow Coma Scale (GCS)

The VirtualCare offline rule engine includes support for the Glasgow Coma Scale.

## Reference
Teasdale G, Jennett B. Assessment of coma and impaired consciousness. A practical scale. Lancet. 1974 Jul 13;2(7872):81-4.

Updated definitions: Teasdale G, et al. The Glasgow Coma Scale at 40 years: standing the test of time. Lancet Neurol. 2014.

## Implementation Details

The implementation (`src/clinical/gcs/gcsCalculator.js`) uses the standard 3-component score (Eye, Verbal, Motor).

### Components

1. **Eye Opening (E)** - Max 4
2. **Verbal Response (V)** - Max 5
3. **Motor Response (M)** - Max 6

Total scores range from 3 to 15.

### Interpretations
While GCS is primarily a continuous tracking metric, the engine applies standard clinical interpretation boundaries to trigger offline red flags:
- **Severe impairment (3-8)**: Triggers emergency escalation.
- **Moderate impairment (9-12)**: Triggers urgent assessment flag.
- **Mild impairment (13-14)**: Triggers warning.
- **Normal (15)**: No action required.
