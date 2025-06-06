import { world, Player, system } from "@minecraft/server";
import { PlayerUtil, SpellBookUtil, SpellUtil, StringUtil } from "../Utilities";
import { Spell } from "../Definitions/SpellDef";

const unchargedSymbol = "§r§7[§f-§7]§r";
const chargedSymbol = "§r§a[§e+§a]§r";
const enhancedSymbol = "§r§5[§d+§5]§r";




/**
 * Will have to be called via a playerObject system run inverval
 * @param {Player} player 
 * @param {Spell} spellObject 
 */
function startChargeIndicator(player, spellObject) {
    const playerObject = PlayerUtil.getPlayerObject(player);
    if(!playerObject.playerState.canCastSpells) { return; }
    const offHandContainerSlot = PlayerUtil.getOffhandContainerSlot(player);
    if(offHandContainerSlot === undefined) { return; }

    const necessaryCharge = spellObject.charge;
    const enhanced = SpellBookUtil.hasAnyEnhanceItems(player, spellObject);
    const maxChargeLevel = enhanced ? 4 : 3;
    //The interval is cleared in SpellCast.onEndSpellCast();
    playerObject.spellChargeRunId = system.runInterval(() => {
        const chargeTime = playerObject.returnSpellChargeTime();
        const chargeLevel = Math.min(maxChargeLevel, Math.floor(chargeTime / necessaryCharge));
        let display = "";
        display += StringUtil.convertTagToName(spellObject.tag) + "\n";
        for(let i=1; i<=maxChargeLevel; i++) {
            if(chargeLevel >= i && i != 4) {
                display += chargedSymbol + " ";
            }
            else if(chargeLevel >= i && i == 4) {
                display += enhancedSymbol + " ";
            }
            else {
                display += unchargedSymbol + " ";
            }
        }
        //removes the last character, which is always a space
        display = display.substring(0, display.length-1);
        playerObject.queueActionbarDisplay(display, 0);
        //if (system.currentTick % 2 === 0) {
        //    spawnChargeParticles(player, chargeLevel, currentSpell)
        //}
        if (chargeLevel > Math.min(maxChargeLevel, Math.floor((chargeTime - 1) / necessaryCharge))) {
            const basePitch = 0.8
            const pitchIncrement = 0.1
            const pitch = basePitch + chargeLevel * pitchIncrement
            player.playSound("random.orb", { pitch: Math.min(pitch, 2.0) })
        }
        SpellUtil.callSpellParticleFunction(spellObject.particleFuncName, player, chargeLevel);
    }, 2);
}

export { startChargeIndicator };