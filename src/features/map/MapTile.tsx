import { memo, useEffect, useState } from "react";
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { TILE_SIZE, type VisibleTile } from "./projection";
import { loadMapTile } from "./vectorSource";
import { calmMapPalette, type MapShape } from "./vectorStyle";

export const MapTile = memo(function MapTile({
  tile,
  onStatus,
}: {
  tile: VisibleTile;
  onStatus: (key: string, state: "loaded" | "error") => void;
}) {
  const [data, setData] = useState<{
    shapes: MapShape[];
    viewBox: string;
  } | null>(null);
  useEffect(() => {
    let mounted = true;
    loadMapTile({ z: tile.z, x: tile.x, y: tile.y })
      .then((result) => {
        if (mounted) {
          setData(result);
          onStatus(tile.key, "loaded");
        }
      })
      .catch(() => {
        if (mounted) onStatus(tile.key, "error");
      });
    return () => {
      mounted = false;
    };
  }, [tile.z, tile.x, tile.y, tile.key, onStatus]);
  return (
    <View
      testID="map-tile"
      pointerEvents="none"
      style={{
        position: "absolute",
        left: tile.left,
        top: tile.top,
        width: TILE_SIZE,
        height: TILE_SIZE,
        backgroundColor: calmMapPalette.ground,
        overflow: "hidden",
      }}
    >
      {data && <TileArtwork data={data} />}
    </View>
  );
});

// Moving the camera translates tile containers; static geometry is not rebuilt.
const TileArtwork = memo(function TileArtwork({
  data,
}: {
  data: { shapes: MapShape[]; viewBox: string };
}) {
  return (
    <Svg width={TILE_SIZE} height={TILE_SIZE} viewBox={data.viewBox}>
      {data.shapes.map((shape, index) => (
        <Path
          key={index}
          d={shape.d}
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={shape.width}
          fillRule="evenodd"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </Svg>
  );
});
