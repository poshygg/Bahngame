import test from "node:test";
import assert from "node:assert/strict";
import { canRequestWebAds, parseAdMode, supportedWebHost, validMobileUnit, validWebUnit } from "../src/features/ads/config";

test("unconfigured ads default to a local preview, with distinct web/native identifiers", () => {
  assert.equal(parseAdMode(undefined), "preview");
  assert.equal(parseAdMode("invalid"), "preview");
  assert.equal(parseAdMode("off"), "off");
  assert.equal(validWebUnit("ca-pub-1234567890123456", "1234567890"), true);
  assert.equal(validWebUnit("ca-app-pub-1234567890123456", "1234567890"), false);
  assert.equal(validMobileUnit("ca-app-pub-1234567890123456/1234567890"), true);
  assert.equal(validMobileUnit("ca-app-pub-1234567890123456~1234567890"), false);
  assert.equal(supportedWebHost("bahnreise:", "app"), false);
  assert.equal(supportedWebHost("http:", "localhost"), false);
});
test("web ads wait for a known CMP result and react to withdrawal", () => {
  const data = { cmpStatus: "loaded", eventStatus: "useractioncomplete", gdprApplies: true,
    purpose: { consents: { 1: true } }, vendor: { consents: { 755: true } } };
  assert.equal(canRequestWebAds(data, true), true);
  assert.equal(canRequestWebAds(data, false), false);
  assert.equal(canRequestWebAds({}, true), false);
  assert.equal(canRequestWebAds({ ...data, gdprApplies: undefined }, true), false);
  assert.equal(canRequestWebAds({ ...data, vendor: { consents: {} } }, true), false);
  assert.equal(canRequestWebAds({ ...data, cmpStatus: "error" }, true), false);
  assert.equal(canRequestWebAds({ ...data, gdprApplies: false }, true), true);
});
