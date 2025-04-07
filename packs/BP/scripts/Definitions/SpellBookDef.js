import { Player } from '@minecraft/server';
import { Spell } from './SpellDef';

/**
 * @typedef {object} SpellBookDef
 * @property {string} tag 
 * @property {number} tier 
 * @property {Spell[]} inherentSpells 
 * @property {Spell[]} spells - changes dring runtime
 * @property {boolean} alterable 
 */
class SpellBook {
    /**
     * @param {SpellBookDef} spellBooksDef
     */
    constructor(spellBooksDef) {
        this.tag = spellBooksDef.tag;
        this.tier = spellBooksDef.tier;
        this.inherentSpells = spellBooksDef.inherentSpells;
        this.spells = spellBooksDef.spells;
        this.alterable = spellBooksDef.alterable;
        if(this.inherentSpells.length > this.tier) {
            console.error(`The number of inherent spells: (${this.inherentSpells.length}) must be <= tier: (${this.tier})`);
        }
        this.inherentSpells.forEach(spell => {
            this.addSpell(spell);
        });
    }

    /**
     * 
     * @param {import('./SpellDef').SpellDef} spell 
     */
    addSpell(spell) {
        if(!this.alterable) { return; }
        if(this.spells.length === this.tier) { return; }
        this.spells = [...this.spells, spell];
    }
}

export {SpellBook};