import fs from 'fs';
import path from 'path';
import { generateMapData } from './lib/mapGenerator.js';
import { migrateGameState } from './lib/gameState.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDirectory = path.join(__dirname, 'data');
const dbFilePath = path.join(dbDirectory, 'db.json');

const MAP_RADIUS = 40;

function getDefaultMapSettings() {
    return {
        biases: {
            Plains: 1, Desert: 1, Mountains: 1, Forest: 1,
            Ruins: 0.8, Wasteland: 1, Water: 1, Radiation: 0.5,
            Crater: 0.7, Swamp: 0.9,
        }
    };
}

// Ensure the data directory exists
if (!fs.existsSync(dbDirectory)) {
    fs.mkdirSync(dbDirectory);
}

export function initDb() {
    if (!fs.existsSync(dbFilePath)) {
        console.log('Database file not found. Creating a new one...');
        const mapSeed = Date.now();
        const mapSettings = getDefaultMapSettings();
        const { map, startingLocations } = generateMapData(MAP_RADIUS, mapSeed, mapSettings);
        
        const initialGameState = {
            mapData: map,
            tribes: [],
            turn: 1,
            startingLocations,
            chiefRequests: [],
            assetRequests: [],
            journeys: [],
            diplomaticProposals: [],
            history: [],
            mapSeed,
            mapSettings,
        };
        
        const initialDbState = {
            users: [],
            gameState: initialGameState,
        };
        
        fs.writeFileSync(dbFilePath, JSON.stringify(initialDbState, null, 2));
        console.log('Database initialized with a new map.');
    }
}

export function readDb() {
    const rawData = fs.readFileSync(dbFilePath);
    const data = JSON.parse(rawData);
    // Automatically migrate old data structures on read
    data.gameState = migrateGameState(data.gameState);
    return data;
}

export function writeDb(data) {
    fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2));
}

export function resetGame() {
    console.log('Resetting game state...');
    const db = readDb();
    const mapSeed = Date.now();
    const mapSettings = getDefaultMapSettings();
    const { map, startingLocations } = generateMapData(MAP_RADIUS, mapSeed, mapSettings);

    db.gameState = {
        mapData: map,
        tribes: [],
        turn: 1,
        startingLocations,
        chiefRequests: [],
        assetRequests: [],
        journeys: [],
        diplomaticProposals: [],
        history: [],
        mapSeed,
        mapSettings,
    };
    
    writeDb(db);
    console.log('Game state has been reset.');
}

export function clearTribesAndRequests() {
    const db = readDb();
    db.gameState.tribes = [];
    db.gameState.chiefRequests = [];
    db.gameState.assetRequests = [];
    db.gameState.journeys = [];
    db.gameState.diplomaticProposals = [];
    db.gameState.history = [];
    db.gameState.turn = 1;
    writeDb(db);
}
