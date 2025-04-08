import * as SpellBookDef from "../Definitions/SpellBookDef";
import { emptySpell, SpellNamesList, SpellObjects } from "./SpellsList";

const SpellBookTag = "xassassin:spellbook";

/**@type {SpellBookDef.SpellBookDef[]} */
const SpellBooks = [
    {
        tag: "xassassin:leather_spell_book",
        tier: 1,
        inherentSpells: []
    },
    {
        tag: "xassassin:copper_spell_book",
        tier: 2,
        inherentSpells: []
    },
    {
        tag: "xassassin:iron_spell_book",
        tier: 3,
        inherentSpells: []
    },
    {
        tag: "xassassin:gold_spell_book",
        tier: 4,
        inherentSpells: []
    },
    {
        tag: "xassassin:amethyst_spell_book",
        tier: 5,
        inherentSpells: []
    },
    {
        tag: "xassassin:emerald_spell_book",
        tier: 6,
        inherentSpells: []
    },
    {
        tag: "xassassin:evoker_spell_book",
        tier: 3,
        inherentSpells: [
            SpellObjects.get("fangAttack")??emptySpell,
            SpellObjects.get("minorHealingSpell")??emptySpell,
            SpellObjects.get("woololo")??emptySpell
        ]
    }
]
/** @type {Map<string, SpellBookDef.SpellBook>} */
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


export { SpellBookTag, SpellBookObjects };