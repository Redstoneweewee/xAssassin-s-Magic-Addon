import * as SpellsDef from "../Definitions/SpellDef";


/**@type {SpellsDef.Spell} */
const emptySpell = {
    tag: "emptySpellSlot",
    charge: 16,
    enterFuncName: "none",
    particleFuncName: "none",
    exitFuncName: "none",
    enhanceItems: []
}
/**@type {SpellsDef.Spell[]} */
const Spells = [
    {
        tag: "fangAttack",
        charge: 16,
        enterFuncName: "none",
        particleFuncName: "fangAttack",
        exitFuncName: "fangAttack",
        enhanceItems: []
    },
    {
        tag: "fangLine",
        charge: 16,
        enterFuncName: "none",
        particleFuncName: "fangLine",
        exitFuncName: "fangLine",
        enhanceItems: []
    },
    {
        tag: "minorHealing",
        charge: 16,
        enterFuncName: "none",
        particleFuncName: "none",
        exitFuncName: "minorHealing",
        enhanceItems: []
    },
    {
        tag: "woololo",
        charge: 16,
        enterFuncName: "woololo",
        particleFuncName: "woololo",
        exitFuncName: "woololo",
        enhanceItems: []
    },
    {
        tag: "fireball",
        charge: 16,
        enterFuncName: "none",
        particleFuncName: "fireball",
        exitFuncName: "fireball",
        enhanceItems: ["minecraft:dragon_breath"]
    },
    {
        tag: "windDash",
        charge: 16,
        enterFuncName: "none",
        particleFuncName: "windDash",
        exitFuncName: "windDash",
        enhanceItems: []
    }
]




/** @type {Map<string, SpellsDef.Spell>} */
const SpellObjects = new Map();
SpellObjects.set(emptySpell.tag, new SpellsDef.Spell(emptySpell));
Spells.forEach(spell => {
    SpellObjects.set(spell.tag, new SpellsDef.Spell(spell));
});



export { emptySpell, SpellObjects };