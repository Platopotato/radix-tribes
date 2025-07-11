import { User, GameState, HexData, GameAction, Tribe } from '../types';
import * as Auth from './auth';

// In a real application, this would be your backend server URL. e.g. https://api.radixtribes.com
// Using a relative URL works well for local development with a proxy.
const API_BASE_URL = '/api';

/**
 * A wrapper around the native fetch API that handles JSON, authentication, and error handling.
 * @param url The endpoint URL (e.g., '/game/state')
 * @param options The native fetch options object.
 * @returns The JSON response from the server.
 * @throws An error if the request fails or returns a non-ok status code.
 */
async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<any> {
    const token = Auth.getToken();
    const headers = new Headers(options.headers);

    if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${API_BASE_URL}${url}`, { ...options, headers });

    if (!response.ok) {
        if (response.status === 401) { // Unauthorized or Token Expired
            Auth.logout();
            // Force a reload to bring the user back to the login page cleanly.
            window.location.reload();
        }
        const errorData = await response.json().catch(() => ({ message: `HTTP Error: ${response.status} ${response.statusText}` }));
        throw new Error(errorData.message || 'An unknown API error occurred');
    }
    
    // Handle responses that might not have a body (e.g., 204 No Content)
    if (response.status === 204) {
        return;
    }

    return response.json();
}

// --- Auth ---
export const login = (username: string, password: string): Promise<{ user: User, token: string }> => fetchWithAuth(`/auth/login`, { method: 'POST', body: JSON.stringify({ username, password }) });
export const register = (username: string, password: string, securityQuestion: string, securityAnswer: string): Promise<{ user: User, token: string }> => fetchWithAuth(`/auth/register`, { method: 'POST', body: JSON.stringify({ username, password, securityQuestion, securityAnswer }) });
export const getSecurityQuestion = (username: string): Promise<{ question: string }> => fetchWithAuth(`/auth/get-question`, { method: 'POST', body: JSON.stringify({ username }) });
export const verifySecurityAnswer = (username: string, answer: string): Promise<void> => fetchWithAuth(`/auth/verify-answer`, { method: 'POST', body: JSON.stringify({ username, answer }) });
export const resetPassword = (username: string, newPassword: string): Promise<void> => fetchWithAuth(`/auth/reset-password`, { method: 'POST', body: JSON.stringify({ username, newPassword }) });

// --- User & Game State ---
export const getMe = (): Promise<User> => fetchWithAuth(`/users/me`);
export const getAllUsers = (): Promise<User[]> => fetchWithAuth(`/users`);
export const getGameState = (): Promise<GameState> => fetchWithAuth(`/game/state`);

// --- Tribes ---
export const createTribe = (tribeData: any): Promise<Tribe> => fetchWithAuth(`/tribes`, { method: 'POST', body: JSON.stringify(tribeData) });
export const updateTribe = (tribe: Tribe): Promise<Tribe> => fetchWithAuth(`/tribes/${tribe.id}`, { method: 'PUT', body: JSON.stringify(tribe) });
export const submitTurn = (tribeId: string, plannedActions: GameAction[], journeyResponses: Tribe['journeyResponses']): Promise<void> => fetchWithAuth(`/tribes/${tribeId}/submit-turn`, { method: 'POST', body: JSON.stringify({ plannedActions, journeyResponses }) });

// --- Requests ---
export const requestChief = (tribeId: string, chiefName: string, radixAddressSnippet: string): Promise<void> => fetchWithAuth(`/requests/chief`, { method: 'POST', body: JSON.stringify({ tribeId, chiefName, radixAddressSnippet }) });
export const requestAsset = (tribeId: string, assetName: string, radixAddressSnippet: string): Promise<void> => fetchWithAuth(`/requests/asset`, { method: 'POST', body: JSON.stringify({ tribeId, assetName, radixAddressSnippet }) });

// --- Diplomacy ---
export const proposeAlliance = (fromTribeId: string, toTribeId: string): Promise<void> => fetchWithAuth(`/diplomacy/propose-alliance`, { method: 'POST', body: JSON.stringify({ fromTribeId, toTribeId }) });
export const sueForPeace = (fromTribeId: string, toTribeId: string, reparations: any): Promise<void> => fetchWithAuth(`/diplomacy/sue-for-peace`, { method: 'POST', body: JSON.stringify({ fromTribeId, toTribeId, reparations }) });
export const declareWar = (fromTribeId: string, toTribeId: string): Promise<void> => fetchWithAuth(`/diplomacy/declare-war`, { method: 'POST', body: JSON.stringify({ fromTribeId, toTribeId }) });
export const respondToProposal = (proposalId: string, accept: boolean): Promise<void> => fetchWithAuth(`/diplomacy/respond`, { method: 'POST', body: JSON.stringify({ proposalId, accept }) });


// --- Admin ---
export const processTurn = (): Promise<void> => fetchWithAuth(`/admin/process-turn`, { method: 'POST' });
export const updateMap = (mapData: HexData[], startingLocations: string[]): Promise<void> => fetchWithAuth(`/admin/update-map`, { method: 'POST', body: JSON.stringify({ mapData, startingLocations }) });
export const removePlayer = (userId: string): Promise<void> => fetchWithAuth(`/admin/users/${userId}`, { method: 'DELETE' });
export const startNewGame = (): Promise<void> => fetchWithAuth(`/admin/new-game`, { method: 'POST' });
export const addAITribe = (): Promise<void> => fetchWithAuth(`/admin/add-ai`, { method: 'POST' });
export const approveChiefRequest = (requestId: string): Promise<void> => fetchWithAuth(`/requests/chief/${requestId}/approve`, { method: 'POST' });
export const denyChiefRequest = (requestId: string): Promise<void> => fetchWithAuth(`/requests/chief/${requestId}/deny`, { method: 'POST' });
export const approveAssetRequest = (requestId: string): Promise<void> => fetchWithAuth(`/requests/asset/${requestId}/approve`, { method: 'POST' });
export const denyAssetRequest = (requestId: string): Promise<void> => fetchWithAuth(`/requests/asset/${requestId}/deny`, { method: 'POST' });

export async function loadBackup(backupFile: File): Promise<void> {
    const formData = new FormData();
    formData.append('backup', backupFile);
    
    const token = Auth.getToken();
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Note: We don't set 'Content-Type' for FormData, the browser does it automatically with the correct boundary.
    const response = await fetch(`${API_BASE_URL}/admin/load-backup`, {
        method: 'POST',
        body: formData,
        headers,
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP Error: ${response.status} ${response.statusText}` }));
        throw new Error(errorData.message || 'An API error occurred during file upload');
    }
}