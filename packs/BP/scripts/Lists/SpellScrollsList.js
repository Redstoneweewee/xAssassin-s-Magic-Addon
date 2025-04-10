import * as Def from "../Definitions/SpellScrollDef";

const SpellScrollTag = "xassassin:spell_scroll";

/**@type {Def.SpellScrollDef[]} */
const SpellBooks = [
    {
        tag: "xassassin:fang_line_spell_scroll",
        spellName: "fangLine"
    },
    {
        tag: "xassassin:fireball_spell_scroll",
        spellName: "fireball"
    },
    {
        tag: "xassassin:minor_healing_spell_scroll",
        spellName: "minorHealing"
    },
    {
        tag: "xassassin:wind_dash_spell_scroll",
        spellName: "windDash"
    }
]
/** @type {Map<string, Def.SpellScroll>} */
const SpellScrollObjects = new Map();
SpellBooks.forEach(spellScroll => {
    SpellScrollObjects.set(spellScroll.tag, new Def.SpellScroll(spellScroll));
});



export { SpellScrollTag, SpellScrollObjects };