
import { GameState, Tribe, MapSettings, TerrainType, HexData, DiplomaticStatus, DiplomaticRelation, POIType } from '../types';
import { generateMapData } from './mapGenerator';
import { getHexesInRange, parseHexCoords } from './mapUtils';

// Note: This file is now primarily for reference and migration of old file-based backups.
// The primary source of truth for game state is the backend server.

const MAP_RADIUS = 40;
const VISIBILITY_RANGE = 2;

const getDefaultMapSettings = (): MapSettings => ({
    biases: {
        [TerrainType.Plains]: 1,
        [TerrainType.Desert]: 1,
        [TerrainType.Mountains]: 1,
        [TerrainType.Forest]: 1,
        [TerrainType.Ruins]: 0.8,
        [TerrainType.Wasteland]: 1,
        [TerrainType.Water]: 1,
        [TerrainType.Radiation]: 0.5,
        [TerrainType.Crater]: 0.7,
        [TerrainType.Swamp]: 0.9,
    }
});


export function migrateGameState(rawState: any): GameState {
    // Deep copy to prevent mutations of the original object
    let loadedState = JSON.parse(JSON.stringify(rawState));

    // --- MIGRATION & BACKWARDS COMPATIBILITY ---
            
    // FIX: Add migration for old POI types to prevent rendering crash
    if (loadedState.mapData && loadedState.mapData.length > 0) {
        loadedState.mapData.forEach((hex: any) => {
            if (hex.poi && typeof hex.poi.type === 'string') {
                const poiTypeMap: { [key: string]: POIType } = {
                    'Ruins': POIType.Ruins,
                    'Crater': POIType.Crater,
                    'Radiation': POIType.Radiation,
                };
                if (poiTypeMap[hex.poi.type]) {
                    hex.poi.type = poiTypeMap[hex.poi.type];
                }
            }
        });
    }

    // 1. Migration from seed-based map to full map data storage
    if (!loadedState.mapData || loadedState.mapData.length === 0) {
        console.log("Migrating old save file: generating map data and start locations from seed...");
        const seed = loadedState.mapSeed || Date.now();
        const settings = loadedState.mapSettings || getDefaultMapSettings();
        const { map, startingLocations } = generateMapData(MAP_RADIUS, seed, settings);
        loadedState.mapData = map;
        loadedState.startingLocations = startingLocations;
    }

    // 2. Add mapSettings if missing
    if (!loadedState.mapSettings || !loadedState.mapSettings.biases) {
        loadedState.mapSettings = getDefaultMapSettings();
    } else {
        // Ensure all terrain types are present in biases
        const defaultBiases = getDefaultMapSettings().biases;
        for (const key in defaultBiases) {
            if (!loadedState.mapSettings.biases.hasOwnProperty(key)) {
                loadedState.mapSettings.biases[key] = defaultBiases[key as TerrainType];
            }
        }
    }
    
    // 3. Add startingLocations if missing
    if (!loadedState.startingLocations) {
        loadedState.startingLocations = [];
    }

    // 4. Add new GameState fields
    if (!loadedState.chiefRequests) loadedState.chiefRequests = [];
    if (!loadedState.assetRequests) loadedState.assetRequests = [];
    if (!loadedState.journeys) loadedState.journeys = [];
    if (!loadedState.diplomaticProposals) loadedState.diplomaticProposals = [];
    if (!loadedState.history) loadedState.history = [];
    
    // 5. Migrate from old trade system to new journey system
    if (loadedState.pendingTrades) delete loadedState.pendingTrades;
    if (loadedState.returningCaravans) delete loadedState.returningCaravans;


    // 6. Add new Tribe fields
    if (loadedState.tribes && loadedState.tribes.length > 0) {
        loadedState.tribes = loadedState.tribes.map((tribe: any) => {
            const migratedTribe = { ...tribe };

            migratedTribe.turnSubmitted = tribe.turnSubmitted ?? false;
            migratedTribe.actions = tribe.actions ?? [];
            migratedTribe.lastTurnResults = tribe.lastTurnResults ?? [];
            migratedTribe.rationLevel = tribe.rationLevel ?? 'Normal';
            migratedTribe.journeyResponses = tribe.journeyResponses ?? [];
            migratedTribe.assets = tribe.assets ?? [];

            // Migrate diplomacy structure
            if (tribe.diplomacy) {
                const newDiplomacy: Record<string, DiplomaticRelation> = {};
                Object.entries(tribe.diplomacy).forEach(([otherTribeId, statusOrObject]) => {
                    if (typeof statusOrObject === 'string') { // Old format: "War"
                        newDiplomacy[otherTribeId] = { status: statusOrObject as DiplomaticStatus };
                    } else { // New format: { status: "War" }
                        newDiplomacy[otherTribeId] = statusOrObject as DiplomaticRelation;
                    }
                });
                migratedTribe.diplomacy = newDiplomacy;
            } else {
                migratedTribe.diplomacy = {};
            }

            // Remove obsolete fields
            if (tribe.tradeResponses) delete migratedTribe.tradeResponses;
            if (tribe.diplomaticResponses) delete migratedTribe.diplomaticResponses;

            // Migrate from old resources structure to garrisons
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
                // CRITICAL: Ensure garrisons object always exists
                migratedTribe.garrisons = {
                    [tribe.location]: { troops: 0, weapons: 0, chiefs: [] }
                };
            }
            
            if (!tribe.exploredHexes) {
                const initialExplored = new Set<string>();
                Object.keys(migratedTribe.garrisons).forEach(loc => {
                    const { q, r } = parseHexCoords(loc);
                    const visibleHexes = getHexesInRange({q, r}, VISIBILITY_RANGE);
                    visibleHexes.forEach(hex => initialExplored.add(hex));
                });
                migratedTribe.exploredHexes = Array.from(initialExplored);
            }
            
            // Migrate tribe-level chiefs to home garrison
            if (tribe.chiefs && Array.isArray(tribe.chiefs) && tribe.chiefs.length > 0) {
                const homeGarrison = migratedTribe.garrisons[migratedTribe.location];
                if (homeGarrison) {
                    homeGarrison.chiefs = [...(homeGarrison.chiefs || []), ...tribe.chiefs];
                }
                delete migratedTribe.chiefs;
            }
            
            // Ensure all garrisons have a chiefs array
            Object.values(migratedTribe.garrisons).forEach((g: any) => {
                if (!g.chiefs) {
                    g.chiefs = [];
                }
            });

            // Add AI fields if they don't exist
            if (typeof migratedTribe.isAI === 'undefined') {
                migratedTribe.isAI = false;
                migratedTribe.aiType = null;
            }

            return migratedTribe;
        });

        // Post-migration: Set default diplomacy for all tribes that don't have it
        const tribeIds = loadedState.tribes.map((t: Tribe) => t.id);
        loadedState.tribes.forEach((tribe: Tribe) => {
            tribeIds.forEach((otherTribeId: string) => {
                if (tribe.id !== otherTribeId && !tribe.diplomacy[otherTribeId]) {
                    const otherTribe = loadedState.tribes.find((t: Tribe) => t.id === otherTribeId);
                    // Default to War with AI, Neutral with other players
                    const initialStatus = (tribe.isAI || otherTribe?.isAI) ? DiplomaticStatus.War : DiplomaticStatus.Neutral;
                    tribe.diplomacy[otherTribeId] = { status: initialStatus };
                }
            });
        });
    }

    return loadedState as GameState;
}