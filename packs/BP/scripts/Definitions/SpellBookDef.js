import { Player } from '@minecraft/server';
import { Spell } from './SpellDef';
import { emptySpell } from '../Lists/SpellsList';

/**
 * @typedef {object} SpellBookDef
 * @property {string} tag 
 * @property {number} tier 
 * @property {Spell[]} inherentSpells 
 */

/**
 * @typedef {object} SpellBookJSONDef
 * @property {string} tag 
 * @property {number} tier 
 * @property {import('./SpellDef').SpellDef[]} inherentSpells 
 * @property {import('./SpellDef').SpellDef[]} spells 
 * @property {number} selectedSlot 
 */

class SpellBook {
    #inherentSpells;
    /** @type {Spell[]} */
    #spells;
    #selectedSlot;
    /**
     * @param {SpellBookDef} spellBooksDef
     * @param {Spell[]} [spells] Only used for reconstruction
     * @param {number} [selectedSlot] Only used for reconstruction
     */
    constructor(spellBooksDef, spells = [], selectedSlot = 0) {
        this.tag = spellBooksDef.tag;
        this.tier = spellBooksDef.tier;
        this.#inherentSpells = spellBooksDef.inherentSpells;
        this.#spells = spells;
        this.#selectedSlot = selectedSlot;
        if(spells.length === 0) { //only do this if it isn't reconstruction
            if(this.#inherentSpells.length > this.tier) {
                console.error(`The number of inherent spells: (${this.#inherentSpells.length}) must be <= tier: (${this.tier})`);
            }
            for(let i=0; i<this.#inherentSpells.length; i++) {
                this.setSpell(i, this.#inherentSpells[i]);
            }
            for(let i=this.#inherentSpells.length; i<this.tier; i++) {
                this.setSpell(i, emptySpell);
            }
        }
    }


    incrementSelectedSlot() {
        for(let i=1; i<this.tier; i++) {
            let nextSlot = (this.#selectedSlot+i) % this.tier;
            if(!this.#isEmptySpell(this.#spells[nextSlot])) {
                this.#selectedSlot = nextSlot;
                console.log(`new selected slot: ${this.#selectedSlot}`);
                return;
            }
        }
        console.log(`new selected slot: ${this.#selectedSlot}`);
    }

    /**
     * @param {number} slotNumber 
     * @param {import('./SpellDef').SpellDef} spell 
     */
    setSpell(slotNumber, spell) {
        if(slotNumber < 0 || slotNumber >= this.tier) {
            console.warn(`SpellBook.setSpell() slotNumber ${slotNumber} is out of bounds. Max num is ${this.tier}.`);
            return;
        }
        this.#spells[slotNumber] = spell;

        this.#tryChangeSelectedSlot();
    }

    /**
     * @returns {Spell}
     */
    getSelectedSpell() {
        return this.#spells[this.#selectedSlot];
    }
    /**
     * @returns {Spell}
     */
    getPreviousSpell() {
        for(let i=1; i<this.tier; i++) {
            const nextPrevSpell = this.#spells[(this.#selectedSlot+(this.tier-i)) % this.tier];
            if(!this.#isEmptySpell(nextPrevSpell)) {
                return nextPrevSpell;
            }
        }
        return this.#spells[this.#selectedSlot];
    }
    /**
     * @returns {Spell}
     */
    getNextSpell() {
        for(let i=1; i<this.tier; i++) {
            const nextSpell = this.#spells[(this.#selectedSlot+i) % this.tier];
            if(!this.#isEmptySpell(nextSpell)) {
                return nextSpell;
            }
        }
        return this.#spells[this.#selectedSlot];
    }

    /**
     * @returns {Spell[]}
     */
    getSpellsArray() {
        return this.#spells;
    }

    /**
     * try to change selectedSlot to non-empty spell slot if it is currently empty.
     */
    #tryChangeSelectedSlot() {
        if(!this.#isEmptySpell(this.#spells[this.#selectedSlot])) { return; }
        for(let i=0; i<this.#spells.length; i++) {
            if(!this.#isEmptySpell(this.#spells[i])) {
                this.#selectedSlot = i;
                return;
            }
        }
    }

    toJSON() {
        /** @type {SpellBookJSONDef} */
        const object = {
            tag: this.tag,
            tier: this.tier,
            inherentSpells: this.#inherentSpells,
            spells: this.#spells,
            selectedSlot: this.#selectedSlot
        };
        return object;
    }

    getInherentSpell(index) {
        return this.#inherentSpells[index];
    }

    /**
     * We need a special one here becase SpellUtil might not be initialized yet
     * @param {Spell} spell
     */
    #isEmptySpell(spell) {
        return spell.tag === emptySpell.tag
    }
}

export {SpellBook};