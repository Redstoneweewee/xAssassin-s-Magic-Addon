import * as Def from "../Definitions/SpellScrollDef";

const SpellScrollTag = "xassassin:spell_scroll";

/**@type {Def.SpellScrollDef[]} */
const SpellScrolls = [
    {
        tag: "xassassin:fang_line_spell_scroll",
        spellTag: "fangLine"
    },
    {
        tag: "xassassin:fireball_spell_scroll",
        spellTag: "fireball"
    },
    {
        tag: "xassassin:minor_healing_spell_scroll",
        spellTag: "minorHealing"
    },
    {
        tag: "xassassin:wind_dash_spell_scroll",
        spellTag: "windDash"
    },    
    {
        tag: "xassassin:charged_sonic_blast_spell_scroll",
        spellTag: "sonicBlast"
    }
]
/** @type {Map<string, Def.SpellScroll>} */
const SpellScrollObjects = new Map();
SpellBooks.forEach(spellScroll => {
    SpellScrollObjects.set(spellScroll.tag, new Def.SpellScroll(spellScroll));
});



export { SpellScrollTag, SpellScrollObjects };
