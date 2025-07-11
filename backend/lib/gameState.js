// This file is a direct copy of the frontend `lib/gameState.ts` to use its logic on the server.
// All imports have been updated to use the `.js` extension for ES Module compatibility in Node.

import { generateMapData } from './mapGenerator.js';
import { getHexesInRange, parseHexCoords } from './mapUtils.js';

const MAP_RADIUS = 40;
const VISIBILITY_RANGE = 2;

const getDefaultMapSettings = () => ({
    biases: {
        Plains: 1,
        Desert: 1,
        Mountains: 1,
        Forest: 1,
        Ruins: 0.8,
        Wasteland: 1,
        Water: 1,
        Radiation: 0.5,
        Crater: 0.7,
        Swamp: 0.9,
    }
});


export function migrateGameState(rawState) {
    let loadedState = JSON.parse(JSON.stringify(rawState));

    if (loadedState.mapData && loadedState.mapData.length > 0) {
        loadedState.mapData.forEach((hex) => {
            if (hex.poi && typeof hex.poi.type === 'string') {
                const poiTypeMap = {
                    'Ruins': 'Ruins POI',
                    'Crater': 'Crater POI',
                    'Radiation': 'Radiation Zone',
                };
                if (poiTypeMap[hex.poi.type]) {
                    hex.poi.type = poiTypeMap[hex.poi.type];
                }
            }
        });
    }

    if (!loadedState.mapData || loadedState.mapData.length === 0) {
        console.log("Migrating old save file: generating map data and start locations from seed...");
        const seed = loadedState.mapSeed || Date.now();
        const settings = loadedState.mapSettings || getDefaultMapSettings();
        const { map, startingLocations } = generateMapData(MAP_RADIUS, seed, settings);
        loadedState.mapData = map;
        loadedState.startingLocations = startingLocations;
    }

    if (!loadedState.mapSettings || !loadedState.mapSettings.biases) {
        loadedState.mapSettings = getDefaultMapSettings();
    } else {
        const defaultBiases = getDefaultMapSettings().biases;
        for (const key in defaultBiases) {
            if (!loadedState.mapSettings.biases.hasOwnProperty(key)) {
                loadedState.mapSettings.biases[key] = defaultBiases[key];
            }
        }
    }
    
    if (!loadedState.startingLocations) {
        loadedState.startingLocations = [];
    }

    if (!loadedState.chiefRequests) loadedState.chiefRequests = [];
    if (!loadedState.assetRequests) loadedState.assetRequests = [];
    if (!loadedState.journeys) loadedState.journeys = [];
    if (!loadedState.diplomaticProposals) loadedState.diplomaticProposals = [];
    if (!loadedState.history) loadedState.history = [];
    
    if (loadedState.pendingTrades) delete loadedState.pendingTrades;
    if (loadedState.returningCaravans) delete loadedState.returningCaravans;

    if (loadedState.tribes && loadedState.tribes.length > 0) {
        loadedState.tribes = loadedState.tribes.map((tribe) => {
            const migratedTribe = { ...tribe };

            migratedTribe.turnSubmitted = tribe.turnSubmitted ?? false;
            migratedTribe.actions = tribe.actions ?? [];
            migratedTribe.lastTurnResults = tribe.lastTurnResults ?? [];
            migratedTribe.rationLevel = tribe.rationLevel ?? 'Normal';
            migratedTribe.journeyResponses = tribe.journeyResponses ?? [];
            migratedTribe.assets = tribe.assets ?? [];

            if (tribe.diplomacy) {
                const newDiplomacy = {};
                Object.entries(tribe.diplomacy).forEach(([otherTribeId, statusOrObject]) => {
                    if (typeof statusOrObject === 'string') {
                        newDiplomacy[otherTribeId] = { status: statusOrObject };
                    } else {
                        newDiplomacy[otherTribeId] = statusOrObject;
                    }
                });
                migratedTribe.diplomacy = newDiplomacy;
            } else {
                migratedTribe.diplomacy = {};
            }

            if (tribe.tradeResponses) delete migratedTribe.tradeResponses;
            if (tribe.diplomaticResponses) delete migratedTribe.diplomaticResponses;

            if (tribe.resources && !tribe.garrisons) {
                migratedTribe.globalResources = {
                    food: tribe.resources.food,
                    scrap: tribe.resources.scrap,
                    morale: tribe.resources.morale,
                };
                migratedTribe.garrisons = {
                    [tribe.location]: {
                        troops: tribe.resources.troops,
                        weapons: tribe.resources.weapons,
                        chiefs: [],
                    }
                };
                delete migratedTribe.resources;
            } else if (!tribe.garrisons) {
                migratedTribe.garrisons = {
                    [tribe.location]: { troops: 0, weapons: 0, chiefs: [] }
                };
            }
            
            if (!tribe.exploredHexes) {
                const initialExplored = new Set();
                Object.keys(migratedTribe.garrisons).forEach(loc => {
                    const { q, r } = parseHexCoords(loc);
                    const visibleHexes = getHexesInRange({q, r}, VISIBILITY_RANGE);
                    visibleHexes.forEach(hex => initialExplored.add(hex));
                });
                migratedTribe.exploredHexes = Array.from(initialExplored);
            }
            
            if (tribe.chiefs && Array.isArray(tribe.chiefs) && tribe.chiefs.length > 0) {
                const homeGarrison = migratedTribe.garrisons[migratedTribe.location];
                if (homeGarrison) {
                    homeGarrison.chiefs = [...(homeGarrison.chiefs || []), ...tribe.chiefs];
                }
                delete migratedTribe.chiefs;
            }
            
            Object.values(migratedTribe.garrisons).forEach((g) => {
                if (!g.chiefs) {
                    g.chiefs = [];
                }
            });

            if (typeof migratedTribe.isAI === 'undefined') {
                migratedTribe.isAI = false;
                migratedTribe.aiType = null;
            }

            return migratedTribe;
        });

        const tribeIds = loadedState.tribes.map((t) => t.id);
        loadedState.tribes.forEach((tribe) => {
            tribeIds.forEach((otherTribeId) => {
                if (tribe.id !== otherTribeId && !tribe.diplomacy[otherTribeId]) {
                    const otherTribe = loadedState.tribes.find((t) => t.id === otherTribeId);
                    const initialStatus = (tribe.isAI || otherTribe?.isAI) ? 'War' : 'Neutral';
                    tribe.diplomacy[otherTribeId] = { status: initialStatus };
                }
            });
        });
    }

    return loadedState;
}
