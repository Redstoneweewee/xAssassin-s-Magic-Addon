import { Player } from '@minecraft/server';

/**
 * @typedef {object} SpellDef
 * @property {string} name 
 * @property {((player: Player, chargeLevel: number) => void)} functionCall 
 */
class Spell {
    /**
     * @param {SpellDef} spellDef
     */
    constructor(spellDef) {
        this.name = spellDef.name;
        this.functionCall = spellDef.functionCall;
    }
}

export { Spell};