import * as SpellBookDef from "../Definitions/SpellBookDef";

/**@type {SpellBookDef.SpellBookDef[]} */
const SpellBooks = [
    {
        tag: "xassassin:leather_spell_book",
        tier: 1,
        inherentSpells: [],
        spells: [],
        alterable: true
    },
    {
        tag: "xassassin:copper_spell_book",
        tier: 2,
        inherentSpells: [],
        spells: [],
        alterable: true
    },
    {
        tag: "xassassin:iron_spell_book",
        tier: 3,
        inherentSpells: [],
        spells: [],
        alterable: true
    },
    {
        tag: "xassassin:gold_spell_book",
        tier: 4,
        inherentSpells: [],
        spells: [],
        alterable: true
    },
    {
        tag: "xassassin:amethyst_spell_book",
        tier: 5,
        inherentSpells: [],
        spells: [],
        alterable: true
    },
    {
        tag: "xassassin:emerald_spell_book",
        tier: 6,
        inherentSpells: [],
        spells: [],
        alterable: true
    },
    {
        tag: "xassassin:evoker_spell_book",
        tier: 3,
        inherentSpells: [],
        spells: [],
        alterable: false
    }
]

const SpellBookObjects = new Map();
SpellBooks.forEach(spellBook => {
    SpellBookObjects.set(spellBook.tag, new SpellBookDef.SpellBook(spellBook));
});










/** 
 * @typedef {object} BaseSpellBooks
 * @property {string} spellbook
 * @property {string} evoker_spell_book
 */

/**
 * @type {BaseSpellBooks & Iterable<{ name: string, object: string }>}
 */
/* Deprecated for now
const SpellBooksList = {
    spellbook: "xassassin:spellbook",
    evoker_spell_book: "xassassin:evoker_spell_book",

    [Symbol.iterator]: function* () {
        for (const [name, object] of Object.entries(this)) {
            // Skip the iterator itself to avoid recursion
            if (typeof object === "function") continue;
            yield { name, object };
        }
    }
};
*/


export { SpellBookObjects };