import { Player } from '@minecraft/server';

/**
 * @typedef {object} SpellScrollDef
 * @property {string} tag 
 * @property {string} spellTag
 */
class SpellScroll {
    /**
     * @param {SpellScrollDef} spellDef
     */
    constructor(spellDef) {
        this.tag = spellDef.tag;
        this.spellTag = spellDef.spellTag;
    }
}

export { SpellScroll };