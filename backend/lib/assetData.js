// This file is a direct copy of the frontend `lib/assetData.ts` to use its logic on the server.
// All imports have been updated to use the `.js` extension for ES Module compatibility in Node.

export const ALL_ASSETS = [
    {
        name: "Dune Buggy",
        description: "A fast, lightweight vehicle ideal for crossing open terrain quickly, though it offers little protection.",
        key_image_url: "https://www.platopotato.com/NFT/Tribes/assets/buggy.gif",
        effects: [
            { type: 'MOVEMENT_SPEED_BONUS', value: 0.20 },
            { type: 'COMBAT_BONUS_DEFENSE', value: -0.10, terrain: 'Plains' },
            { type: 'COMBAT_BONUS_DEFENSE', value: -0.10, terrain: 'Desert' },
        ]
    },
    {
        name: "Ghillie Mantle",
        description: "A camouflage cloak made of synthetic fibers and local flora, offering superb concealment in forests.",
        key_image_url: "https://www.platopotato.com/NFT/Tribes/assets/ghillie.gif",
        effects: [
            { type: 'COMBAT_BONUS_DEFENSE', value: 0.25, terrain: 'Forest' }
        ]
    },
    {
        name: "Advanced Sonar",
        description: "A recovered piece of old-world tech that can detect dense scrap deposits deep underground.",
        key_image_url: "https://www.platopotato.com/NFT/Tribes/assets/sonar.gif",
        effects: [
            { type: 'SCAVENGE_YIELD_BONUS', value: 0.20, resource: 'Scrap' }
        ]
    },
    {
        name: "Hydro-Purifier",
        description: "A portable device that makes questionable water sources safe, drastically improving the success of finding food.",
        key_image_url: "https://www.platopotato.com/NFT/Tribes/assets/purifier.gif",
        effects: [
            { type: 'SCAVENGE_YIELD_BONUS', value: 0.20, resource: 'Food' }
        ]
    },
    {
        name: "Bunker Buster",
        description: "A heavy-duty explosive charge designed to breach fortified positions in urban environments.",
        key_image_url: "https://www.platopotato.com/NFT/Tribes/assets/buster.gif",
        effects: [
            { type: 'COMBAT_BONUS_ATTACK', value: 0.25, terrain: 'Ruins' }
        ]
    },
    {
        name: "Junk-Forged Armor",
        description: "Layers of scrap metal and hardened leather, providing a baseline improvement to troop survivability.",
        key_image_url: "https://www.platopotato.com/NFT/Tribes/assets/junk_armor.gif",
        effects: [
            { type: 'COMBAT_BONUS_DEFENSE', value: 0.05 }
        ]
    },
    {
        name: "Whetstone",
        description: "A simple but effective tool for keeping blades sharp, ensuring every strike counts.",
        key_image_url: "https://www.platopotato.com/NFT/Tribes/assets/whetstone.gif",
        effects: [
            { type: 'COMBAT_BONUS_ATTACK', value: 0.05 }
        ]
    },
    {
        name: "Seed Vault",
        description: "A collection of pre-war seeds, genetically engineered for resilience. Provides a small, steady supply of food.",
        key_image_url: "https://www.platopotato.com/NFT/Tribes/assets/seed_vault.gif",
        effects: [
            { type: 'PASSIVE_FOOD_GENERATION', value: 5 }
        ]
    },
    {
        name: "Scrap Compressor",
        description: "An automated hydraulic press that compacts loose junk into usable scrap plates.",
        key_image_url: "https://www.platopotato.com/NFT/Tribes/assets/compressor.gif",
        effects: [
            { type: 'PASSIVE_SCRAP_GENERATION', value: 5 }
        ]
    },
    {
        name: "Mountaineering Gear",
        description: "Picks, ropes, and climbing harnesses that allow for aggressive maneuvers in treacherous mountain terrain.",
        key_image_url: "https://www.platopotato.com/NFT/Tribes/assets/mountaineering_gear.gif",
        effects: [
            { type: 'COMBAT_BONUS_ATTACK', value: 0.20, terrain: 'Mountains' }
        ]
    },
    {
        name: "Swamp Skiff",
        description: "A flat-bottomed boat perfect for navigating murky bogs, allowing for better defensive positioning.",
        key_image_url: "https://www.platopotato.com/NFT/Tribes/assets/swamp_skiff.gif",
        effects: [
            { type: 'COMBAT_BONUS_DEFENSE', value: 0.20, terrain: 'Swamp' }
        ]
    },
    {
        name: "Desert Cloaks",
        description: "Flowing robes that provide protection from the sun and sand, helping troops blend into the desert landscape.",
        key_image_url: "https://www.platopotato.com/NFT/Tribes/assets/desert_cloaks.gif",
        effects: [
            { type: 'COMBAT_BONUS_DEFENSE', value: 0.20, terrain: 'Desert' }
        ]
    },
    {
        name: "Barbed Wire",
        description: "Spools of rusted, sharp wire, perfect for creating defensive perimeters in open plains.",
        key_image_url: "https://www.platopotato.com/NFT/Tribes/assets/barbed_wire.gif",
        effects: [
            { type: 'COMBAT_BONUS_DEFENSE', value: 0.20, terrain: 'Plains' }
        ]
    },
    {
        name: "Ambush Netting",
        description: "Lightweight nets that can be quickly deployed from treetops, entangling enemies in forest ambushes.",
        key_image_url: "https://www.platopotato.com/NFT/Tribes/assets/ambush_netting.gif",
        effects: [
            { type: 'COMBAT_BONUS_ATTACK', value: 0.20, terrain: 'Forest' }
        ]
    },
    {
        name: "Scrap Cannon",
        description: "A crude but effective projectile launcher, deadly when used in the open badlands.",
        key_image_url: "https://www.platopotato.com/NFT/Tribes/assets/scrap_cannon.gif",
        effects: [
            { type: 'COMBAT_BONUS_ATTACK', value: 0.20, terrain: 'Wasteland' }
        ]
    },
    {
        name: "Radiation Suit",
        description: "A lead-lined suit that offers some protection against hazardous environments.",
        key_image_url: "https://www.platopotato.com/NFT/Tribes/assets/radiation_suit.gif",
        effects: [
            { type: 'COMBAT_BONUS_DEFENSE', value: 0.25, terrain: 'Radiation' }
        ]
    },
    {
        name: "Scout's Medkit",
        description: "A pouch containing bandages, herbal remedies, and stimulants, increasing the amount of foraged food.",
        key_image_url: "https://www.platopotato.com/NFT/Tribes/assets/medkit.gif",
        effects: [
            { type: 'SCAVENGE_YIELD_BONUS', value: 0.15, resource: 'Food' }
        ]
    },
    {
        name: "Masterwork Tools",
        description: "A set of high-quality pre-war tools, invaluable for salvaging and repairing complex weapon systems.",
        key_image_url: "https://www.platopotato.com/NFT/Tribes/assets/masterwork_tools.gif",
        effects: [
            { type: 'SCAVENGE_YIELD_BONUS', value: 0.15, resource: 'Weapons' }
        ]
    },
    {
        name: "Ballistic Shields",
        description: "Heavy shields made from repurposed vehicle armor, excellent for defending fortified positions in ruins.",
        key_image_url: "https://www.platopotato.com/NFT/Tribes/assets/ballistic_shields.gif",
        effects: [
            { type: 'COMBAT_BONUS_DEFENSE', value: 0.10, terrain: 'Ruins' }
        ]
    },
    {
        name: "Ratchet Set",
        description: "A complete set of wrenches and ratchets, making the disassembly of junk for scrap far more efficient.",
        key_image_url: "https://www.platopotato.com/NFT/Tribes/assets/ratchet_set.gif",
        effects: [
            { type: 'SCAVENGE_YIELD_BONUS', value: 0.15, resource: 'Scrap' }
        ]
    }
];

export function getAsset(assetName) {
    return ALL_ASSETS.find(a => a.name === assetName);
}
