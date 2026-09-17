export type ActionResult = { error?: string } | null;

export type FormAction = (
  prev: ActionResult,
  formData: FormData,
) => Promise<ActionResult>;
