# API contracts

No approved endpoints or payloads are supplied. AuthAdapter defines replaceable restore/sign-in/sign-out operations. The default adapter rejects sign-in and never restores a user. A real adapter must validate responses, persist tokens with credentials.write, publish non-sensitive session metadata, and implement server logout and expiry/refresh behavior.

Use getValidated(path, schema, signal) with approved contracts and TanStack Query cancellation signals. Define feature mutation schemas when known. Normalize UI errors; never expose raw Axios configuration, headers or backend payloads. Never log credentials.

Keys use queryKeys.resource(session, resource). Successful mutations invalidate resource scope. Session/business changes cancel and clear all queries before context updates. Server authorization applies independently of navigation guards.
