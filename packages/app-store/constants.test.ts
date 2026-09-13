import { describe, expect, it } from "vitest";
import {
  eventHasInstalledOnlineConferencingLocation,
  hasAllowedOnlineConferencingLocation,
  isAllowedOnlineConferencingAppSlug,
  isAllowedOnlineConferencingLocation,
  MeetLocationType,
  ZoomLocationType,
} from "./constants";

describe("allowed online conferencing locations", () => {
  it("accepts Google Meet and Zoom location types", () => {
    expect(isAllowedOnlineConferencingLocation(MeetLocationType)).toBe(true);
    expect(isAllowedOnlineConferencingLocation(ZoomLocationType)).toBe(true);
  });

  it("rejects in-person and other location types", () => {
    expect(isAllowedOnlineConferencingLocation("inPerson")).toBe(false);
    expect(isAllowedOnlineConferencingLocation("integrations:daily")).toBe(false);
    expect(isAllowedOnlineConferencingLocation(undefined)).toBe(false);
  });

  it("accepts installed Google Meet and Zoom app slugs", () => {
    expect(isAllowedOnlineConferencingAppSlug("google-meet")).toBe(true);
    expect(isAllowedOnlineConferencingAppSlug("zoom")).toBe(true);
    expect(isAllowedOnlineConferencingAppSlug("daily-video")).toBe(false);
  });

  it("requires at least one allowed conferencing location", () => {
    expect(hasAllowedOnlineConferencingLocation([{ type: MeetLocationType }])).toBe(true);
    expect(hasAllowedOnlineConferencingLocation([{ type: "inPerson" }])).toBe(false);
    expect(hasAllowedOnlineConferencingLocation([])).toBe(false);
  });

  it("does not treat a stored Meet location as selected when Meet is not installed", () => {
    expect(
      eventHasInstalledOnlineConferencingLocation({
        locations: [{ type: MeetLocationType }],
        locationOptions: [],
      })
    ).toBe(false);
  });

  it("accepts Meet only when it is in the installed location options", () => {
    expect(
      eventHasInstalledOnlineConferencingLocation({
        locations: [{ type: MeetLocationType }],
        locationOptions: [{ options: [{ value: MeetLocationType }] }],
      })
    ).toBe(true);
  });
});
