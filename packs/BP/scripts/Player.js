import { Player, world, system } from "@minecraft/server";
import * as Def from "./Definitions/PlayerDef";

/** @type {Map<string, Def.PlayerObject>} */
const PlayerObjectsMap = new Map();


world.afterEvents.playerSpawn.subscribe(eventData => {
    if(eventData.initialSpawn) {
        PlayerObjectsMap.set(eventData.player.id, new Def.PlayerObject(eventData.player.id));
    }
})

export { PlayerObjectsMap }