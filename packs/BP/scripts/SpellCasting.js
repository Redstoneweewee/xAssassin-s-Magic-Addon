import { world, system, Player, EntityComponentTypes, ItemStack, EntityEquippableComponent, EquipmentSlot } from "@minecraft/server";
import { PlayerUtil, SpellBookUtil, SpellUtil } from "./Utilities.js";
import { SpellObjects } from "./Lists/SpellsList.js";
import { Spell } from "./Definitions/SpellDef.js";
//import { SpellBooksList } from "./Lists/SpellBooksList.js";


world.afterEvents.itemStartUse.subscribe(eventData => {
    onStartSpellCast(eventData.source);
});

world.afterEvents.itemStopUse.subscribe(eventData => {
    onReleaseSpellCast(eventData.source);
});

world.afterEvents.entityDie.subscribe(eventData => {
    const entity = eventData.deadEntity;
    if(!(entity instanceof Player)) { return; }
    onReleaseSpellCast(entity);
});

/**
 * 
 * @param {Player} player 
 */
function onStartSpellCast(player) {
    if(!PlayerUtil.canCastSpells(player)) { return; }
    const playerObject = PlayerUtil.getPlayerObject(player);
    playerObject.startCountingSpellChargeTime();
    const offHandContainerSlot = PlayerUtil.getOffhandContainerSlot(player);
    if(offHandContainerSlot === undefined) { return; }

    const spellBookObject = SpellBookUtil.getSpellBookObject(offHandContainerSlot);
    if(spellBookObject === undefined) { return; }
    const spellObject = spellBookObject.getSelectedSpell();

    SpellUtil.callSpellFunction(spellObject.spellFuncName, player);
    player.playSound("mob.evocation_illager.prepare_attack");
}


/**
 * @param {Player} player 
 */
function onReleaseSpellCast(player) {
    if(!PlayerUtil.canCastSpells(player)) { return; }
    const playerObject = PlayerUtil.getPlayerObject(player);
    const offHandContainerSlot = PlayerUtil.getOffhandContainerSlot(player);
    if(offHandContainerSlot === undefined) { return; }

    const container = PlayerUtil.getContainer(player);
    if(container === undefined) { return; }


    const startTick = playerObject.returnSpellChargeTime();

    const spellBookObject = SpellBookUtil.getSpellBookObject(offHandContainerSlot);
    if(spellBookObject === undefined) { return; }
    const spellObject = spellBookObject.getSelectedSpell();

    //if(spellObject === undefined) {
    //    player.sendMessage(`Spell "${spell}" is not yet implemented`);
    //    player.playSound("note.bass");
    //    return;
    //}

    const enhanced = hasAnyEnhanceItems(player, spellObject);

    const maxChargeLevel = enhanced ? 4 : 3;
    const chargeTime = system.currentTick - startTick;
    const chargeLevel = Math.min(maxChargeLevel, Math.floor(chargeTime / 16));
    player.onScreenDisplay.setActionBar("§r");
    if (chargeTime < 16) {
        player.onScreenDisplay.setActionBar("§cCharge for at least 16 ticks!");
        player.playSound("note.bass");
        return;
    }

    SpellUtil.castSpell(spellObject.spellFuncName, player, chargeLevel);
}

/**
 * 
 * @param {Player} player 
 * @param {Spell} spellObject 
 * @returns 
 */
function hasAnyEnhanceItems(player, spellObject) {
    for(const enhanceitemTypeId in spellObject.enhanceItems) {
        if(PlayerUtil.hasItemInInventory(player, enhanceitemTypeId)) {
            return true;
        }
    }
    return false;
}
