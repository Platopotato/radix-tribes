// This file is a direct copy of the frontend `lib/mapUtils.ts` to use its logic on the server.
// All imports have been updated to use the `.js` extension for ES Module compatibility in Node.

function axialToCube(q, r) {
    return { q, r, s: -q - r };
}

function cubeToAxial(cube) {
    return { q: cube.q, r: cube.r };
}

function cubeDistance(a, b) {
    return (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(a.s - b.s)) / 2;
}

export function axialDistance(q1, r1, q2, r2) {
    const a = axialToCube(q1, r1);
    const b = axialToCube(q2, r2);
    return cubeDistance(a, b);
}

export const formatHexCoords = (q, r) => 
    `${String(50 + q).padStart(3, '0')}.${String(50 + r).padStart(3, '0')}`;

export const parseHexCoords = (coords) => {
    const [qStr, rStr] = coords.split('.');
    return { q: parseInt(qStr) - 50, r: parseInt(rStr) - 50 };
}

export function getHexesInRange(center, range) {
    const results = [];
    for (let q = -range; q <= range; q++) {
        for (let r = -range; r <= range; r++) {
            if (q + r >= -range && q + r <= range) {
                const hexQ = center.q + q;
                const hexR = center.r + r;
                if (axialDistance(center.q, center.r, hexQ, hexR) <= range) {
                    results.push(formatHexCoords(hexQ, hexR));
                }
            }
        }
    }
    return results;
}

export function hexToPixel(q, r, size) {
    const width = Math.sqrt(3) * size;
    const height = 2 * size;
    const x = width * (q + r / 2);
    const y = (height * 3 / 4) * r;
    return { x, y };
}

// --- A* Pathfinding ---
const BASE_MOVEMENT_PER_TURN = 5;

const TERRAIN_MOVEMENT_COSTS = {
    Plains: 1 / BASE_MOVEMENT_PER_TURN,
    Wasteland: 1 / BASE_MOVEMENT_PER_TURN,
    Forest: 1.5 / BASE_MOVEMENT_PER_TURN,
    Desert: 1.5 / BASE_MOVEMENT_PER_TURN,
    Ruins: 1.2 / BASE_MOVEMENT_PER_TURN,
    Swamp: 2 / BASE_MOVEMENT_PER_TURN,
    Mountains: 2.5 / BASE_MOVEMENT_PER_TURN,
    Crater: 1.8 / BASE_MOVEMENT_PER_TURN,
    Radiation: 1 / BASE_MOVEMENT_PER_TURN,
    Water: Infinity,
};

const HEX_DIRECTIONS = [
    { q: 1, r: 0 }, { q: -1, r: 0 },
    { q: 0, r: 1 }, { q: 0, r: -1 },
    { q: 1, r: -1 }, { q: -1, r: 1 },
];

export function findPath(start, end, mapData) {
    const map = new Map(mapData.map(hex => [formatHexCoords(hex.q, hex.r), hex]));
    const startKey = formatHexCoords(start.q, start.r);
    const endKey = formatHexCoords(end.q, end.r);

    const openSet = new Set([startKey]);
    const cameFrom = new Map();

    const gScore = new Map();
    gScore.set(startKey, 0);

    const fScore = new Map();
    fScore.set(startKey, axialDistance(start.q, start.r, end.q, end.r));

    while (openSet.size > 0) {
        let currentKey = '';
        let minFScore = Infinity;
        for (const key of openSet) {
            if ((fScore.get(key) ?? Infinity) < minFScore) {
                minFScore = fScore.get(key);
                currentKey = key;
            }
        }

        if (currentKey === endKey) {
            const path = [];
            let tempKey = currentKey;
            while (tempKey) {
                path.unshift(tempKey);
                tempKey = cameFrom.get(tempKey);
            }
            return { path, cost: Math.ceil(gScore.get(endKey) ?? 0) };
        }

        openSet.delete(currentKey);
        const currentCoords = parseHexCoords(currentKey);
        
        for (const dir of HEX_DIRECTIONS) {
            const neighborCoords = { q: currentCoords.q + dir.q, r: currentCoords.r + dir.r };
            const neighborKey = formatHexCoords(neighborCoords.q, neighborCoords.r);
            const neighborHex = map.get(neighborKey);

            if (!neighborHex) continue;

            const moveCost = TERRAIN_MOVEMENT_COSTS[neighborHex.terrain] ?? Infinity;
            if (moveCost === Infinity) continue;
            
            const tentativeGScore = (gScore.get(currentKey) ?? Infinity) + moveCost;

            if (tentativeGScore < (gScore.get(neighborKey) ?? Infinity)) {
                cameFrom.set(neighborKey, currentKey);
                gScore.set(neighborKey, tentativeGScore);
                fScore.set(neighborKey, tentativeGScore + axialDistance(neighborCoords.q, neighborCoords.r, end.q, end.r));
                if (!openSet.has(neighborKey)) {
                    openSet.add(neighborKey);
                }
            }
        }
    }

    return null; // No path found
}
