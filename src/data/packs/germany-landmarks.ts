import type { Landmark } from "../geography";

// Original descriptions; geographic data © OpenStreetMap contributors (ODbL).
export const GERMAN_LANDMARKS: Record<string, Landmark> = {
  "berlin-victory": {
    id: "berlin-victory",
    kind: "monument",
    name: {
      en: "Victory Column",
      de: "Siegessäule",
    },
    description: {
      en: "A golden figure crowns this monument in the Tiergarten, a walk from the station.",
      de: "Eine goldene Figur krönt dieses Denkmal im Tiergarten, einen Spaziergang vom Bahnhof entfernt.",
    },
    coordinate: {
      latitude: 52.5145112,
      longitude: 13.3501105,
    },
    sourceUrl:
      "https://www.berlin.de/en/attractions-and-sights/3560160-3104052-victory-column.en.html",
    coordinateSourceUrl: "https://www.openstreetmap.org/way/718035022",
  },
  "berlin-reichstag": {
    id: "berlin-reichstag",
    kind: "building",
    name: {
      en: "Reichstag",
      de: "Reichstagsgebäude",
    },
    description: {
      en: "The German parliament meets here, south of Hauptbahnhof beside the Spree.",
      de: "Hier tagt der Deutsche Bundestag, südlich des Hauptbahnhofs an der Spree.",
    },
    coordinate: {
      latitude: 52.5185957,
      longitude: 13.3761008,
    },
    sourceUrl: "https://www.visitberlin.de/en/berlins-top-10-attractions",
    coordinateSourceUrl: "https://www.openstreetmap.org/relation/2201742",
  },
  "berlin-museums": {
    id: "berlin-museums",
    kind: "museum",
    name: {
      en: "Museum Island",
      de: "Museumsinsel",
    },
    description: {
      en: "An island of museums in the Spree, near Hackescher Markt.",
      de: "Eine Museumslandschaft auf einer Spreeinsel, nahe dem Hackeschen Markt.",
    },
    coordinate: {
      latitude: 52.5199984,
      longitude: 13.397183,
    },
    sourceUrl: "https://www.visitberlin.de/en/berlins-top-10-attractions",
    coordinateSourceUrl: "https://www.openstreetmap.org/way/330840129",
  },
  "berlin-tv": {
    id: "berlin-tv",
    kind: "tower",
    name: {
      en: "Berlin TV Tower",
      de: "Berliner Fernsehturm",
    },
    description: {
      en: "The television tower rises above Alexanderplatz and the surrounding city.",
      de: "Der Fernsehturm erhebt sich über den Alexanderplatz und die umliegende Stadt.",
    },
    coordinate: {
      latitude: 52.5208198,
      longitude: 13.4094213,
    },
    sourceUrl: "https://www.visitberlin.de/en/berlins-top-10-attractions",
    coordinateSourceUrl: "https://www.openstreetmap.org/way/556435241",
  },
  "berlin-east-side": {
    id: "berlin-east-side",
    kind: "art",
    name: {
      en: "East Side Gallery",
      de: "East Side Gallery",
    },
    description: {
      en: "Painted sections of the Berlin Wall line the Spree near Warschauer Straße.",
      de: "Bemalte Abschnitte der Berliner Mauer begleiten die Spree nahe der Warschauer Straße.",
    },
    coordinate: {
      latitude: 52.5055242,
      longitude: 13.4403289,
    },
    sourceUrl: "https://www.visitberlin.de/en/berlin-wall?tid=548",
    coordinateSourceUrl: "https://www.openstreetmap.org/relation/6807791",
  },
  "hamburg-park": {
    id: "hamburg-park",
    kind: "park",
    name: {
      en: "Planten un Blomen",
      de: "Planten un Blomen",
    },
    description: {
      en: "Gardens and green paths follow Hamburg’s former ramparts near Feldstraße.",
      de: "Gärten und grüne Wege folgen Hamburgs ehemaligen Wallanlagen nahe der Feldstraße.",
    },
    coordinate: {
      latitude: 53.5568717,
      longitude: 9.9799834,
    },
    sourceUrl: "https://plantenunblomen.hamburg.de/der-park",
    coordinateSourceUrl: "https://www.openstreetmap.org/relation/8103463",
  },
  "hamburg-michel": {
    id: "hamburg-michel",
    kind: "church",
    name: {
      en: "St Michael’s Church",
      de: "Hauptkirche St. Michaelis",
    },
    description: {
      en: "Known as the Michel, this church is one of Hamburg’s defining landmarks.",
      de: "Als Michel bekannt, gehört diese Kirche zu Hamburgs prägenden Wahrzeichen.",
    },
    coordinate: {
      latitude: 53.5484046,
      longitude: 9.9789008,
    },
    sourceUrl:
      "https://hansen.hamburg-tourism.de/fileadmin/user_upload/posts/kooperationen/2024/Hamburg-Highlights-ONLINE-EN.pdf",
    coordinateSourceUrl: "https://www.openstreetmap.org/way/22731336",
  },
  "hamburg-piers": {
    id: "hamburg-piers",
    kind: "waterfront",
    name: {
      en: "Landungsbrücken piers",
      de: "St. Pauli-Landungsbrücken",
    },
    description: {
      en: "The waterfront piers are a gateway to Hamburg’s harbour and ferries.",
      de: "Die Landungsbrücken sind ein Tor zu Hamburgs Hafen und seinen Fähren.",
    },
    coordinate: {
      latitude: 53.5455518,
      longitude: 9.9703693,
    },
    sourceUrl:
      "https://www.hamburg.com/visitors/sights/architecture/landungsbruecken-19332",
    coordinateSourceUrl: "https://www.openstreetmap.org/node/1071465777",
  },
  "hamburg-elphi": {
    id: "hamburg-elphi",
    kind: "building",
    name: {
      en: "Elbphilharmonie",
      de: "Elbphilharmonie",
    },
    description: {
      en: "A concert hall on the Elbe, reached from nearby Baumwall.",
      de: "Ein Konzerthaus an der Elbe, erreichbar vom nahen Baumwall.",
    },
    coordinate: {
      latitude: 53.5412491,
      longitude: 9.9841054,
    },
    sourceUrl: "https://www.elbphilharmonie.de/de/besuch",
    coordinateSourceUrl: "https://www.openstreetmap.org/way/24981342",
  },
  "hamburg-rathaus": {
    id: "hamburg-rathaus",
    kind: "building",
    name: {
      en: "Hamburg Town Hall",
      de: "Hamburger Rathaus",
    },
    description: {
      en: "Hamburg’s town hall stands beside Rathausmarkt in the city centre.",
      de: "Hamburgs Rathaus steht am Rathausmarkt mitten im Stadtzentrum.",
    },
    coordinate: {
      latitude: 53.5504081,
      longitude: 9.9923709,
    },
    sourceUrl:
      "https://www.hamburg-travel.com/booking/tickets/guided-tour-from-the-town-hall-to-the-elbphilharmonie/",
    coordinateSourceUrl: "https://www.openstreetmap.org/way/142944431",
  },
  "munich-koenigsplatz": {
    id: "munich-koenigsplatz",
    kind: "monument",
    name: {
      en: "Königsplatz",
      de: "Königsplatz",
    },
    description: {
      en: "Classical columns frame this square in Munich’s museum district.",
      de: "Antike Säulenformen prägen diesen Platz im Münchner Museumsviertel.",
    },
    coordinate: {
      latitude: 48.1462388,
      longitude: 11.5654895,
    },
    sourceUrl: "https://www.munich.travel/pois/stadt-viertel/koenigsplatz",
    coordinateSourceUrl: "https://www.openstreetmap.org/relation/5640807",
  },
  "munich-garden": {
    id: "munich-garden",
    kind: "tower",
    name: {
      en: "Chinese Tower, English Garden",
      de: "Chinesischer Turm, Englischer Garten",
    },
    description: {
      en: "The Chinese Tower is a landmark in the English Garden, east of Universität.",
      de: "Der Chinesische Turm ist ein Wahrzeichen im Englischen Garten, östlich der Universität.",
    },
    coordinate: {
      latitude: 48.1525605,
      longitude: 11.5920976,
    },
    sourceUrl:
      "https://www.munich.travel/en/topics/urban-districts/munich-sights-at-a-glance",
    coordinateSourceUrl: "https://www.openstreetmap.org/way/18961351",
  },
  "munich-residenz": {
    id: "munich-residenz",
    kind: "building",
    name: {
      en: "Munich Residenz",
      de: "Münchner Residenz",
    },
    description: {
      en: "The former royal palace stands beside Odeonsplatz and the Hofgarten.",
      de: "Das ehemalige Königsschloss liegt am Odeonsplatz neben dem Hofgarten.",
    },
    coordinate: {
      latitude: 48.1411667,
      longitude: 11.5793096,
    },
    sourceUrl:
      "https://www.munich.travel/en/topics/urban-districts/munich-sights-at-a-glance",
    coordinateSourceUrl: "https://www.openstreetmap.org/relation/7456359",
  },
  "munich-rathaus": {
    id: "munich-rathaus",
    kind: "building",
    name: {
      en: "New Town Hall",
      de: "Neues Rathaus",
    },
    description: {
      en: "The New Town Hall overlooks Marienplatz, the heart of the old town.",
      de: "Das Neue Rathaus blickt auf den Marienplatz, das Herz der Altstadt.",
    },
    coordinate: {
      latitude: 48.1377889,
      longitude: 11.5759768,
    },
    sourceUrl:
      "https://www.munich.travel/en/topics/urban-districts/munich-sights-at-a-glance",
    coordinateSourceUrl: "https://www.openstreetmap.org/relation/147095",
  },
  "munich-bavaria": {
    id: "munich-bavaria",
    kind: "monument",
    name: {
      en: "Bavaria statue",
      de: "Bavaria",
    },
    description: {
      en: "This monumental bronze figure stands at the edge of Theresienwiese.",
      de: "Die monumentale Bronzefigur steht am Rand der Theresienwiese.",
    },
    coordinate: {
      latitude: 48.1306881,
      longitude: 11.5459388,
    },
    sourceUrl: "https://www.munich.travel/pois/stadt-viertel/bavaria",
    coordinateSourceUrl: "https://www.openstreetmap.org/way/96753009",
  },
  "cologne-aposteln": {
    id: "cologne-aposteln",
    kind: "church",
    name: {
      en: "St Aposteln",
      de: "St. Aposteln",
    },
    description: {
      en: "One of Cologne’s Romanesque churches stands beside Neumarkt.",
      de: "Eine von Kölns romanischen Kirchen steht direkt am Neumarkt.",
    },
    coordinate: {
      latitude: 50.9366002,
      longitude: 6.9449933,
    },
    sourceUrl:
      "https://location.cologne-tourism.com/fileadmin/Mediendatenbank/Locations.Koeln/PDF/Private_tours_for_Groups_Cologne_2026.pdf",
    coordinateSourceUrl: "https://www.openstreetmap.org/way/282443595",
  },
  "cologne-dom": {
    id: "cologne-dom",
    kind: "church",
    name: {
      en: "Cologne Cathedral",
      de: "Kölner Dom",
    },
    description: {
      en: "The cathedral is a UNESCO World Heritage Site beside the main station.",
      de: "Der Dom ist UNESCO-Welterbe und liegt direkt neben dem Hauptbahnhof.",
    },
    coordinate: {
      latitude: 50.941307,
      longitude: 6.9581112,
    },
    sourceUrl: "https://www.cologne-tourism.com/arts-culture/sights",
    coordinateSourceUrl: "https://www.openstreetmap.org/way/4532022",
  },
  "cologne-ludwig": {
    id: "cologne-ludwig",
    kind: "museum",
    name: {
      en: "Museum Ludwig",
      de: "Museum Ludwig",
    },
    description: {
      en: "An art museum next to the cathedral, on Cologne’s cultural trail.",
      de: "Ein Kunstmuseum neben dem Dom, an Kölns Kulturpfad Via Culturalis.",
    },
    coordinate: {
      latitude: 50.9408347,
      longitude: 6.9600217,
    },
    sourceUrl:
      "https://www.cologne-tourism.com/arts-culture/sights/via-culturalis",
    coordinateSourceUrl: "https://www.openstreetmap.org/node/633480736",
  },
  "cologne-bridge": {
    id: "cologne-bridge",
    kind: "bridge",
    name: {
      en: "Hohenzollern Bridge",
      de: "Hohenzollernbrücke",
    },
    description: {
      en: "Trains cross the Rhine on this bridge, also known for its love locks.",
      de: "Züge queren auf dieser Brücke den Rhein; bekannt ist sie auch für Liebesschlösser.",
    },
    coordinate: {
      latitude: 50.9412838,
      longitude: 6.9657034,
    },
    sourceUrl: "https://www.cologne-tourism.com/arts-culture/sights",
    coordinateSourceUrl: "https://www.openstreetmap.org/way/256156997",
  },
  "cologne-flora": {
    id: "cologne-flora",
    kind: "park",
    name: {
      en: "Flora and Botanical Garden",
      de: "Flora und Botanischer Garten",
    },
    description: {
      en: "A green destination beside the zoo, close to the Zoo/Flora stop.",
      de: "Ein grünes Ausflugsziel neben dem Zoo, nahe der Haltestelle Zoo/Flora.",
    },
    coordinate: {
      latitude: 50.9611282,
      longitude: 6.970096,
    },
    sourceUrl: "https://www.cologne-tourism.com/arts-culture/sights",
    coordinateSourceUrl: "https://www.openstreetmap.org/way/155328236",
  },
  "frankfurt-senckenberg": {
    id: "frankfurt-senckenberg",
    kind: "museum",
    name: {
      en: "Senckenberg Natural History Museum",
      de: "Senckenberg Naturmuseum",
    },
    description: {
      en: "A natural history museum near Bockenheimer Warte, at the start of this journey.",
      de: "Ein Naturkundemuseum nahe der Bockenheimer Warte, am Anfang dieser Reise.",
    },
    coordinate: {
      latitude: 50.1175423,
      longitude: 8.6512895,
    },
    sourceUrl:
      "https://www.visitfrankfurt.travel/fileadmin/Mediendatenbank/Dokumente/Broschueren/Frankfurt_Information_Faltplan_2026-Englisch.pdf",
    coordinateSourceUrl: "https://www.openstreetmap.org/way/30119021",
  },
  "frankfurt-roemer": {
    id: "frankfurt-roemer",
    kind: "building",
    name: {
      en: "Römer Town Hall",
      de: "Römer",
    },
    description: {
      en: "Frankfurt’s historic town hall faces Römerberg in the old town.",
      de: "Frankfurts historisches Rathaus steht am Römerberg in der Altstadt.",
    },
    coordinate: {
      latitude: 50.1104684,
      longitude: 8.6816587,
    },
    sourceUrl:
      "https://www.visitfrankfurt.travel/en/experience/attractions/top-10",
    coordinateSourceUrl: "https://www.openstreetmap.org/node/34223060",
  },
  "frankfurt-goethe": {
    id: "frankfurt-goethe",
    kind: "building",
    name: {
      en: "Goethe House",
      de: "Goethe-Haus",
    },
    description: {
      en: "The Goethe House connects the old town with the writer’s history.",
      de: "Das Goethe-Haus verbindet die Altstadt mit der Geschichte des Dichters.",
    },
    coordinate: {
      latitude: 50.1112121,
      longitude: 8.677559,
    },
    sourceUrl:
      "https://www.visitfrankfurt.travel/en/experience/attractions/top-10",
    coordinateSourceUrl: "https://www.openstreetmap.org/way/174501393",
  },
  "frankfurt-opera": {
    id: "frankfurt-opera",
    kind: "building",
    name: {
      en: "Old Opera House",
      de: "Alte Oper",
    },
    description: {
      en: "The Alte Oper is a concert venue at the edge of the city centre.",
      de: "Die Alte Oper ist ein Konzerthaus am Rand der Innenstadt.",
    },
    coordinate: {
      latitude: 50.1160331,
      longitude: 8.6719882,
    },
    sourceUrl:
      "https://www.visitfrankfurt.travel/en/experience/attractions/top-10",
    coordinateSourceUrl: "https://www.openstreetmap.org/way/384153099",
  },
  "frankfurt-tower": {
    id: "frankfurt-tower",
    kind: "tower",
    name: {
      en: "Eschenheim Tower",
      de: "Eschenheimer Turm",
    },
    description: {
      en: "This medieval tower recalls Frankfurt’s former city fortifications.",
      de: "Dieser mittelalterliche Turm erinnert an Frankfurts frühere Stadtbefestigung.",
    },
    coordinate: {
      latitude: 50.1169463,
      longitude: 8.6797002,
    },
    sourceUrl:
      "https://www.visitfrankfurt.travel/en/experience/discover/architecture",
    coordinateSourceUrl: "https://www.openstreetmap.org/way/53671623",
  },
};
