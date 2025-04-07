import { Player } from '@minecraft/server';
import { Spell } from './SpellDef';
import { emptySpellSlot } from '../Lists/SpellsList';

/**
 * @typedef {object} SpellBookDef
 * @property {string} tag 
 * @property {number} tier 
 * @property {Spell[]} inherentSpells 
 * @property {Spell[]} spells - changes during runtime. If a slot has no spell, it has a `SpellsList.emptySpellSlot` Spell
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
        for(let i=this.inherentSpells.length; i<this.tier; i++) {
            this.inherentSpells.push(emptySpellSlot);
        }
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