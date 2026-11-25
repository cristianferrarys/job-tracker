/** Repository outcome. Failures carry no database details so they never reach the UI. */
export type RepositoryResult<Data> = { ok: true; data: Data } | { ok: false };
