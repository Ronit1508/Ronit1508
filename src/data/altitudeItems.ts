export type Layer =
  | 'Surface'
  | 'Troposphere'
  | 'Stratosphere'
  | 'Mesosphere'
  | 'Thermosphere'
  | 'Exosphere'
  | 'Deep Space';

export type AltitudeItem = {
  id: string;
  name: string;
  altitudeMeters: number;
  displayAltitude: string;
  category: string;
  fact?: string;
  wikiTitle: string;
  imageCredit: string;
  imageSource: string;
  alignment: 'left' | 'right' | 'center';
  size: 'sm' | 'md' | 'lg';
  layer: Layer;
};

export const altitudeItems: AltitudeItem[] = [
  { id: 'human', name: 'HUMAN / GROUND LEVEL', altitudeMeters: 0, displayAltitude: '0 m', category: 'Surface', fact: 'Sea-level starting reference.', wikiTitle: 'Human', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Human', alignment: 'left', size: 'sm', layer: 'Surface' },
  { id: 'dog', name: 'DOG / PARK SCENE', altitudeMeters: 1, displayAltitude: '1 m', category: 'Surface', wikiTitle: 'Dog', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Dog', alignment: 'right', size: 'sm', layer: 'Surface' },
  { id: 'tree', name: 'TREE CANOPY', altitudeMeters: 15, displayAltitude: '15 m', category: 'Nature', wikiTitle: 'Tree', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Tree', alignment: 'left', size: 'sm', layer: 'Troposphere' },
  { id: 'bee', name: 'BUTTERFLIES & BEES', altitudeMeters: 40, displayAltitude: '40 m', category: 'Life', wikiTitle: 'Honey_bee', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Honey_bee', alignment: 'right', size: 'sm', layer: 'Troposphere' },
  { id: 'small-birds', name: 'SMALL BIRDS', altitudeMeters: 70, displayAltitude: '70 m', category: 'Life', wikiTitle: 'Passerine', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Passerine', alignment: 'left', size: 'sm', layer: 'Troposphere' },
  { id: 'building', name: 'TALL BUILDING', altitudeMeters: 100, displayAltitude: '100 m', category: 'Architecture', wikiTitle: 'Skyscraper', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Skyscraper', alignment: 'right', size: 'sm', layer: 'Troposphere' },
  { id: 'eiffel', name: 'EIFFEL TOWER', altitudeMeters: 330, displayAltitude: '330 m', category: 'Monument', wikiTitle: 'Eiffel_Tower', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Eiffel_Tower', alignment: 'left', size: 'md', layer: 'Troposphere' },
  { id: 'empire', name: 'EMPIRE STATE BUILDING', altitudeMeters: 381, displayAltitude: '381 m', category: 'Monument', wikiTitle: 'Empire_State_Building', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Empire_State_Building', alignment: 'right', size: 'md', layer: 'Troposphere' },
  { id: 'burj', name: 'BURJ KHALIFA', altitudeMeters: 828, displayAltitude: '828 m', category: 'Monument', wikiTitle: 'Burj_Khalifa', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Burj_Khalifa', alignment: 'center', size: 'md', layer: 'Troposphere' },
  { id: 'village', name: 'MOUNTAIN VILLAGE', altitudeMeters: 2_000, displayAltitude: '2 km', category: 'Terrain', wikiTitle: 'Mountain_village', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Mountain_village', alignment: 'left', size: 'md', layer: 'Troposphere' },
  { id: 'everest', name: 'MOUNT EVEREST', altitudeMeters: 8_849, displayAltitude: '8,849 m', category: 'Terrain', wikiTitle: 'Mount_Everest', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Mount_Everest', alignment: 'right', size: 'lg', layer: 'Troposphere' },
  { id: 'eagle', name: 'EAGLE', altitudeMeters: 3_000, displayAltitude: '3 km', category: 'Life', fact: 'Rides thermals to high altitude.', wikiTitle: 'Eagle', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Eagle', alignment: 'left', size: 'sm', layer: 'Troposphere' },
  { id: 'goose', name: 'BAR-HEADED GOOSE', altitudeMeters: 7_000, displayAltitude: '7 km', category: 'Life', fact: 'One of the highest-flying migratory birds.', wikiTitle: 'Bar-headed_goose', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Bar-headed_goose', alignment: 'center', size: 'sm', layer: 'Troposphere' },
  { id: 'vulture', name: 'VULTURE', altitudeMeters: 11_000, displayAltitude: '11 km', category: 'Life', wikiTitle: 'Vulture', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Vulture', alignment: 'right', size: 'sm', layer: 'Troposphere' },
  { id: 'helicopter', name: 'HELICOPTER', altitudeMeters: 5_000, displayAltitude: '5 km', category: 'Aviation', wikiTitle: 'Helicopter', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Helicopter', alignment: 'left', size: 'md', layer: 'Troposphere' },
  { id: 'airliner', name: 'COMMERCIAL AIRPLANE', altitudeMeters: 11_000, displayAltitude: '11 km', category: 'Aviation', wikiTitle: 'Airliner', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Airliner', alignment: 'right', size: 'md', layer: 'Troposphere' },
  { id: 'private-jet', name: 'PRIVATE JET', altitudeMeters: 14_000, displayAltitude: '14 km', category: 'Aviation', wikiTitle: 'Business_jet', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Business_jet', alignment: 'center', size: 'sm', layer: 'Stratosphere' },
  { id: 'supersonic', name: 'SUPERSONIC AIRCRAFT', altitudeMeters: 18_000, displayAltitude: '18 km', category: 'Aviation', wikiTitle: 'Concorde', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Concorde', alignment: 'left', size: 'md', layer: 'Stratosphere' },
  { id: 'balloon', name: 'WEATHER BALLOON', altitudeMeters: 26_000, displayAltitude: '26 km', category: 'Science', wikiTitle: 'Weather_balloon', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Weather_balloon', alignment: 'right', size: 'md', layer: 'Stratosphere' },
  { id: 'jump', name: 'HIGH-ALTITUDE JUMP ZONE', altitudeMeters: 39_000, displayAltitude: '39 km', category: 'Human Record', wikiTitle: 'Felix_Baumgartner', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Felix_Baumgartner', alignment: 'left', size: 'sm', layer: 'Stratosphere' },
  { id: 'meteor', name: 'METEORS BEGIN GLOWING', altitudeMeters: 80_000, displayAltitude: '80 km', category: 'Mesosphere', wikiTitle: 'Meteor', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Meteor', alignment: 'right', size: 'sm', layer: 'Mesosphere' },
  { id: 'karman', name: 'KÁRMÁN LINE', altitudeMeters: 100_000, displayAltitude: '100 km', category: 'Boundary', wikiTitle: 'K%C3%A1rm%C3%A1n_line', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/K%C3%A1rm%C3%A1n_line', alignment: 'center', size: 'sm', layer: 'Thermosphere' },
  { id: 'suborbital', name: 'SUBORBITAL SPACECRAFT', altitudeMeters: 120_000, displayAltitude: '120 km', category: 'Spaceflight', wikiTitle: 'Sub-orbital_spaceflight', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Sub-orbital_spaceflight', alignment: 'left', size: 'md', layer: 'Thermosphere' },
  { id: 'iss', name: 'ISS', altitudeMeters: 408_000, displayAltitude: '408 km', category: 'Orbit', wikiTitle: 'International_Space_Station', imageCredit: 'NASA / Wikimedia Commons', imageSource: 'https://en.wikipedia.org/wiki/International_Space_Station', alignment: 'right', size: 'md', layer: 'Thermosphere' },
  { id: 'hubble', name: 'HUBBLE SPACE TELESCOPE', altitudeMeters: 540_000, displayAltitude: '540 km', category: 'Orbit', wikiTitle: 'Hubble_Space_Telescope', imageCredit: 'NASA / Wikimedia Commons', imageSource: 'https://en.wikipedia.org/wiki/Hubble_Space_Telescope', alignment: 'left', size: 'md', layer: 'Thermosphere' },
  { id: 'gps', name: 'GPS SATELLITES', altitudeMeters: 20_200_000, displayAltitude: '20,200 km', category: 'Navigation Orbit', wikiTitle: 'Global_Positioning_System', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Global_Positioning_System', alignment: 'right', size: 'sm', layer: 'Exosphere' },
  { id: 'geo', name: 'GEOSTATIONARY SATELLITES', altitudeMeters: 35_786_000, displayAltitude: '35,786 km', category: 'Communications Orbit', wikiTitle: 'Geostationary_orbit', imageCredit: 'Wikimedia Commons contributors', imageSource: 'https://en.wikipedia.org/wiki/Geostationary_orbit', alignment: 'left', size: 'sm', layer: 'Exosphere' },
  { id: 'moon', name: 'MOON', altitudeMeters: 384_400_000, displayAltitude: '384,400 km', category: 'Destination', fact: 'From the ground beneath your feet to the Moon above.', wikiTitle: 'Moon', imageCredit: 'NASA / Wikimedia Commons', imageSource: 'https://en.wikipedia.org/wiki/Moon', alignment: 'center', size: 'lg', layer: 'Deep Space' },
];
