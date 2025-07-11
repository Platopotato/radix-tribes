// This file is a direct copy of the frontend `lib/mapGenerator.ts` to use its logic on the server.
// All imports have been updated to use the `.js` extension for ES Module compatibility in Node.

import { Perlin } from './noise.js';
import { POI_RARITY_MAP } from '../constants.js';

const NOISE_SCALE = 0.05; 
const POI_SPAWN_CHANCE = 0.04;
const STARTING_LOCATION_COUNT = 30;

const TERRAIN_PROFILES = {
  Mountains: { elevation: { range: 0.8, falloff: 5 } },
  Plains:    { elevation: { range: 0.4, falloff: 4 }, moisture: { range: 0.5, falloff: 3 } },
  Forest:    { elevation: { range: 0.5, falloff: 5 }, moisture: { range: 0.7, falloff: 4 } },
  Swamp:     { elevation: { range: 0.3, falloff: 8 }, moisture: { range: 0.85, falloff: 4 } },
  Desert:    { elevation: { range: 0.4, falloff: 4 }, moisture: { range: 0.15, falloff: 5 } },
  Wasteland: { elevation: { range: 0.6, falloff: 3 }, moisture: { range: 0.3, falloff: 4 } },
  Ruins:     { elevation: { range: 0.5, falloff: 2 }, special: { range: 0.85, falloff: 8 } },
  Crater:    { elevation: { range: 0.7, falloff: 6 }, special: { range: 0.5, falloff: 10 } },
  Radiation: { elevation: { range: 0.5, falloff: 3 }, special: { range: 0.1, falloff: 8 } },
};

const TERRAIN_POI_MAP = {
  Ruins: ['Ruins POI', 'Scrapyard', 'WeaponsCache', 'Factory'],
  Mountains: ['Mine', 'Outpost', 'Vault', 'ResearchLab'],
  Plains: ['Settlement', 'Food Source', 'Battlefield'],
  Forest: ['Food Source', 'BanditCamp', 'Outpost'],
  Wasteland: ['Scrapyard', 'BanditCamp', 'Factory', 'Crater POI'],
  Desert: ['ResearchLab', 'Scrapyard', 'Mine'],
  Swamp: ['Food Source', 'BanditCamp'],
  Crater: ['Scrapyard', 'WeaponsCache', 'Radiation Zone'],
  Radiation: ['Scrapyard', 'ResearchLab', 'WeaponsCache', 'Radiation Zone']
};

function getLandTerrain(e, m, s, biases) {
  let bestScore = -1;
  let bestTerrain = 'Wasteland';

  for (const t in TERRAIN_PROFILES) {
      const terrainType = t;
      const profile = TERRAIN_PROFILES[terrainType];
      if (!profile) continue;

      let score = 1.0;
      
      score *= Math.max(0, 1.0 - Math.pow(Math.abs(e - profile.elevation.range), profile.elevation.falloff));
      
      if (profile.moisture) {
          score *= Math.max(0, 1.0 - Math.pow(Math.abs(m - profile.moisture.range), profile.moisture.falloff));
      }

      if (profile.special) {
          score *= Math.max(0, 1.0 - Math.pow(Math.abs(s - profile.special.range), profile.special.falloff));
      }
      
      score *= biases[terrainType] ?? 1.0;

      if (score > bestScore) {
          bestScore = score;
          bestTerrain = terrainType;
      }
  }
  return bestTerrain;
}

function placePOI(terrain, q, r) {
    if (terrain === 'Water' || Math.random() > POI_SPAWN_CHANCE) {
        return undefined;
    }
    const possiblePois = TERRAIN_POI_MAP[terrain];
    if (!possiblePois || possiblePois.length === 0) {
        return undefined;
    }
    const poiType = possiblePois[Math.floor(Math.random() * possiblePois.length)];
    const rarity = POI_RARITY_MAP[poiType] || 'Common';

    return {
        id: `poi-${q}-${r}`,
        type: poiType,
        difficulty: Math.ceil(Math.random() * 10),
        rarity: rarity,
    };
}

const formatHexCoords = (q, r) => `${String(50 + q).padStart(3, '0')}.${String(50 + r).padStart(3, '0')}`;

export function generateMapData(radius, seed, settings) {
  const map = [];
  const elevationNoise = new Perlin(seed);
  const moistureNoise = new Perlin(seed * 2);
  const specialNoise = new Perlin(seed * 3);

  for (let q = -radius; q <= radius; q++) {
    for (let r = -radius; r <= radius; r++) {
      if (q + r > -radius - 1 && q + r < radius + 1) {
        
        const nx = q * NOISE_SCALE;
        const ny = r * NOISE_SCALE;
        
        const raw_elevation = (elevationNoise.noise(nx, ny) + 1) / 2;
        const moisture = (moistureNoise.noise(nx, ny) + 1) / 2;
        const special = (specialNoise.noise(nx * 2, ny * 2) + 1) / 2;
        
        const dist_q = q / radius;
        const dist_r = r / radius;
        const dist = Math.sqrt(dist_q*dist_q + dist_r*dist_r);
        const final_elevation = raw_elevation - dist * 0.8;
        
        let terrain;
        if (final_elevation < 0.20) {
            terrain = 'Water';
        } else {
            terrain = getLandTerrain(raw_elevation, moisture, special, settings.biases);
        }
        
        const poi = placePOI(terrain, q, r);

        map.push({ q, r, terrain, poi });
      }
    }
  }

  const validStartTerrains = ['Plains', 'Forest', 'Wasteland'];
  const possibleStartHexes = map.filter(hex => validStartTerrains.includes(hex.terrain) && !hex.poi);
  
  for (let i = possibleStartHexes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [possibleStartHexes[i], possibleStartHexes[j]] = [possibleStartHexes[j], possibleStartHexes[i]];
  }

  const startingLocations = possibleStartHexes
    .slice(0, STARTING_LOCATION_COUNT)
    .map(hex => formatHexCoords(hex.q, hex.r));

  return { map, startingLocations };
}
