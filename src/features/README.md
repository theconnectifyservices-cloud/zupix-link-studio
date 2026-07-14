# Features

Each product capability lives in its own folder under `src/features/*` with this shape:

```
features/<domain>/
  components/     # feature-scoped UI
  hooks/          # feature-scoped hooks
  api/            # server-fn calls + query options
  types.ts        # domain types
  index.ts        # public surface
```

Features MUST NOT import from another feature. Cross-feature reuse lives in
`src/shared/*`. Features MAY import from `@/shared`, `@/hooks`, `@/stores`,
`@/services`, `@/api`, `@/config`, `@/constants`, `@/types`, `@/lib`.

Planned domains (added in later phases): `auth`, `workspace`, `bio-builder`,
`themes`, `analytics`, `ai`, `payments`, `admin`, `store`, `crm`,
`public-bio`.
