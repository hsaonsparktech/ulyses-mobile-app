# Navigation

- `/` waits for session bootstrap and redirects to sign-in or the role root.
- `/(auth)/sign-in` is the working sample form. Registration, recovery, invitations and verification await later sprints.
- `/owner`: Home, Activity, Invoices, Documents, Libros AI.
- `/employee`: Home, Expenses, Documents, Account.
- `/accountant`: Overview, Reports, Documents, Account.

Literal role segments avoid route collisions. Each role layout wraps Tabs in RoleGuard. Tab routes compose one foundation screen; no product screens are implemented. Text-only navigation avoids invented icons.

Access states: loading, unauthenticated redirect, forbidden access-denied state, authorized. Deep links cannot skip the guard. Restore returns null and production sign-in rejects. Mock adapter loading is development-gated and opt-in; mock sessions never persist. Password-reset routes cannot grant access.

Backend authorization is mandatory for every resource and export. Employee invitations and accountant permissions require approved server contracts. Hidden tabs do not authorize requests.
