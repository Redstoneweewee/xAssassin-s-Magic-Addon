import { world, Player, system } from "@minecraft/server";
import { PlayerUtil, SpellBookUtil, StringUtil } from "../Utilities";
import { emptySpell } from "../Lists/SpellsList";


world.afterEvents.itemUse.subscribe(eventData => {
    tryDisplaySpellBookStats(eventData.source);
    tryChangeSpellBookSpell(eventData.source);
    tryAddSpellFromSpellScroll(eventData.source);
});

/**
 * @param {Player} player 
 */
function tryDisplaySpellBookStats(player) {
    if(!PlayerUtil.holdingSpellBookMainhand(player)) { return; }
    const playerObject = PlayerUtil.getPlayerObject(player);
    const spellBookContainerSlot = PlayerUtil.getMainhandContainerSlot(player);
    if(spellBookContainerSlot === undefined) { return; }
    const spellBookObject = SpellBookUtil.getSpellBookObject(spellBookContainerSlot);
    if(spellBookObject === undefined) { return; }
    let display = "§aSpells:§r\n";
    let num = 0;
    for(const spell of spellBookObject.getSpellsArray()) {
        if(spell.tag !== emptySpell.tag) {
            display += StringUtil.convertTagToName(spell.tag) + "\n";
            num++;
        }
    }
    if(num === 0) {
        display += "None\n"
    }
    display += `§r${num}/${spellBookObject.tier} slots used.`;
    playerObject.queueActionbarDisplay(display, 0);
    player.playSound("pickup_enchanted.chiseled_bookshelf");
}

/**
 * @param {Player} player 
 */
function tryChangeSpellBookSpell(player) {
    const playerObject = PlayerUtil.getPlayerObject(player);
    if(!playerObject.playerState.canChangeSpells) { return; }
    const spellBookContainerSlot = PlayerUtil.getOffhandContainerSlot(player);
    if(spellBookContainerSlot === undefined) { return; }
    const spellBookObject = SpellBookUtil.getSpellBookObject(spellBookContainerSlot);
    if(spellBookObject === undefined) { return; }

    spellBookObject.incrementSelectedSlot();
    SpellBookUtil.setSpellBookObject(spellBookContainerSlot, spellBookObject);

    const previousSpellName = StringUtil.convertTagToName(spellBookObject.getPreviousSpell().tag);
    const selectedSpellName = StringUtil.convertTagToName(spellBookObject.getSelectedSpell().tag);
    const nextSpellName     = StringUtil.convertTagToName(spellBookObject.getNextSpell().tag);
    const emptyName         = StringUtil.convertTagToName(emptySpell.tag);

    let display = "";
    if(selectedSpellName !== emptyName) {
        if(previousSpellName !== emptyName && previousSpellName != selectedSpellName) display += "§7" + previousSpellName + "\n";
        display += `§f>> §e${selectedSpellName}§r §f<<\n`;
        if(previousSpellName !== nextSpellName) display += "§7" + nextSpellName + "\n";
    }
    else {
        display = "No spells available"
    }
    playerObject.queueActionbarDisplay(display, 0);
    player.playSound("pickup_enchanted.chiseled_bookshelf"); 
}


/**
 * @param {Player} player 
 */
function tryAddSpellFromSpellScroll(player) {
    if(!PlayerUtil.holdingSpellBookMainhand(player) || !PlayerUtil.holdingSpellBookOffhand(player)) { return; }
    const playerObject = PlayerUtil.getPlayerObject(player);
}
