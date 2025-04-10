import { Player } from '@minecraft/server';

/**
 * @typedef {object} SpellDef
 * @property {string} tag 
 * @property {number} charge - The time it takes to charge 1 bar
 * @property {string} enterFuncName 
 * @property {string} spellFuncName
 * @property {string[]} enhanceItems
 */
class Spell {
    /**
     * @param {SpellDef} spellDef
     */
    constructor(spellDef) {
        this.tag = spellDef.tag;
        this.charge = spellDef.charge;
        this.enterFuncName = spellDef.enterFuncName;
        this.spellFuncName = spellDef.spellFuncName;
        this.enhanceItems = spellDef.enhanceItems;
    }
}

export { Spell};