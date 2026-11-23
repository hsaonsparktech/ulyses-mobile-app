# Open decisions

- Sprint 00A resolves token/branding availability using the user-verified ZIP. All 89 variables and nine typography styles are integrated. Live Figma reauthentication is still needed before future exact-screen/component inspection. Brand master IDs: 371:77 tile and 371:88 compact symbol. The supplied compact derivative still needs live comparison; it is not represented as an original Figma export.
- Backend URL, auth/session/refresh/logout contracts, token expiry, invitations and business permissions are unavailable. Production auth fails closed. Connect secure writes and validated session restore only after contracts are approved.
- Business selection must be server-authorized and cancel/clear caches. No business switch UI is exposed yet.
- Payments and entitlement enforcement are disabled. Figma references Pro $20/month or $200/year and proposed Pro+ $30/month or $300/year. Employee/accountant limits, subscription scope, trial, proration, refunds, grace periods and cancellation remain unapproved.
- Spanish content and coverage remain provisional.
- Browser preview host was unavailable, so app screenshots/interactive visual QA were not captured. Android/iOS release-device checks remain for launcher masking, splash (especially dark surroundings), typography scaling and compact-mark comparison. Brand redistribution rights remain a release-owner check. This sprint is not a production release.
