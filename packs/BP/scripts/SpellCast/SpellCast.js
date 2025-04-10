import { world, Player, system } from "@minecraft/server";
import { PlayerUtil, SpellBookUtil, SpellUtil } from "../Utilities.js";
import { SpellObjects } from "../Lists/SpellsList.js";
import { Spell } from "../Definitions/SpellDef.js";
import * as SpellCharge from "./SpellCharge.js";
import { DisplayTypes } from "../Definitions/ScreenDisplayDef.js";
//import { SpellBooksList } from "./Lists/SpellBooksList.js";


/**
 * @typedef {object} SpellActionDef
 * @property {string} NoOverride don't override actionbar
 * @property {string} Succeeded override actionbar with ""
 * @property {string} Cancelled override actionbar with "Cancelled"
 */
/** @type {SpellActionDef} */
const SpellAction = {
    NoOverride: "NoOverride",
    Succeeded: "Succeeded",
    Cancelled: "Cancelled"
}

world.afterEvents.itemStartUse.subscribe(eventData => {
    noSpellBookWarning(eventData.source);
    onStartSpellCast(eventData.source, (spellAction) => onEndSpellCast(eventData.source, spellAction));
});

world.afterEvents.itemReleaseUse.subscribe(eventData => {
    onReleaseSpellCast(eventData.source, (spellAction) => onEndSpellCast(eventData.source, spellAction));
});
world.afterEvents.itemStopUse.subscribe(eventData => {
    onCancelSpellCast(eventData.source);
});

world.afterEvents.entityDie.subscribe(eventData => {
    const entity = eventData.deadEntity;
    if(!(entity instanceof Player)) { return; }
    onEndSpellCast(entity, SpellAction.Cancelled);
});

/**
 * 
 * @param {Player} player 
 * @param {(cancelled: string) => void} onEndCallback 
 */
function onStartSpellCast(player, onEndCallback) {
    const playerObject = PlayerUtil.getPlayerObject(player);
    if(!playerObject.playerState.canCastSpells) return onEndCallback(SpellAction.NoOverride);
    playerObject.startCountingSpellChargeTime();
    const offHandContainerSlot = PlayerUtil.getOffhandContainerSlot(player);
    if(offHandContainerSlot === undefined) return onEndCallback(SpellAction.Cancelled);

    const spellBookObject = SpellBookUtil.getSpellBookObject(offHandContainerSlot);
    if(spellBookObject === undefined) return onEndCallback(SpellAction.Cancelled);

    const spellObject = spellBookObject.getSelectedSpell();

    SpellUtil.callSpellFunction(spellObject.spellFuncName, player);
    player.playSound("mob.evocation_illager.prepare_attack");

    SpellCharge.startChargeIndicator(player, spellObject);
    return;
}


/**
 * @param {Player} player 
 * @param {(cancelled: string) => void} onEndCallback 
 */
function onReleaseSpellCast(player, onEndCallback) {
    const playerObject = PlayerUtil.getPlayerObject(player);
    if (!playerObject.playerState.canCastSpells) return onEndCallback(SpellAction.Cancelled);

    const offHandContainerSlot = PlayerUtil.getOffhandContainerSlot(player);
    if (offHandContainerSlot === undefined) return onEndCallback(SpellAction.Cancelled);

    const container = PlayerUtil.getContainer(player);
    if (container === undefined) return onEndCallback(SpellAction.Cancelled);

    const spellBookObject = SpellBookUtil.getSpellBookObject(offHandContainerSlot);
    if (spellBookObject === undefined) return onEndCallback(SpellAction.Cancelled);

    const spellObject = spellBookObject.getSelectedSpell();
    const enhanced = SpellBookUtil.hasAnyEnhanceItems(player, spellObject);
    const maxChargeLevel = enhanced ? 4 : 3;
    const chargeTime = playerObject.returnSpellChargeTime();
    const chargeLevel = Math.min(maxChargeLevel, Math.floor(chargeTime / 16));

    if (chargeTime < 16) {
        playerObject.queueActionbarDisplay("§cCharge for at least 16 ticks!", 2);
        player.playSound("note.bass");
        return onEndCallback(SpellAction.NoOverride);
    }

    SpellUtil.castSpell(spellObject.spellFuncName, player, chargeLevel);
    return onEndCallback(SpellAction.Succeeded);
}


/**
 * Should be called after every scenario in which spell casting has ended
 * @param {Player} player 
 * @param {string} spellAction 
 */
function onEndSpellCast(player, spellAction) {
    const playerObject = PlayerUtil.getPlayerObject(player);
    if(playerObject.spellChargeRunId) system.clearRun(playerObject.spellChargeRunId);
    if(spellAction === SpellAction.Cancelled) {
        if(playerObject.playerState.canCastSpells) playerObject.queueActionbarDisplay("§cCancelled", 2);
    }
    else if(spellAction === SpellAction.Succeeded) {
        if(playerObject.playerState.canCastSpells) playerObject.queueActionbarDisplay("§r", 1);
    }
}
/**
 * Used specifically for itemStopUse 
 * @param {Player} player
 */
function onCancelSpellCast(player) {
    const playerObject = PlayerUtil.getPlayerObject(player);
    if(playerObject.spellChargeRunId) system.clearRun(playerObject.spellChargeRunId);
    if(playerObject.playerState.canCastSpells) playerObject.queueActionbarDisplay("§cCancelled", 0);
}



/**
 * @param {Player} player
 */
function noSpellBookWarning(player) {
    if(PlayerUtil.holdingStaffMainhand(player) && !PlayerUtil.holdingSpellBookOffhand(player)) {
        const playerObject = PlayerUtil.getPlayerObject(player);
        playerObject.queueActionbarDisplay("§cYou don't have a spell book!", 2);
        player.playSound("note.bass");
    }
}