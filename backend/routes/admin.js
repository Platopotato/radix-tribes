import express from 'express';
import multer from 'multer';
import auth from '../middleware/auth.js';
import admin from '../middleware/admin.js';
import { readDb, writeDb, clearTribesAndRequests } from '../db.js';
import { processGlobalTurn } from '../lib/turnProcessor.js';
import { generateAITribe } from '../lib/ai/aiTribeGenerator.js';
import { ALL_CHIEFS } from '../lib/chiefData.js';
import { ALL_ASSETS } from '../lib/assetData.js';
import { migrateGameState } from '../lib/gameState.js';


const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // Use memory storage for file uploads

// All routes in this file require both authentication and admin privileges
router.use(auth, admin);

// POST /api/admin/process-turn
router.post('/process-turn', (req, res) => {
    try {
        const db = readDb();
        const newGameState = processGlobalTurn(db.gameState);
        db.gameState = newGameState;
        writeDb(db);
        res.status(200).json({ message: 'Turn processed successfully.' });
    } catch (error) {
        console.error("Error processing turn:", error);
        res.status(500).json({ message: `Error processing turn: ${error.message}` });
    }
});

// POST /api/admin/update-map
router.post('/update-map', (req, res) => {
    const { mapData, startingLocations } = req.body;
    if (!mapData || !startingLocations) {
        return res.status(400).json({ message: 'Map data and starting locations are required.' });
    }
    const db = readDb();
    db.gameState.mapData = mapData;
    db.gameState.startingLocations = startingLocations;
    writeDb(db);
    res.status(200).json({ message: 'Map updated successfully.' });
});

// DELETE /api/admin/users/:userId
router.delete('/users/:userId', (req, res) => {
    const { userId } = req.params;
    const db = readDb();
    
    const userIndex = db.users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        return res.status(404).json({ message: 'User not found.' });
    }
    
    // Remove user
    db.users.splice(userIndex, 1);
    // Remove their tribe
    db.gameState.tribes = db.gameState.tribes.filter(t => t.playerId !== userId);
    
    writeDb(db);
    res.status(204).send();
});

// POST /api/admin/new-game
router.post('/new-game', (req, res) => {
    clearTribesAndRequests();
    res.status(200).json({ message: 'New game started. All tribes cleared and turn reset.' });
});

// POST /api/admin/add-ai
router.post('/add-ai', (req, res) => {
    const db = readDb();
    const { tribes, startingLocations } = db.gameState;
    const usedLocations = tribes.map(t => t.location);
    const availableLocation = startingLocations.find(loc => !usedLocations.includes(loc));

    if (!availableLocation) {
        return res.status(503).json({ message: 'No available starting locations for AI tribe.' });
    }
    
    const existingTribeNames = tribes.map(t => t.tribeName);
    const newAITribe = generateAITribe(availableLocation, existingTribeNames);
    
    // Set diplomacy with all existing tribes
    tribes.forEach(otherTribe => {
        const initialStatus = 'War'; // AI starts at war with everyone
        newAITribe.diplomacy[otherTribe.id] = { status: initialStatus };
        otherTribe.diplomacy[newAITribe.id] = { status: initialStatus };
    });
    
    tribes.push(newAITribe);
    writeDb(db);
    res.status(201).json(newAITribe);
});


// POST /requests/chief/:requestId/(approve|deny)
const handleChiefRequest = (approve) => (req, res) => {
    const { requestId } = req.params;
    const db = readDb();
    const request = db.gameState.chiefRequests.find(r => r.id === requestId);

    if (!request) return res.status(404).json({ message: 'Request not found' });
    
    if (approve) {
        const tribe = db.gameState.tribes.find(t => t.id === request.tribeId);
        const chiefData = ALL_CHIEFS.find(c => c.name === request.chiefName);
        if (tribe && chiefData) {
            tribe.garrisons[tribe.location].chiefs.push(chiefData);
        }
        request.status = 'approved';
    } else {
        request.status = 'denied';
    }

    writeDb(db);
    res.status(204).send();
};

router.post('/requests/chief/:requestId/approve', handleChiefRequest(true));
router.post('/requests/chief/:requestId/deny', handleChiefRequest(false));


// POST /requests/asset/:requestId/(approve|deny)
const handleAssetRequest = (approve) => (req, res) => {
    const { requestId } = req.params;
    const db = readDb();
    const request = db.gameState.assetRequests.find(r => r.id === requestId);

    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (approve) {
        const tribe = db.gameState.tribes.find(t => t.id === request.tribeId);
        const assetData = ALL_ASSETS.find(a => a.name === request.assetName);
        if (tribe && assetData) {
            tribe.assets = [...(tribe.assets || []), assetData.name];
        }
        request.status = 'approved';
    } else {
        request.status = 'denied';
    }
    
    writeDb(db);
    res.status(204).send();
};

router.post('/requests/asset/:requestId/approve', handleAssetRequest(true));
router.post('/requests/asset/:requestId/deny', handleAssetRequest(false));

// POST /api/admin/load-backup
router.post('/load-backup', upload.single('backup'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No backup file uploaded.' });
    }

    try {
        const backupData = JSON.parse(req.file.buffer.toString());
        
        // Basic validation
        if (!backupData.users || !backupData.gameState) {
            return res.status(400).json({ message: 'Invalid backup file format. Must contain "users" and "gameState" keys.' });
        }
        
        // Migrate gameState to ensure it's up-to-date
        backupData.gameState = migrateGameState(backupData.gameState);

        writeDb(backupData);
        res.status(200).json({ message: 'Backup restored successfully.' });
    } catch (error) {
        res.status(500).json({ message: `Failed to process backup file: ${error.message}` });
    }
});


export default router;
