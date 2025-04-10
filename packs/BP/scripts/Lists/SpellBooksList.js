import * as Def from "../Definitions/SpellBookDef";
import { emptySpell, SpellObjects } from "./SpellsList";

const SpellBookTag = "xassassin:spell_book";

/**@type {Def.SpellBookDef[]} */
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
            SpellObjects.get("minorHealing")??emptySpell,
            SpellObjects.get("woololo")??emptySpell
        ]
    }
]
/** @type {Map<string, Def.SpellBook>} */
const SpellBookObjects = new Map();
SpellBooks.forEach(spellBook => {
    SpellBookObjects.set(spellBook.tag, new Def.SpellBook(spellBook));
});










/** 
 * @typedef {object} BaseSpellBooks
 * @property {string} spell_book
 * @property {string} evoker_spell_book
 */

/**
 * @type {BaseSpellBooks & Iterable<{ name: string, object: string }>}
 */
/* Deprecated for now
const SpellBooksList = {
    spell_book: "xassassin:spell_book",
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