import { world, Player, system } from "@minecraft/server";
import { PlayerUtil, SpellBookUtil, SpellUtil } from "../Utilities.js";
import { SpellObjects } from "../Lists/SpellsList.js";
import { Spell } from "../Definitions/SpellDef.js";
import * as SpellCharge from "./SpellCharge.js";
import { DisplayTypes } from "../Definitions/ScreenDisplayDef.js";
//import { SpellBooksList } from "./Lists/SpellBooksList.js";


/**
 * @typedef {object} SpellCastDisplayDef
 * @property {string} NoText 
 * @property {string} Succeeded
 * @property {string} Cancelled
 * @property {string} NoBook
 * @property {string} NoSpells
 */
/** @type {SpellCastDisplayDef} */
const SpellCastDisplayTexts = {
    NoText: "",
    Succeeded: "§r",
    Cancelled: "§cCancelled",
    NoBook: "§cYou don't have a spell book in your offhand!",
    NoSpells: "§cYour spell book has no spells!"
}

world.afterEvents.itemStartUse.subscribe(eventData => {
    noSpellBookWarning(eventData.source);
    onStartSpellCast(eventData.source, (SpellCastDisplayText) => onEndSpellCast(eventData.source, SpellCastDisplayText));
});

world.afterEvents.itemReleaseUse.subscribe(eventData => {
    onReleaseSpellCast(eventData.source, (SpellCastDisplayText) => onEndSpellCast(eventData.source, SpellCastDisplayText));
});
world.afterEvents.itemStopUse.subscribe(eventData => {
    onCancelSpellCast(eventData.source);
});

world.afterEvents.entityDie.subscribe(eventData => {
    const entity = eventData.deadEntity;
    if(!(entity instanceof Player)) { return; }
    onEndSpellCast(entity, SpellCastDisplayTexts.Cancelled);
});

/**
 * 
 * @param {Player} player 
 * @param {(cancelled: string) => void} onEndCallback 
 */
function onStartSpellCast(player, onEndCallback) {
    const playerObject = PlayerUtil.getPlayerObject(player);
    if(!playerObject.playerState.canCastSpells) return onEndCallback(SpellCastDisplayTexts.NoText);
    const offHandContainerSlot = PlayerUtil.getOffhandContainerSlot(player);
    if(offHandContainerSlot === undefined) return onEndCallback(SpellCastDisplayTexts.Cancelled);

    const spellBookObject = SpellBookUtil.getSpellBookObject(offHandContainerSlot);
    if(spellBookObject === undefined) return onEndCallback(SpellCastDisplayTexts.Cancelled);

    const spellObject = spellBookObject.getSelectedSpell();
    if(SpellUtil.isEmptySpell(spellObject)) {
        player.playSound("note.bass");
        return onEndCallback(SpellCastDisplayTexts.NoSpells);
    }
    //got past error checks

    playerObject.startSpellCast();
    SpellUtil.callSpellEnterFunction(spellObject.enterFuncName, player);
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
    if(!playerObject.startedSpellCast) { return SpellCastDisplayTexts.NoText; }
    if (!playerObject.playerState.canCastSpells) return onEndCallback(SpellCastDisplayTexts.Cancelled);

    const offHandContainerSlot = PlayerUtil.getOffhandContainerSlot(player);
    if (offHandContainerSlot === undefined) return onEndCallback(SpellCastDisplayTexts.Cancelled);

    const container = PlayerUtil.getContainer(player);
    if (container === undefined) return onEndCallback(SpellCastDisplayTexts.Cancelled);

    const spellBookObject = SpellBookUtil.getSpellBookObject(offHandContainerSlot);
    if (spellBookObject === undefined) return onEndCallback(SpellCastDisplayTexts.Cancelled);
    const spellObject = spellBookObject.getSelectedSpell();
    if(SpellUtil.isEmptySpell(spellObject)) return onEndCallback(SpellCastDisplayTexts.NoSpells);
    //got past error checks

    const enhanced = SpellBookUtil.hasAnyEnhanceItems(player, spellObject);
    const maxChargeLevel = enhanced ? 4 : 3;
    const chargeTime = playerObject.returnSpellChargeTime();
    const necessaryCharge = spellObject.charge;
    const chargeLevel = Math.min(maxChargeLevel, Math.floor(chargeTime / necessaryCharge));

    if (chargeTime < necessaryCharge) {
        playerObject.queueActionbarDisplay(`§cCharge for at least ${necessaryCharge} ticks!`, 2);
        player.playSound("note.bass");
        return onEndCallback(SpellCastDisplayTexts.NoText);
    }

    SpellUtil.callSpellExitFunction(spellObject.exitFuncName, player, chargeLevel);
    return onEndCallback(SpellCastDisplayTexts.Succeeded);
}


/**
 * Should be called after every scenario in which spell casting has ended
 * @param {Player} player 
 * @param {string} SpellCastDisplayText 
 */
function onEndSpellCast(player, SpellCastDisplayText) {
    const playerObject = PlayerUtil.getPlayerObject(player);
    if(!playerObject.startedSpellCast) { return; }
    if(playerObject.spellChargeRunId) system.clearRun(playerObject.spellChargeRunId);
    if(SpellCastDisplayText !== SpellCastDisplayTexts.NoText && playerObject.playerState.canCastSpells) {
        playerObject.queueActionbarDisplay(SpellCastDisplayText, 1);
    }
    playerObject.endSpellCast();
}
/**
 * Used specifically for itemStopUse 
 * @param {Player} player
 */
function onCancelSpellCast(player) {
    const playerObject = PlayerUtil.getPlayerObject(player);
    if(!playerObject.startedSpellCast) { return; }
    if(playerObject.spellChargeRunId) system.clearRun(playerObject.spellChargeRunId);
    playerObject.queueActionbarDisplay("§cCancelled", 0);
    playerObject.endSpellCast();
}



/**
 * @param {Player} player
 */
function noSpellBookWarning(player) {
    if(PlayerUtil.holdingStaffMainhand(player) && !PlayerUtil.holdingSpellBookOffhand(player)) {
        const playerObject = PlayerUtil.getPlayerObject(player);
        playerObject.queueActionbarDisplay(SpellCastDisplayTexts.NoBook, 1);
        player.playSound("note.bass");
    }
}