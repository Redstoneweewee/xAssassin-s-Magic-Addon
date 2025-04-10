import { Player } from '@minecraft/server';

class Spell {
    /**
     * @param {Spell} spellDef
     */
    constructor(spellDef) {
        this.tag = spellDef.tag;
        this.charge = spellDef.charge;
        this.enterFuncName = spellDef.enterFuncName ? spellDef.enterFuncName : "none";
        this.particleFuncName = spellDef.particleFuncName ? spellDef.particleFuncName : "none";
        this.exitFuncName = spellDef.exitFuncName ? spellDef.exitFuncName : "none";
        this.enhanceItems = spellDef.enhanceItems;
    }
}

export { Spell};