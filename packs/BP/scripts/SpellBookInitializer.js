import { Player, system, world } from "@minecraft/server";
import { PlayerUtil, SpellBookUtil } from "./Utilities";
import { SpellBookObjects, SpellBookTag } from "./Lists/SpellBooksList";

system.runInterval(() => {
    world.getAllPlayers().forEach(player => {
        initializeSpellBooks(player);
    });
}, 5)


/**
 * @param {Player} player
 */
function initializeSpellBooks(player) {
    const container = PlayerUtil.getContainer(player);
    if(container === undefined) { return; }
    
    for (let i = 0; i < container.size; i++) {
        const containerSlot = PlayerUtil.getContainerSlot(container, i);
        if(containerSlot === undefined) { continue; }
        if(containerSlot.getItem() === undefined) { continue; }
        if(!containerSlot.hasTag(SpellBookTag)) { continue; }
        //an initialized spellBook will always have the "spellBookInitialized" DP be true
        if(Boolean(containerSlot.getDynamicProperty("spellBookInitialized"))) { continue; }

        //At this point, initialize the spellbook
        const spellBookTag = containerSlot.typeId;
        const spellBookObject = SpellBookObjects.get(spellBookTag);
        if(spellBookObject === undefined) {
            console.warn(`spellBookObject does not contain spellbook ${spellBookTag}.`);
            continue;
        }
        const newContainerSlot = SpellBookUtil.setSpellBookObject(containerSlot, spellBookObject);
        newContainerSlot?.setDynamicProperty("spellBookInitialized", true);
        if(newContainerSlot === undefined) { continue; }
        container.setItem(i, newContainerSlot.getItem());
        console.log(`successfully initialized slot ${i} to spellBook ${spellBookObject.tag}`);
    }
}