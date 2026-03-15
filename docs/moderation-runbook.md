# MerhabaMap Moderation Runbook

This runbook is an operational draft for the MVP. It should be reviewed by the product and operations team before broader rollout.

## Reports

### When a report is `OPEN`

- Check whether the target is a place or an event
- Review the reason and any optional details
- If the report looks credible, move it to `IN_REVIEW`
- If the report is clearly low quality or abusive, reject it without adding trust claims to the UI

### When a report is `IN_REVIEW`

- Check the affected public page
- Compare the reported information with the currently displayed information
- For links, only keep URLs that are expected and safe to expose
- Resolve the report after the public data has been corrected or confirmed

### Repeated bad reports

- Treat repeated low-quality reports as an abuse signal, not automatically as valid moderation evidence
- If one user repeatedly reports the same target in a short period, review their pattern before taking action
- Do not expose moderation reasoning publicly

## Claims

### Pending claims

- Check whether the claimant message is coherent
- Check whether contact details are plausible
- Review any evidence notes
- Check whether there is already an owner linked to the place

### Approving a claim

- Approve only when the ownership link looks credible enough for MVP standards
- Approval links the place to the claimant account and sets the place to `CLAIMED`
- `CLAIMED` does not mean MerhabaMap has independently verified all public information

### Rejecting a claim

- Reject when evidence is too weak, conflicting, or obviously spammy
- Do not disclose internal moderation notes in public surfaces or user emails

### Suspicious claims

- Watch for repeated claims across unrelated businesses
- Watch for clearly copied messages or low-context evidence
- If unsure, leave the place unverified and avoid upgrading to `VERIFIED`

## Trust States

- `UNVERIFIED`
  - no approved ownership relationship and no MerhabaMap confirmation
- `CLAIMED`
  - an ownership claim was approved
- `VERIFIED`
  - MerhabaMap additionally confirmed key information

Use `VERIFIED` conservatively. It should remain a higher-confidence state than `CLAIMED`.

## External Links

- Treat external event or business links carefully
- Keep only links that are relevant to the displayed entity
- Remove or reject obviously unsafe, unrelated, or misleading links
- MerhabaMap should not imply endorsement of third-party sites beyond linking them

## Soft Launch Rhythm

- Check open reports daily
- Check pending claims daily
- Review recent admin actions for consistency
- If moderation volume becomes hard to manage, slow rollout before adding more surface area
