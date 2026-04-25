export type AltitudeItem = {
  id: string;
  name: string;
  altitudeMeters: number;
  displayAltitude: string;
  type: 'surface' | 'nature' | 'monument' | 'aircraft' | 'atmosphere' | 'space';
  imageUrl?: string;
  fact?: string;
  x: number;
  size: number;
};

export const altitudeItems: AltitudeItem[] = [
  { id: 'human', name: 'HUMAN / GROUND LEVEL', altitudeMeters: 0, displayAltitude: '0 m', type: 'surface', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Standing_woman_silhouette.svg/512px-Standing_woman_silhouette.svg.png', x: 24, size: 88 },
  { id: 'dog', name: 'DOG / PARK SCENE', altitudeMeters: 1, displayAltitude: '1 m', type: 'surface', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Golde33443.jpg/640px-Golde33443.jpg', x: 74, size: 96 },
  { id: 'tree', name: 'TREE CANOPY', altitudeMeters: 15, displayAltitude: '15 m', type: 'nature', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Oak_tree.jpg/640px-Oak_tree.jpg', x: 22, size: 92 },
  { id: 'bees', name: 'BUTTERFLIES & BEES', altitudeMeters: 40, displayAltitude: '40 m', type: 'nature', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Honey_Bee_on_Sunflower.jpg/640px-Honey_Bee_on_Sunflower.jpg', x: 74, size: 94 },
  { id: 'small-birds', name: 'SMALL BIRDS', altitudeMeters: 80, displayAltitude: '80 m', type: 'nature', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/House_sparrow04.jpg/640px-House_sparrow04.jpg', x: 28, size: 92 },
  { id: 'building', name: 'TALL BUILDING', altitudeMeters: 100, displayAltitude: '100 m', type: 'monument', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Shanghai_World_Financial_Center_and_Jin_Mao.jpg/640px-Shanghai_World_Financial_Center_and_Jin_Mao.jpg', x: 69, size: 102 },
  { id: 'eiffel', name: 'EIFFEL TOWER', altitudeMeters: 330, displayAltitude: '330 m', type: 'monument', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Eiffel_Tower_2022.jpg/640px-Eiffel_Tower_2022.jpg', x: 22, size: 115 },
  { id: 'empire', name: 'EMPIRE STATE BUILDING', altitudeMeters: 381, displayAltitude: '381 m', type: 'monument', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Empire_State_Building_from_the_Top_of_the_Rock.jpg/640px-Empire_State_Building_from_the_Top_of_the_Rock.jpg', x: 75, size: 110 },
  { id: 'burj', name: 'BURJ KHALIFA', altitudeMeters: 828, displayAltitude: '828 m', type: 'monument', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Burj_Khalifa.jpg/640px-Burj_Khalifa.jpg', x: 49, size: 128 },
  { id: 'village', name: 'MOUNTAIN VILLAGE', altitudeMeters: 2000, displayAltitude: '2 km', type: 'nature', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Himalayan_village.jpg/640px-Himalayan_village.jpg', x: 23, size: 108 },
  { id: 'eagle', name: 'EAGLE', altitudeMeters: 3000, displayAltitude: '3 km', type: 'nature', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Bald_Eagle_Portrait.jpg/640px-Bald_Eagle_Portrait.jpg', x: 76, size: 100 },
  { id: 'helicopter', name: 'HELICOPTER', altitudeMeters: 4000, displayAltitude: '4 km', type: 'aircraft', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/US_Navy_091010-N-5538N-006.jpg/640px-US_Navy_091010-N-5538N-006.jpg', x: 30, size: 118 },
  { id: 'goose', name: 'BAR-HEADED GOOSE', altitudeMeters: 7000, displayAltitude: '7 km', type: 'nature', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Anser_indicus.jpg/640px-Anser_indicus.jpg', x: 56, size: 95, fact: 'One of the highest-flying migratory birds.' },
  { id: 'everest', name: 'MOUNT EVEREST', altitudeMeters: 8849, displayAltitude: '8,849 m', type: 'nature', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Mount_Everest_as_seen_from_Drukair2_PLW_edit.jpg/640px-Mount_Everest_as_seen_from_Drukair2_PLW_edit.jpg', x: 20, size: 130 },
  { id: 'vulture', name: 'VULTURE', altitudeMeters: 11000, displayAltitude: '11 km', type: 'nature', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Griffon_vulture_in_flight.jpg/640px-Griffon_vulture_in_flight.jpg', x: 78, size: 102 },
  { id: 'airliner', name: 'COMMERCIAL AIRPLANE', altitudeMeters: 11000, displayAltitude: '11 km', type: 'aircraft', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Boeing_747-8_first_flight_Everett%2C_WA.jpg/640px-Boeing_747-8_first_flight_Everett%2C_WA.jpg', x: 42, size: 128 },
  { id: 'private-jet', name: 'PRIVATE JET', altitudeMeters: 14000, displayAltitude: '14 km', type: 'aircraft', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Gulfstream_G650.jpg/640px-Gulfstream_G650.jpg', x: 68, size: 112 },
  { id: 'supersonic', name: 'SUPERSONIC AIRCRAFT', altitudeMeters: 18000, displayAltitude: '18 km', type: 'aircraft', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Concorde_Air_France_F-BVFB.jpg/640px-Concorde_Air_France_F-BVFB.jpg', x: 28, size: 118 },
  { id: 'balloon', name: 'WEATHER BALLOON', altitudeMeters: 26000, displayAltitude: '26 km', type: 'atmosphere', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/NOAA-weather-balloon-launch.jpg/640px-NOAA-weather-balloon-launch.jpg', x: 74, size: 112 },
  { id: 'jump-zone', name: 'HIGH-ALTITUDE JUMP ZONE', altitudeMeters: 39000, displayAltitude: '39 km', type: 'atmosphere', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Felix_Baumgartner_red_bull_stratos.jpg/640px-Felix_Baumgartner_red_bull_stratos.jpg', x: 26, size: 98 },
  { id: 'meteors', name: 'METEORS BEGIN GLOWING', altitudeMeters: 80000, displayAltitude: '80 km', type: 'atmosphere', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Perseid_Meteor_Shower_2016.jpg/640px-Perseid_Meteor_Shower_2016.jpg', x: 72, size: 104 },
  { id: 'karman', name: 'KÁRMÁN LINE', altitudeMeters: 100000, displayAltitude: '100 km', type: 'atmosphere', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Karman_line.svg/640px-Karman_line.svg.png', x: 50, size: 98 },
  { id: 'suborbital', name: 'SUBORBITAL SPACECRAFT', altitudeMeters: 120000, displayAltitude: '120 km', type: 'space', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/VSS_Unity_Capturing_the_Sun.jpg/640px-VSS_Unity_Capturing_the_Sun.jpg', x: 24, size: 118 },
  { id: 'iss', name: 'INTERNATIONAL SPACE STATION', altitudeMeters: 408000, displayAltitude: '408 km', type: 'space', imageUrl: 'https://images-assets.nasa.gov/image/iss068e017485/iss068e017485~medium.jpg', x: 78, size: 124 },
  { id: 'hubble', name: 'HUBBLE SPACE TELESCOPE', altitudeMeters: 540000, displayAltitude: '540 km', type: 'space', imageUrl: 'https://images-assets.nasa.gov/image/PIA04252/PIA04252~medium.jpg', x: 28, size: 124 },
  { id: 'gps', name: 'GPS SATELLITES', altitudeMeters: 20200000, displayAltitude: '20,200 km', type: 'space', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Navstar_GPS_Satellite.jpg/640px-Navstar_GPS_Satellite.jpg', x: 72, size: 102 },
  { id: 'geo', name: 'GEOSTATIONARY SATELLITES', altitudeMeters: 35786000, displayAltitude: '35,786 km', type: 'space', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/GOES-16_Satellite.jpg/640px-GOES-16_Satellite.jpg', x: 32, size: 102 },
  { id: 'moon', name: 'MOON', altitudeMeters: 384400000, displayAltitude: '384,400 km', type: 'space', imageUrl: 'https://images-assets.nasa.gov/image/as11-44-6552/as11-44-6552~medium.jpg', x: 50, size: 240, fact: 'From the ground beneath your feet to the Moon above.' },
];

export const imageCredits = [
  { label: 'NASA Image Library', url: 'https://images.nasa.gov/' },
  { label: 'Wikimedia Commons', url: 'https://commons.wikimedia.org/' },
  { label: 'Wikipedia', url: 'https://www.wikipedia.org/' },
];
