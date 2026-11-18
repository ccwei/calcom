/**
 * Google's OAuth client throws `invalid_grant` instead of returning `{ error: "invalid_grant" }`.
 * OAuthManager then stores that thrown message as `myFetchError`. A ReAuth failure replaces the
 * message with the JSON body, which still has `error: "invalid_grant"`.
 */
export function isGoogleInvalidGrantBody(body: unknown): boolean {
  if (typeof body === "string") {
    if (body === "invalid_grant") return true;
    try {
      return isGoogleInvalidGrantBody(JSON.parse(body));
    } catch {
      return false;
    }
  }

  if (typeof body !== "object" || body === null) return false;

  const candidate = body as { error?: unknown; myFetchError?: unknown };
  if (candidate.error === "invalid_grant") return true;
  if (candidate.myFetchError !== undefined) return isGoogleInvalidGrantBody(candidate.myFetchError);
  return false;
}

export function isGoogleInvalidGrantError(error: unknown): error is Error {
  return error instanceof Error && isGoogleInvalidGrantBody(error.message);
}
