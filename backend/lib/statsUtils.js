// This file is a direct copy of the frontend `lib/statsUtils.ts` to use its logic on the server.
// All imports have been updated to use the `.js` extension for ES Module compatibility in Node.

export const calculateTribeScore = (tribe) => {
    const totalTroops = Object.values(tribe.garrisons).reduce((sum, g) => sum + g.troops, 0);
    const totalWeapons = Object.values(tribe.garrisons).reduce((sum, g) => sum + g.weapons, 0);
    const totalChiefs = Object.values(tribe.garrisons).reduce((sum, g) => sum + (g.chiefs?.length || 0), 0);
    
    const militaryScore = (totalTroops * 1) + (totalWeapons * 2);
    const economicScore = (tribe.globalResources.food * 0.2) + (tribe.globalResources.scrap * 0.5);
    const territoryScore = Object.keys(tribe.garrisons).length * 25;
    const techScore = tribe.completedTechs.length * 50;
    const chiefScore = totalChiefs * 40;
    const moraleScore = tribe.globalResources.morale;

    return Math.round(militaryScore + economicScore + territoryScore + techScore + chiefScore + moraleScore);
};
