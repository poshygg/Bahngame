import type { Landmark, RouteStop } from "../geography";
import { GERMAN_LANDMARKS as sights } from "./germany-landmarks";

// WGS84 station locations: © OpenStreetMap contributors (ODbL).
// Sources and itinerary limitations: docs/map-sources.md.
function stop(
  name: string,
  latitude: number,
  longitude: number,
  osmRef: string,
  ...landmarks: Landmark[]
): RouteStop {
  return {
    name,
    coordinate: { latitude, longitude },
    sourceUrl: `https://www.openstreetmap.org/${osmRef}`,
    ...(landmarks.length ? { landmarks } : {}),
  };
}

export const berlinRoute: RouteStop[] = [
  stop("Charlottenburg", 52.5050484, 13.3045162, "node/3808290434"),
  stop("Savignyplatz", 52.5051746, 13.3190659, "node/610324733"),
  stop("Zoologischer Garten", 52.5071378, 13.331868, "node/1351158702"),
  stop(
    "Tiergarten",
    52.5143746,
    13.3364504,
    "node/21302157",
    sights["berlin-victory"],
  ),
  stop("Bellevue", 52.519985, 13.3480704, "node/27528155"),
  stop(
    "Berlin Hauptbahnhof",
    52.5249451,
    13.3696614,
    "node/3856100103",
    sights["berlin-reichstag"],
  ),
  stop("Friedrichstraße", 52.5204967, 13.3868236, "node/3869306763"),
  stop(
    "Hackescher Markt",
    52.5226808,
    13.4023418,
    "node/3867910430",
    sights["berlin-museums"],
  ),
  stop(
    "Alexanderplatz",
    52.5215661,
    13.4112804,
    "node/3908141014",
    sights["berlin-tv"],
  ),
  stop("Jannowitzbrücke", 52.5142146, 13.4194925, "node/21487225"),
  stop("Ostbahnhof", 52.5107448, 13.4351709, "node/2837556546"),
  stop(
    "Warschauer Straße",
    52.5063685,
    13.4501205,
    "node/3658970189",
    sights["berlin-east-side"],
  ),
  stop("Ostkreuz", 52.5031523, 13.4695776, "node/670801913"),
];

export const hamburgRoute: RouteStop[] = [
  stop("Kellinghusenstraße", 53.588707, 9.9905848, "way/34385651"),
  stop("Eppendorfer Baum", 53.583787, 9.9852871, "node/6985171368"),
  stop("Hoheluftbrücke", 53.5774925, 9.976099, "node/249675195"),
  stop("Schlump", 53.5675879, 9.9700757, "node/2682432552"),
  stop("Sternschanze", 53.5644032, 9.9692184, "node/6900614289"),
  stop(
    "Feldstraße",
    53.5569126,
    9.9686706,
    "node/5228160283",
    sights["hamburg-park"],
  ),
  stop(
    "St. Pauli",
    53.5507957,
    9.9700752,
    "node/6900614290",
    sights["hamburg-michel"],
  ),
  stop(
    "Landungsbrücken",
    53.5462334,
    9.9711435,
    "node/52144713",
    sights["hamburg-piers"],
  ),
  stop(
    "Baumwall",
    53.5442142,
    9.9816291,
    "node/5257886402",
    sights["hamburg-elphi"],
  ),
  stop("Rödingsmarkt", 53.5482604, 9.9869049, "way/34386184"),
  stop(
    "Rathaus",
    53.550371,
    9.9940526,
    "node/6284717662",
    sights["hamburg-rathaus"],
  ),
  stop("Mönckebergstraße", 53.5512748, 10.0019036, "node/265088027"),
  stop("Hauptbahnhof Süd", 53.5521608, 10.0093336, "node/258576519"),
  stop("Berliner Tor", 53.5534288, 10.0230852, "node/4102358153"),
];

export const munichRoute: RouteStop[] = [
  stop("Hauptbahnhof", 48.1401455, 11.5610962, "node/3278115861"),
  stop(
    "Königsplatz",
    48.14501,
    11.5632086,
    "node/3114658668",
    sights["munich-koenigsplatz"],
  ),
  stop("Theresienstraße", 48.1515099, 11.5644523, "node/211557411"),
  stop("Josephsplatz", 48.1557444, 11.5670928, "node/247674448"),
  stop("Hohenzollernplatz", 48.1623677, 11.5687654, "node/3142725229"),
  stop("Scheidplatz", 48.1714156, 11.5728523, "node/1927183970"),
  stop("Bonner Platz", 48.1666668, 11.5782902, "node/2650093393"),
  stop("Münchner Freiheit", 48.161985, 11.5865312, "node/2644689618"),
  stop("Giselastraße", 48.1565588, 11.5840476, "node/2644689600"),
  stop(
    "Universität",
    48.1503538,
    11.5811442,
    "node/2644689645",
    sights["munich-garden"],
  ),
  stop(
    "Odeonsplatz",
    48.1433433,
    11.5780447,
    "node/1927202337",
    sights["munich-residenz"],
  ),
  stop(
    "Marienplatz",
    48.1383609,
    11.5761828,
    "node/3189921461",
    sights["munich-rathaus"],
  ),
  stop("Sendlinger Tor", 48.1335231, 11.5670945, "node/3372671694"),
  stop("Goetheplatz", 48.129034, 11.5573549, "node/2644689602"),
  stop(
    "Poccistraße",
    48.1254879,
    11.5502436,
    "node/2644689622",
    sights["munich-bavaria"],
  ),
];

