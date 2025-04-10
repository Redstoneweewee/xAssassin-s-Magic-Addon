import { EntityColorComponent, EntityComponentTypes, MolangVariableMap, Player, system } from "@minecraft/server";
import { PlayerUtil, SpellUtil } from "../Utilities";


/**
 * @typedef {((player: Player, chargeLevel: number) => void)} SpellFunction
 */



function none() {}

/**
 * @param {Player} player 
 */
function woololo(player) {
    player.playSound("mob.evocation_illager.prepare_wololo");
}
/**
 * 
 */
/** @type {SpellFunction[]} */
const SpellEnterFunctions = [
    none,
    woololo
]

/**
 * @type {Map<string, SpellFunction>}
 */
const SpellEnterFunctionsList = new Map();
for(const spellFunction of SpellEnterFunctions) {
    SpellEnterFunctionsList.set(spellFunction.name, spellFunction);
}

export { SpellEnterFunctionsList };