
import { system } from "@minecraft/server";


class PlayerState {
    /**
     * 
     * @param {string} name 
     * @param {boolean} canCastSpells 
     * @param {boolean} canSelectSpells 
     */
    constructor(name, canCastSpells, canSelectSpells) {
        this.name = name;
        this.canCastSpells = canCastSpells;
        this.canSelectSpells = canSelectSpells;
    }
}


/**
 * @typedef {object} PlayerStatesDef
 * @property {PlayerState} Default
 * @property {PlayerState} CastingSpell
 * @property {PlayerState} SelectingSpell
 */
const PlayerStates = {
    Default: new PlayerState("Default", true, true),
    CastingSpell: new PlayerState("Default", true, false),
    SelectingSpell: new PlayerState("Default", false, true),
}

class PlayerObject {
    #spellChargeStartTime;
    /**
     * @param {string} id 
     */
    constructor(id) {
        this.id = id;
        this.#spellChargeStartTime = 0;
        this.playerState = PlayerStates.Default;
    }

    startCountingSpellChargeTime() {
        this.spellChargeStartTime = system.currentTick;
    }

    /**
     * @returns {number} the time elapsed since the previous startCountingSpellChargeTime()
     */
    returnSpellChargeTime() {
        return system.currentTick - this.#spellChargeStartTime;
    }
}

export { PlayerObject, PlayerStates }