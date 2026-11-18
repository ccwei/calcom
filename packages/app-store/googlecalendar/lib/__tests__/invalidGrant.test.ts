import { describe, expect, test } from "vitest";
import { isGoogleInvalidGrantBody, isGoogleInvalidGrantError } from "../invalidGrant";

describe("isGoogleInvalidGrantBody", () => {
  test("matches the OAuth error field", () => {
    expect(isGoogleInvalidGrantBody({ error: "invalid_grant" })).toBe(true);
  });

  test("matches the message OAuthManager stores when the Google client throws", () => {
    expect(isGoogleInvalidGrantBody({ myFetchError: "invalid_grant" })).toBe(true);
  });

  test("matches a ReAuth body whose message is the JSON error", () => {
    expect(
      isGoogleInvalidGrantBody(
        JSON.stringify({
          error: "invalid_grant",
          error_description: "reauth related error",
        })
      )
    ).toBe(true);
  });

  test("does not match other token failures", () => {
    expect(isGoogleInvalidGrantBody({ error: "invalid_client" })).toBe(false);
    expect(isGoogleInvalidGrantBody({ myFetchError: "socket hang up" })).toBe(false);
    expect(isGoogleInvalidGrantBody("Unknown error")).toBe(false);
  });
});

describe("isGoogleInvalidGrantError", () => {
  test("matches an Error whose message is invalid_grant", () => {
    expect(isGoogleInvalidGrantError(new Error("invalid_grant"))).toBe(true);
  });

  test("does not match other errors", () => {
    expect(isGoogleInvalidGrantError(new Error("Webhook validation failed"))).toBe(false);
    expect(isGoogleInvalidGrantError("invalid_grant")).toBe(false);
  });
});
