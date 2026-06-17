// Owner-editable rule defaults (§9.1, §9.4). The settings editor (M8) seeds its
// fields from these; the owner's edits are stored as `overrides` in IndexedDB and
// sent with each /api/map request, overriding these without a redeploy.

export const DEFAULT_MAPPING_RULES = `# Mapping rules (owner-specified)

General
- Map to the LOWEST level: choose a specific Key Capability, not just a domain.
- Map ONLY within the curriculum provided. Never invent domain/LO/KC ids.
- Give 1–3 candidates, ranked by confidence (0–1). Most notes have one clear best fit.
- Confidence reflects how directly the note evidences the capability, not how impressive the work is.
- Prefer the domain the trainee's ACTION evidences, not the clinical topic alone.

Heuristics (do)
- Teaching students/colleagues, bedside teaching, delivering a session -> D10 Education and training.
- Personal reflection / own learning / CPD -> D10 (reflection KC).
- Audit, QIP, PDSA, guideline work -> D7 Quality improvement.
- Critical appraisal, journal club, research project, poster/publication -> D11 Research and scholarship.
- Practical procedures (cannula, LP, venepuncture, intubation) -> D3 Procedures.
- Acutely unwell child, resus, sepsis, deterioration, diagnosis+management -> D4 Clinical assessment and management.
- Consent, ethics, probity, confidentiality -> D1 Professional values and behaviours.
- Safeguarding / child protection / social care -> D8 Safeguarding (or D1 if framed as professional duty).
- Breaking bad news, difficult conversations, handover, interpreter -> D2 Communication.
- Leading/coordinating the team, delegation, crisis leadership -> D5 Leadership and team working.
- Incident/Datix/medication error/duty of candour -> D6 Patient safety.
- Immunisation, prevention, public health advice -> D9 Health promotion and illness prevention.

Don'ts
- Don't map to a domain just because the clinical setting is mentioned in passing.
- Don't pad with weak candidates; one strong candidate is better than three weak ones.
- Don't output any patient-identifying detail in any field.`;

export const DEFAULT_ENTRY_TEMPLATES = `# Entry format and per-type rules

Default entry type: reflection.

Reflective entry (default) has three parts:
- what_happened: factual, anonymised account of the moment (1–4 sentences).
- what_i_learned: the insight or learning point (1–3 sentences).
- what_i_will_do_differently: a concrete, specific action or change (1–2 sentences).

Entry types
- reflection: self-contained; no supervisor required.
- mini-CEX / CbD / DOPS / leader / HAT: supervised assessments. If the note clearly
  describes one of these, suggest it, but note it "needs supervisor" downstream.
- other: only if nothing else fits.

Rules
- Keep it tight and honest; avoid filler and clichés.
- Never fabricate detail that is not in the note. If something is unknown, leave it general.`;

export const DEFAULT_DRAFTING_STYLE = `# Drafting style

Voice
- First person, the trainee's own voice ("I ...").
- Plain, exact, reflective. UK clinical English.
- Concise: a busy clinician should read it in under a minute.

Anonymisation
- Fully anonymised. No names, ages, dates, units, NHS numbers or postcodes.
- If an identifier somehow remains in the input, replace it with a neutral placeholder
  (e.g. "a child", "a colleague") and record it in pid_flags.

Tone
- Honest about uncertainty and what was difficult.
- Focus on learning and the specific change for next time.
- No marketing language, no exclamation marks, no clichés ("eye-opening", "invaluable").`;
