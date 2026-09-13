import assert from "node:assert/strict";
import test from "node:test";
import { GERMAN_LANDMARKS } from "../src/data/packs/germany-landmarks";
import {
  boxesOverlap,
  placeLandmarkLabels,
  wrapMapText,
} from "../src/features/map/landmarkLayout";

test("all sourced English/German landmark names survive wrapping in full", () => {
  for (const landmark of Object.values(GERMAN_LANDMARKS))
    for (const name of Object.values(landmark.name))
      for (const limit of [14, 22, 30])
        assert.equal(wrapMapText(name, limit).join(" "), name);
});

test("landmark labels preserve geographic anchors while avoiding train and station controls", () => {
  const occupied = [
    { x: 0, y: 0, width: 500, height: 80 },
    { x: 0, y: 120, width: 175, height: 75 },
    { x: 260, y: 130, width: 130, height: 30 },
    { x: 0, y: 290, width: 500, height: 30 },
  ];
  const source = [
    {
      id: "victory",
      name: "Victory Column",
      point: { x: 185, y: 160 },
      priority: 0,
    },
    {
      id: "museum",
      name: "Museum Island",
      point: { x: 265, y: 190 },
      priority: 1,
    },
    {
      id: "bridge",
      name: "Hohenzollern Bridge",
      point: { x: 360, y: 230 },
      priority: 2,
    },
  ];
  const labels = placeLandmarkLabels(source, 500, 320, occupied, {
    topInset: 90,
  });
  assert.ok(labels.length >= 1);
  for (const label of labels) {
    assert.deepEqual(
      label.point,
      source.find((item) => item.id === label.id)!.point,
    );
    assert.equal(label.lines.join(" "), label.name);
    assert.ok(label.x >= 10 && label.y >= 90);
    assert.ok(label.x + label.width <= 490 && label.y + label.height <= 286);
    assert.ok(occupied.every((box) => !boxesOverlap(label, box)));
    assert.ok(
      labels
        .filter((other) => other.id !== label.id)
        .every((other) => !boxesOverlap(label, other)),
    );
  }
});

test("a short keyboard map falls back to a full named edge callout beside the train", () => {
  const labels = placeLandmarkLabels(
    [
      {
        id: "victory",
        name: "Victory Column",
        point: { x: 180, y: 120 },
        priority: 0,
      },
    ],
    320,
    190,
    [
      { x: 0, y: 0, width: 320, height: 80 },
      { x: 10, y: 92, width: 164, height: 60 },
      { x: 0, y: 158, width: 320, height: 32 },
    ],
    { mini: true, topInset: 86 },
  );
  assert.equal(labels.length, 1);
  assert.equal(labels[0].minimal, true);
  assert.equal(labels[0].lines.join(" "), "Victory Column");
  assert.ok(labels[0].x >= 179);
});

test("off-map tourist locations are never presented at invented coordinates", () => {
  assert.deepEqual(
    placeLandmarkLabels(
      [
        {
          id: "offscreen",
          name: "Distant museum",
          point: { x: -50, y: 120 },
          priority: 0,
        },
      ],
      320,
      190,
      [],
      { mini: true },
    ),
    [],
  );
});
