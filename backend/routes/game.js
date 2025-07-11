import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import auth from '../middleware/auth.js';
import { readDb, writeDb } from '../db.js';
import { INITIAL_GLOBAL_RESOURCES, INITIAL_GARRISON } from '../constants.js';
import { getHexesInRange, parseHexCoords } from '../lib/mapUtils.js';

const router = express.Router();

// Middleware to apply to all routes in this file
router.use(auth);

// GET /api/game/state
router.get('/state', (req, res) => {
    const db = readDb();
    res.json(db.gameState);
});

// POST /api/tribes
router.post('/', (req, res) => {
    const { playerName, tribeName, icon, stats } = req.body;
    const db = readDb();
    
    // Check if user already has a tribe
    if (db.gameState.tribes.some(t => t.playerId === req.user.id)) {
        return res.status(409).json({ message: 'User already has a tribe.' });
    }
    
    // Check if tribe name is taken
    if (db.gameState.tribes.some(t => t.tribeName.toLowerCase() === tribeName.toLowerCase())) {
        return res.status(409).json({ message: 'Tribe name is already taken.' });
    }
    
    // Check for available starting location
    const usedLocations = db.gameState.tribes.map(t => t.location);
    const availableLocation = db.gameState.startingLocations.find(loc => !usedLocations.includes(loc));

    if (!availableLocation) {
        return res.status(503).json({ message: 'No available starting locations. Please contact the admin.' });
    }
    
    const { q, r } = parseHexCoords(availableLocation);
    const initialExplored = getHexesInRange({q, r}, 2);

    const newTribe = {
        id: uuidv4(),
        playerId: req.user.id,
        playerName,
        tribeName,
        icon,
        stats,
        location: availableLocation,
        globalResources: { ...INITIAL_GLOBAL_RESOURCES },
        garrisons: {
            [availableLocation]: { ...INITIAL_GARRISON, chiefs: [] }
        },
        turnSubmitted: false,
        actions: [],
        lastTurnResults: [],
        exploredHexes: initialExplored,
        rationLevel: 'Normal',
        completedTechs: [],
        assets: [],
        currentResearch: null,
        journeyResponses: [],
        diplomacy: {},
    };
    
    // Set initial diplomacy status with other tribes
    db.gameState.tribes.forEach(otherTribe => {
        const initialStatus = (newTribe.isAI || otherTribe.isAI) ? 'War' : 'Neutral';
        newTribe.diplomacy[otherTribe.id] = { status: initialStatus };
        otherTribe.diplomacy[newTribe.id] = { status: initialStatus };
    });

    db.gameState.tribes.push(newTribe);
    writeDb(db);

    res.status(201).json(newTribe);
});

// PUT /api/tribes/:id
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const updatedTribeData = req.body;
    const db = readDb();
    
    const tribeIndex = db.gameState.tribes.findIndex(t => t.id === id);
    if (tribeIndex === -1) {
        return res.status(404).json({ message: "Tribe not found." });
    }

    // Authorization check
    if (db.gameState.tribes[tribeIndex].playerId !== req.user.id) {
        return res.status(403).json({ message: "You can only update your own tribe." });
    }
    
    db.gameState.tribes[tribeIndex] = {
        ...db.gameState.tribes[tribeIndex],
        ...updatedTribeData
    };
    
    writeDb(db);
    res.json(db.gameState.tribes[tribeIndex]);
});

// POST /api/tribes/:id/submit-turn
router.post('/:id/submit-turn', (req, res) => {
    const { id } = req.params;
    const { plannedActions, journeyResponses } = req.body;
    const db = readDb();

    const tribe = db.gameState.tribes.find(t => t.id === id);
    if (!tribe) {
        return res.status(404).json({ message: "Tribe not found" });
    }
    if (tribe.playerId !== req.user.id) {
        return res.status(403).json({ message: "Cannot submit turn for another player's tribe" });
    }

    tribe.actions = plannedActions;
    tribe.journeyResponses = journeyResponses;
    tribe.turnSubmitted = true;

    writeDb(db);
    res.status(204).send();
});

// --- Requests ---
// POST /api/requests/chief
router.post('/chief', (req, res) => {
    const { tribeId, chiefName, radixAddressSnippet } = req.body;
    const db = readDb();

    // Basic validation
    if (!tribeId || !chiefName || !radixAddressSnippet) {
        return res.status(400).json({ message: "Missing required fields for chief request." });
    }

    const newRequest = {
        id: uuidv4(),
        tribeId,
        chiefName,
        radixAddressSnippet,
        status: 'pending',
    };

    db.gameState.chiefRequests.push(newRequest);
    writeDb(db);
    res.status(201).json(newRequest);
});

