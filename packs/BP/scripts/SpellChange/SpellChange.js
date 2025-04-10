import { world, Player, system, ContainerSlot } from "@minecraft/server";
import { ModalFormData, ActionFormData } from "@minecraft/server-ui";
import { FormUtil, PlayerUtil, SpellBookUtil, SpellUtil, StringUtil } from "../Utilities";
import { emptySpell, SpellObjects } from "../Lists/SpellsList";
import { SpellScrollObjects } from "../Lists/SpellScrollsList";
import { SpellBook } from "../Definitions/SpellBookDef";
import { Spell } from "../Definitions/SpellDef";


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
        if(!SpellUtil.isEmptySpell(spell)) {
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
    if(!PlayerUtil.holdingSpellScrollMainhand(player) || !PlayerUtil.holdingSpellBookOffhand(player)) { return; }
    const playerObject = PlayerUtil.getPlayerObject(player);
    const spellScrollItemStack = PlayerUtil.getMainhandItemStack(player);
    const spellBookContainerSlot = PlayerUtil.getOffhandContainerSlot(player);
    if(spellScrollItemStack   === undefined) { return; }
    if(spellBookContainerSlot === undefined) { return; }
    const spellScrollObject = SpellScrollObjects.get(spellScrollItemStack.typeId);
    const spellBookObject   = SpellBookUtil.getSpellBookObject(spellBookContainerSlot);
    if(spellScrollObject === undefined) { return; }
    if(spellBookObject   === undefined) { return; }
    
    const addSpellObject = SpellObjects.get(spellScrollObject.spellTag);
    if(addSpellObject === undefined) { return; }

    const spellBookSpells = spellBookObject.getSpellsArray();
    for(const spell of spellBookSpells) {
        if(spell.tag === addSpellObject.tag) { 
            //already have this spell on the spellbook
            playerObject.queueActionbarDisplay("§cCant have two identical spells on one spell book", 0);
            player.playSound("note.bass");
            return;
        }
    }

    showAddSpellForm(player, spellBookContainerSlot, spellBookObject, spellBookSpells, addSpellObject);

}

/**
 * 
 * @param {Player} player 
 * @param {ContainerSlot} spellBookContainerSlot 
 * @param {SpellBook} spellBookObject 
 * @param {Spell[]} spellBookSpells 
 * @param {Spell} addSpellObject 
 */
function showAddSpellForm(player, spellBookContainerSlot, spellBookObject, spellBookSpells, addSpellObject) {
    const addSpellName = StringUtil.convertTagToName(addSpellObject.tag);
    const addSpellForm = new ModalFormData();
    addSpellForm.title("Select Spell Slot");

    /** @type {string[]} */
    const slotNames = [];
    for(let i=0; i<spellBookSpells.length; i++) {
        slotNames.push(`Slot ${i+1}: ${StringUtil.convertTagToName(spellBookSpells[i].tag)}`);
    }
    addSpellForm.dropdown("Choose a slot to override:", slotNames);

    addSpellForm.show(player).then(response => {
        if(response.canceled) { return; }
        if(response.formValues === undefined) { return; }
        const overrideSlot = Number(response.formValues[0]);

        //If slot is empty, apply spell
        if(SpellUtil.isEmptySpell(spellBookSpells[overrideSlot])) {
            applySpell(player, spellBookContainerSlot, spellBookObject, addSpellObject, addSpellName, overrideSlot);
        }
        //If slot is not empty, ask for confirmation
        else {
            const message = `Are you sure you want to overwrite §b${StringUtil.convertTagToName(spellBookSpells[overrideSlot].tag)}§r with §b${addSpellName}§r?`;
            const response = FormUtil.showConfirmationForm(player, "Confirm Override", message);
            response.then(success => {
                if(success) { 
                    applySpell(player, spellBookContainerSlot, spellBookObject, addSpellObject, addSpellName, overrideSlot);
                }
            });
        }
    });
}

/**
 * 
 * @param {Player} player 
 * @param {ContainerSlot} spellBookContainerSlot 
 * @param {SpellBook} spellBookObject 
 * @param {Spell} addSpellObject 
 * @param {number} overrideSlot 
 */
function applySpell(player, spellBookContainerSlot, spellBookObject, addSpellObject, addSpellName, overrideSlot) {
    spellBookObject.setSpell(overrideSlot, addSpellObject);
    SpellBookUtil.setSpellBookObject(spellBookContainerSlot, spellBookObject);
    SpellBookUtil.updateSpellBookLore(spellBookContainerSlot);
    if(!PlayerUtil.isCreative(player)) { PlayerUtil.setMainhandItem(player, undefined); }
    player.sendMessage(`Added §b${addSpellName}§r to slot ${overrideSlot + 1}`);
    player.playSound("use.chiseled_bookshelf");
}