export const cologneRoute: RouteStop[] = [
  stop("Sülzgürtel", 50.9117003, 6.9232282, "node/59973253"),
  stop("Sülzburgstraße", 50.9153406, 6.9270377, "node/59973254"),
  stop("Arnulfstraße", 50.9182931, 6.9302451, "node/31346009"),
  stop("Weißhausstraße", 50.9214167, 6.9334147, "node/59973255"),
  stop("Eifelwall/Stadtarchiv", 50.9246328, 6.9369084, "node/59973256"),
  stop("Barbarossaplatz", 50.9289895, 6.9421704, "node/254380330"),
  stop("Poststraße", 50.9316732, 6.9500139, "node/300403947"),
  stop(
    "Neumarkt",
    50.9349658,
    6.9492917,
    "node/300403950",
    sights["cologne-aposteln"],
  ),
  stop("Appellhofplatz", 50.9396762, 6.9504795, "node/1341148995"),
  stop(
    "Dom/Hbf",
    50.9418151,
    6.9572123,
    "node/1341075078",
    sights["cologne-dom"],
    sights["cologne-ludwig"],
  ),
  stop(
    "Breslauer Platz/Hbf",
    50.9443823,
    6.9587478,
    "node/78586828",
    sights["cologne-bridge"],
  ),
  stop("Ebertplatz", 50.9507507, 6.9591608, "node/78586832"),
  stop("Reichenspergerplatz", 50.9542947, 6.9648739, "node/78586837"),
  stop(
    "Zoo/Flora",
    50.9578905,
    6.9743896,
    "node/78589377",
    sights["cologne-flora"],
  ),
];

export const frankfurtRoute: RouteStop[] = [
  stop(
    "Bockenheimer Warte",
    50.1192275,
    8.6534649,
    "node/614877751",
    sights["frankfurt-senckenberg"],
  ),
  stop("Festhalle/Messe", 50.1117146, 8.6558163, "node/29271563"),
  stop("Hauptbahnhof", 50.1071727, 8.6623337, "node/677374148"),
  stop(
    "Willy-Brandt-Platz",
    50.1093939,
    8.6749413,
    "node/28783089",
    sights["frankfurt-goethe"],
  ),
  stop(
    "Dom/Römer",
    50.110725,
    8.6836678,
    "node/11502587744",
    sights["frankfurt-roemer"],
  ),
  stop("Konstablerwache", 50.1146301, 8.6868253, "node/778708666"),
  stop(
    "Hauptwache",
    50.1137833,
    8.6792621,
    "node/30049622",
    sights["frankfurt-opera"],
  ),
  stop(
    "Eschenheimer Tor",
    50.1173865,
    8.679264,
    "node/30049623",
    sights["frankfurt-tower"],
  ),
  stop("Grüneburgweg", 50.1219063, 8.6757021, "node/5902639718"),
  stop("Holzhausenstraße", 50.1266038, 8.6738022, "node/5902639719"),
  stop("Miquel-/Adickesallee", 50.131535, 8.6721951, "node/5902639720"),
  stop("Dornbusch", 50.137023, 8.6710753, "node/8100883742"),
  stop("Fritz-Tarnow-Straße", 50.1427704, 8.6687232, "node/8091442475"),
  stop("Hügelstraße", 50.1478395, 8.6664051, "node/8110961211"),
];

export const grandTourRoute: RouteStop[] = [
  stop(
    "Berlin Hauptbahnhof",
    52.5249451,
    13.3696614,
    "node/3856100103",
    sights["berlin-reichstag"],
  ),
  stop(
    "Hamburg Hauptbahnhof",
    53.5526959,
    10.0075644,
    "node/2459919677",
    sights["hamburg-rathaus"],
  ),
  stop("Hannover Hauptbahnhof", 52.3769504, 9.7416533, "node/3059639307"),
  stop(
    "Köln Hauptbahnhof",
    50.9427839,
    6.9590705,
    "node/2399559029",
    sights["cologne-dom"],
  ),
  stop(
    "Frankfurt Hauptbahnhof",
    50.1066539,
    8.6625808,
    "node/205364328",
    sights["frankfurt-goethe"],
  ),
  stop("Stuttgart Hauptbahnhof", 48.7856099, 9.1833959, "node/1635698272"),
  stop(
    "München Hauptbahnhof",
    48.1407253,
    11.5569426,
    "node/2470201868",
    sights["munich-rathaus"],
  ),
];
