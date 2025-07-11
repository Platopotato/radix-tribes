// This file is a direct copy of the frontend `lib/ai/aiTribeGenerator.ts` to use its logic on the server.
// All imports have been updated to use the `.js` extension for ES Module compatibility in Node.

import { TRIBE_ICONS, INITIAL_GLOBAL_RESOURCES, MIN_STAT_VALUE, MAX_STAT_POINTS } from '../../constants.js';
import { getHexesInRange, parseHexCoords } from '../mapUtils.js';

const AI_NAME_PREFIXES = ['Rust', 'Sand', 'Scrap', 'Dust', 'Iron', 'Ash', 'Grave', 'Wasteland', 'Sunken', 'Forgotten'];
const AI_NAME_SUFFIXES = ['Vultures', 'Dogs', 'Rats', 'Goblins', 'Marauders', 'Hounds', 'Crows', 'Nomads', 'Claws', 'Kings'];

function generateRandomStats() {
    let points = MAX_STAT_POINTS;
    const stats = {
        charisma: MIN_STAT_VALUE,
        intelligence: MIN_STAT_VALUE,
        leadership: MIN_STAT_VALUE,
        strength: MIN_STAT_VALUE,
    };
    points -= 4 * MIN_STAT_VALUE;

    const statKeys = Object.keys(stats);

    for (let i = 0; i < points; i++) {
        const randomStat = statKeys[Math.floor(Math.random() * statKeys.length)];
        stats[randomStat]++;
    }
    return stats;
}


export function generateAITribe(availableStartLocation, existingTribeNames) {
    let tribeName = '';
    do {
        const prefix = AI_NAME_PREFIXES[Math.floor(Math.random() * AI_NAME_PREFIXES.length)];
        const suffix = AI_NAME_SUFFIXES[Math.floor(Math.random() * AI_NAME_SUFFIXES.length)];
        tribeName = `${prefix} ${suffix}`;
    } while (existingTribeNames.includes(tribeName));

    const iconKeys = TRIBE_ICONS;
    const icon = iconKeys[Math.floor(Math.random() * iconKeys.length)];

    const startCoords = parseHexCoords(availableStartLocation);
    const initialExplored = getHexesInRange(startCoords, 2);
    
    const initialGarrison = {
        troops: 15 + Math.floor(Math.random() * 11), // 15-25 troops
        weapons: 5 + Math.floor(Math.random() * 6), // 5-10 weapons
        chiefs: [],
    };

    const newTribe = {
        id: `tribe-ai-${Date.now()}`,
        playerId: `ai-player-${Date.now()}`,
        isAI: true,
        aiType: 'Wanderer',
        playerName: 'AI Controller',
        tribeName,
        icon,
        stats: generateRandomStats(),
        location: availableStartLocation,
        globalResources: {
            ...INITIAL_GLOBAL_RESOURCES,
            food: 100 + Math.floor(Math.random() * 51), // 100-150 food
            scrap: 10 + Math.floor(Math.random() * 11), // 10-20 scrap
        },
        garrisons: {
            [availableStartLocation]: initialGarrison,
        },
        actions: [],
        turnSubmitted: false,
        lastTurnResults: [],
        exploredHexes: initialExplored,
        rationLevel: 'Normal',
        completedTechs: [],
        assets: [],
        currentResearch: null,
        journeyResponses: [],
        diplomacy: {},
    };

    return newTribe;
}
