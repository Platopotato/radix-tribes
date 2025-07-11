// This file is a direct copy of the frontend `lib/ai/aiActions.ts` to use its logic on the server.
// All imports have been updated to use the `.js` extension for ES Module compatibility in Node.

import { parseHexCoords } from '../mapUtils.js';

function getNeighbors(q, r) {
    const directions = [
        { q: 1, r: 0 }, { q: -1, r: 0 },
        { q: 0, r: 1 }, { q: 0, r: -1 },
        { q: 1, r: -1 }, { q: -1, r: 1 },
    ];
    return directions.map(dir => ({ q: q + dir.q, r: r + dir.r }));
}

export function generateWanderAction(tribe, mapData) {
    const mainGarrisonLocation = Object.entries(tribe.garrisons).sort(([, a], [, b]) => b.troops - a.troops)[0]?.[0];

    if (!mainGarrisonLocation) {
        return null;
    }

    const garrison = tribe.garrisons[mainGarrisonLocation];
    if (garrison.troops === 0) {
        return null;
    }

    const { q, r } = parseHexCoords(mainGarrisonLocation);
    const neighbors = getNeighbors(q, r);

    const mapDataByCoords = new Map();
    mapData.forEach(hex => mapDataByCoords.set(`${hex.q},${hex.r}`, hex));

    const validDestinations = neighbors.filter(coord => {
        const hex = mapDataByCoords.get(`${coord.q},${coord.r}`);
        return hex && hex.terrain !== 'Water';
    });
    
    if (validDestinations.length === 0) {
        return null;
    }

    const destination = validDestinations[Math.floor(Math.random() * validDestinations.length)];
    const finish_location = `${String(50 + destination.q).padStart(3, '0')}.${String(50 + destination.r).padStart(3, '0')}`;

    const action = {
        id: `action-ai-${Date.now()}`,
        actionType: 'Move',
        actionData: {
            start_location: mainGarrisonLocation,
            finish_location,
            troops: garrison.troops,
            weapons: garrison.weapons,
            chiefsToMove: (garrison.chiefs || []).map(c => c.name),
        }
    };

    return action;
}

export function generateAIActions(tribe, allTribes, mapData) {
    if (!tribe.isAI) return [];

    const wanderAction = generateWanderAction(tribe, mapData);
    return wanderAction ? [wanderAction] : [];
}
