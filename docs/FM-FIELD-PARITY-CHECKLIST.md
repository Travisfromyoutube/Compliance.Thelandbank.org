# FileMaker Field Parity Checklist

Date: 2026-02-13
Purpose: single working checklist to keep FileMaker mappings, Prisma schema, sync logic, and UI/API output in parity.

## Summary Status

- Done now: submission endpoints are token-bound for buyer writes and admin-only for listing.
- Done now: buyer `Top Note` is persisted during sync and returned by property APIs.
- Done now: FM sync no longer tries to write unsupported property keys (`foreclosureYear`, `propertyClass`) into Prisma.
- Still open: several FM-mapped fields are not represented in Prisma models.
- Still open: several FM field names remain `TBD_*` and must be confirmed in production metadata.

## P0 Security and Integrity (Completed)

- [x] `GET /api/submissions` requires admin auth.
- [x] `POST /api/submissions` requires a valid buyer access token (or authenticated admin).
- [x] Buyer submit UI no longer shows fake success when API submission fails.
- [x] Buyer uploads require a valid access token and server-side size/type checks.

## Property Field Map vs Prisma Schema

Status legend: `OK` = in map + schema, `FILTERED` = in map but intentionally ignored during sync, `GAP` = in map but not persisted.

- `parcelId`, `parcelIdDashed`, `address`: `OK`
- `programType`, `dateSold`, `offerType`, `purchaseType`: `OK`
- `availability`, `soldStatus`, `gclbOwned`, `flintAreaName`, `minimumBid`, `category`, `sev`: `OK`
- `interiorCondition`, `fireDamage`, `occupancyStatus`, `overallCondition`: `OK`
- `bedrooms`, `baths`, `stories`, `sqFt`, `yearBuilt`, `lotSize`, `garageSize`, `basementSize`, `school`: `OK`
- `buyerOfferDate`, `downPaymentAmount`, `monthlyPaymentAmount`, `termOfContractMonths`, `applicantHomeConditions`: `OK`
- `dateForScope`, `dateClosed`, `waive550`: `OK`
- `occupancyDeadline`, `insuranceDueDate`, `insuranceReceived`, `occupancyEstablished`, `minimumHoldExpiry`: `OK` schema-wise, FM names partly `TBD_*`
- `dateProofOfInvestProvided`, `compliance1stAttempt`, `compliance2ndAttempt`, `demoFinalCertDate`, `bondRequired`, `bondAmount`, `complianceType`: `OK`
- `referredToLISC`, `liscRecommendReceived`, `liscRecommendSale`: `OK`
- `enforcementLevel`, `status`: `OK` schema-wise, `enforcementLevel` FM name still `TBD_*`
- `foreclosureYear`: `FILTERED` (mapped but no Prisma column)
- `propertyClass`: `FILTERED` (mapped but no Prisma column)

Action:

- [ ] Decide whether to persist `foreclosureYear` and `propertyClass` in `Property` model.
- [ ] If yes, add Prisma columns and include them in API outputs/UI where needed.
- [ ] If no, remove these keys from `PROPERTY_FIELD_MAP` to avoid long-term drift.

## Buyer Field Map vs Prisma Schema

- `fullName` (split to first/last): `OK`
- `organization`: `OK`
- `lcForfeit`, `treasRevert`, `buyerStatus`, `topNote`: `OK`
- `email`, `phone`: `OK` schema-wise, FM names still `TBD_Buyer_*`
- `coApplicant`: `GAP` (mapped but no Prisma column)
- `interestType`: `GAP` (mapped but no Prisma column)
- `dateReceived`: `GAP` (mapped but no Prisma column)
- `closing`: `GAP` (mapped but no Prisma column)

Action:

- [ ] Decide whether to persist `coApplicant`, `interestType`, `dateReceived`, `closing` in `Buyer`.
- [ ] If yes, add Prisma fields and sync write logic.
- [ ] If no, remove these fields from `BUYER_FIELD_MAP`.

## FM Name Confirmation Checklist (`TBD_*`)

These field names are still placeholders and must be confirmed from production layout metadata or FM admin confirmation.

- [ ] `TBD_Occupancy_Deadline`
- [ ] `TBD_Insurance_Due_Date`
- [ ] `TBD_Insurance_Received`
- [ ] `TBD_Occupancy_Established`
- [ ] `TBD_Minimum_Hold_Expiry`
- [ ] `TBD_Last_Contact_Date`
- [ ] `TBD_Scope_Work_Approved`
- [ ] `TBD_Building_Permit_Obtained`
- [ ] `TBD_Rehab_Deadline`
- [ ] `TBD_Percent_Complete`
- [ ] `TBD_Enforcement_Level`
- [ ] `TBD_Buyer_Email`
- [ ] `TBD_Buyer_Phone`

Recommended verification procedure:

- [ ] Run `GET /api/filemaker?action=status&meta=true` against production-accessible layouts.
- [ ] Diff returned field names against `src/config/filemakerFieldMap.js`.
- [ ] Update mapping constants and retest round-trip sync.

## Submissions and Communications Layout Parity

Current state:

- `SUBMISSION_FIELD_MAP` fields are placeholders.
- `COMMUNICATION_FIELD_MAP` fields are placeholders.
- Portal push logic assumes dedicated FM layouts exist for both.

Action:

- [ ] Confirm final layout names and field names with FM admin.
- [ ] Replace placeholder keys in `SUBMISSION_FIELD_MAP`.
- [ ] Replace placeholder keys in `COMMUNICATION_FIELD_MAP`.
- [ ] Run a push test for one submission and one communication, then verify records in FM UI.

## API and UI Parity Checks

- [x] `topNote` is now included in property API response and visible in property detail page.
- [ ] Confirm whether `buyerStatus` should be shown in UI (currently returned by APIs, not surfaced prominently).
- [ ] Confirm whether sale fields (`downPaymentAmount`, `termOfContractMonths`, etc.) should appear in property detail UI.
- [ ] Confirm whether `availability` should be editable in admin UI or read-only from FM.

## Definition of Done for Full Parity

- [ ] No `TBD_*` names remain in active field maps.
- [ ] Every mapped field is either persisted in Prisma or intentionally removed from map.
- [ ] One successful FM-to-portal sync includes representative records for Featured, R4R, Demo, and VIP.
- [ ] One successful portal-to-FM push for submission and communication is verified in FM.
- [ ] UI displays all operationally critical buyer and compliance fields agreed by staff.
