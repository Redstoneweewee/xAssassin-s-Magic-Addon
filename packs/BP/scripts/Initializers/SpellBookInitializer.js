import { ContainerSlot, Player, system, world } from "@minecraft/server";
import { InitializationUtil, PlayerUtil, SpellBookUtil } from "../Utilities";
import { SpellBookObjects, SpellBookTag } from "../Lists/SpellBooksList";

/**
 * Initialization is looped every second (which is quite slow, but it doesn't need to be any faster)
 */
system.runInterval(() => {
    world.getAllPlayers().forEach(player => {
        initializeSpellBooks(player);
    });
}, 20)


/**
 * @param {Player} player
 */
function initializeSpellBooks(player) {
    const container = PlayerUtil.getContainer(player);
    if(container === undefined) { return; }
    
    const offHandContainerSlot = PlayerUtil.getOffhandContainerSlot(player);
    if(offHandContainerSlot) {
        checkContainerSlot(offHandContainerSlot, "offhand");
    }
    for (let i = 0; i < container.size; i++) {
        let containerSlot = PlayerUtil.getContainerSlot(container, i);
        if(containerSlot === undefined) { continue; }
        checkContainerSlot(containerSlot, String(i));
    }
}

/**
 * 
 * @param {ContainerSlot} containerSlot 
 * @param {string} slotName - for testing purposes only
 * @returns 
 */
function checkContainerSlot(containerSlot, slotName) {
    if(containerSlot === undefined) { return; }
    if(containerSlot.getItem() === undefined) { return; }
    if(!containerSlot.hasTag(SpellBookTag)) { return; }
    //an initialized spellBook will always have a spellBookItemId
    if(!Number.isNaN(Number(containerSlot.getDynamicProperty("spellBookItemId")))) { return; }

    //At this point, initialize the spell_book
    const spellBookTag = containerSlot.typeId;
    const spellBookObject = SpellBookObjects.get(spellBookTag);
    if(spellBookObject === undefined) {
        console.warn(`spellBookObject does not contain spell_book ${spellBookTag}.`);
        return;
    }
    SpellBookUtil.setSpellBookObject(containerSlot, spellBookObject);
    SpellBookUtil.updateSpellBookLore(containerSlot);
    const id = InitializationUtil.getNextUniqueSpellBookId();
    containerSlot.setDynamicProperty("spellBookItemId", id);
    console.log(`successfully initialized slot ${slotName} to spellBook ${spellBookObject.tag}, Id: ${id}`);
}