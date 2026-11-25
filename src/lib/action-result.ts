/** Result returned by every Server Action. Field errors are keyed by form field name. */
export type FieldErrors<Field extends string = string> = Partial<Record<Field, string[]>>;

export type ActionFailure<Field extends string = string> = {
  ok: false;
  error: string;
  fieldErrors?: FieldErrors<Field>;
};

export type ActionResult<Data, Field extends string = string> =
  | { ok: true; data: Data }
  | ActionFailure<Field>;
