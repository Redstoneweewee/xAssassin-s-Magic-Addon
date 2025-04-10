import { Player, world, system } from "@minecraft/server";
import * as Def from "./Definitions/PlayerDef";

/** @type {Map<string, Def.PlayerObject>} */
const PlayerObjectsMap = new Map();

//makes a PlayerObject for any new joining players
world.afterEvents.playerSpawn.subscribe(eventData => {
    if(eventData.initialSpawn) {
        PlayerObjectsMap.set(eventData.player.id, new Def.PlayerObject(eventData.player));
    }
});

//used if /reload
world.getAllPlayers().forEach(player => {
    if(PlayerObjectsMap.get(player.id) === undefined) {
        PlayerObjectsMap.set(player.id, new Def.PlayerObject(player));
    }
});

export { PlayerObjectsMap }