// POST /api/requests/asset
router.post('/asset', (req, res) => {
    const { tribeId, assetName, radixAddressSnippet } = req.body;
    const db = readDb();
    if (!tribeId || !assetName || !radixAddressSnippet) {
        return res.status(400).json({ message: "Missing required fields for asset request." });
    }
    const newRequest = {
        id: uuidv4(),
        tribeId,
        assetName,
        radixAddressSnippet,
        status: 'pending',
    };
    db.gameState.assetRequests.push(newRequest);
    writeDb(db);
    res.status(201).json(newRequest);
});


// --- Diplomacy ---
// POST /api/diplomacy/propose-alliance
router.post('/propose-alliance', (req, res) => {
    const { fromTribeId, toTribeId } = req.body;
    const db = readDb();
    
    const newProposal = {
        id: uuidv4(),
        fromTribeId,
        toTribeId,
        fromTribeName: db.gameState.tribes.find(t => t.id === fromTribeId)?.tribeName || 'Unknown',
        statusChangeTo: 'Alliance',
        expiresOnTurn: db.gameState.turn + 3,
    };
    db.gameState.diplomaticProposals.push(newProposal);
    writeDb(db);
    res.status(201).send();
});

// POST /api/diplomacy/sue-for-peace
router.post('/sue-for-peace', (req, res) => {
    const { fromTribeId, toTribeId, reparations } = req.body;
    const db = readDb();
    
    const newProposal = {
        id: uuidv4(),
        fromTribeId,
        toTribeId,
        fromTribeName: db.gameState.tribes.find(t => t.id === fromTribeId)?.tribeName || 'Unknown',
        statusChangeTo: 'Neutral',
        expiresOnTurn: db.gameState.turn + 3,
        reparations,
    };
    db.gameState.diplomaticProposals.push(newProposal);
    writeDb(db);
    res.status(201).send();
});


// POST /api/diplomacy/declare-war
router.post('/declare-war', (req, res) => {
    const { fromTribeId, toTribeId } = req.body;
    const db = readDb();
    const tribe1 = db.gameState.tribes.find(t => t.id === fromTribeId);
    const tribe2 = db.gameState.tribes.find(t => t.id === toTribeId);

    if (tribe1 && tribe2) {
        tribe1.diplomacy[toTribeId] = { status: 'War' };
        tribe2.diplomacy[fromTribeId] = { status: 'War' };
        writeDb(db);
    }
    res.status(204).send();
});

// POST /api/diplomacy/respond
router.post('/respond', (req, res) => {
    const { proposalId, accept } = req.body;
    const db = readDb();
    
    const proposalIndex = db.gameState.diplomaticProposals.findIndex(p => p.id === proposalId);
    if (proposalIndex === -1) {
        return res.status(404).json({ message: "Proposal not found." });
    }

    const proposal = db.gameState.diplomaticProposals[proposalIndex];
    if (accept) {
        const tribe1 = db.gameState.tribes.find(t => t.id === proposal.fromTribeId);
        const tribe2 = db.gameState.tribes.find(t => t.id === proposal.toTribeId);

        if (tribe1 && tribe2) {
            tribe1.diplomacy[tribe2.id] = { status: proposal.statusChangeTo };
            tribe2.diplomacy[tribe1.id] = { status: proposal.statusChangeTo };

            if (proposal.statusChangeTo === 'Neutral' && proposal.reparations) {
                // Handle reparations transfer
                tribe1.globalResources.food -= proposal.reparations.food;
                tribe1.globalResources.scrap -= proposal.reparations.scrap;
                // Assuming weapons are transferred from home garrison for simplicity
                tribe1.garrisons[tribe1.location].weapons -= proposal.reparations.weapons;

                tribe2.globalResources.food += proposal.reparations.food;
                tribe2.globalResources.scrap += proposal.reparations.scrap;
                tribe2.garrisons[tribe2.location].weapons += proposal.reparations.weapons;
                
                // Add truce period
                const truceUntil = db.gameState.turn + 5;
                tribe1.diplomacy[tribe2.id].truceUntilTurn = truceUntil;
                tribe2.diplomacy[tribe1.id].truceUntilTurn = truceUntil;
            }
        }
    }
    
    // Remove proposal after it's been handled
    db.gameState.diplomaticProposals.splice(proposalIndex, 1);
    writeDb(db);
    res.status(204).send();
});


export default router;
