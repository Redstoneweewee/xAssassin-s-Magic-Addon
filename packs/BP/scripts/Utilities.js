import { Container, ContainerSlot, EntityComponentTypes, EntityInventoryComponent, ItemStack, Player } from "@minecraft/server";
import { SpellBook } from "./Definitions/SpellBookDef";
import { SpellBookTag } from "./Lists/SpellBooksList";



class PlayerUtil {
    /**
     * 
     * @param {Player} player 
     * @returns {Container|undefined}
     */
    static getContainer(player) {
        const invComp = player.getComponent(EntityComponentTypes.Inventory);
        if(invComp === undefined || !(invComp instanceof EntityInventoryComponent)) { return; }
        const inventory = invComp.container;
        return inventory;
    }

    /**
     * 
     * @param {Container} container 
     * @param {number} slotIndex 
     * @returns {ItemStack|undefined}
     */
    static getItemStack(container, slotIndex) {
        return container.getItem(slotIndex);
    }

    /**
     * 
     * @param {Container} container 
     * @param {number} slotIndex 
     * @returns {ContainerSlot|undefined}
     */
    static getContainerSlot(container, slotIndex) {
        return container.getSlot(slotIndex)??undefined;
    }

    /**
     * @param {Player} player 
     * @returns {ItemStack|undefined}
     */
    static getSelectedItemStack(player) {
        const inv = player.getComponent(EntityComponentTypes.Inventory);
        if(inv === undefined) { return undefined; }
        if(!(inv instanceof EntityInventoryComponent)) { return undefined; }
        const container = inv.container;
        if(container === undefined) { return undefined; }
        return PlayerUtil.getItemStack(container, player.selectedSlotIndex);
    }
    
    /**
     * Only use ContainerSlot when needing to .getItem() or .setItem(). Do not alter directly.
     * @param {Player} player 
     * @returns {ContainerSlot|undefined}
     */
    static getSelectedContainerSlot(player) {
        const inv = player.getComponent(EntityComponentTypes.Inventory);
        if(inv === undefined) { return undefined; }
        if(!(inv instanceof EntityInventoryComponent)) { return undefined; }
        const container = inv.container;
        if(container === undefined) { return undefined; }
        return PlayerUtil.getContainerSlot(container, player.selectedSlotIndex);
    }

}


class SpellUtil {
    
    static getSpawnY(dimension, x, z, baseY, isRing = false) {
        let y = isRing ? baseY + 2 : baseY
        let block = dimension.getBlock({ x: Math.floor(x), y, z: Math.floor(z) })
        const passableBlocks = ["minecraft:fire", "minecraft:soul_fire", "minecraft:water", "minecraft:lava"]
        while (y > -64) {
            if (!block || block.isAir || passableBlocks.includes(block.typeId)) {
                y--
                block = dimension.getBlock({ x: Math.floor(x), y, z: Math.floor(z) })
            } else {
                break
            }
        }
        let spawnY = null
        if (block && !block.isAir) {
            if (passableBlocks.includes(block.typeId)) {
                spawnY = y
            } else {
                spawnY = y + 1
            }
        }
        if (!spawnY || (isRing && spawnY > baseY + 3)) {
            y = isRing ? baseY + 2 : baseY
            block = dimension.getBlock({ x: Math.floor(x), y, z: Math.floor(z) })
            while (y <= (isRing ? baseY + 6 : baseY + 4)) {
                if (!block || block.isAir || passableBlocks.includes(block.typeId)) {
                    if (block && passableBlocks.includes(block.typeId)) {
                        spawnY = y
                        break
                    }
                    y++
                    block = dimension.getBlock({ x: Math.floor(x), y, z: Math.floor(z) })
                } else {
                    spawnY = y
                    break
                }
            }
        }
        return spawnY
    }
}

class SpellBookUtil {
    /**
     * @param {ContainerSlot} containerSlot - we must use containerSlot if we want to use dynamicProperties. It behaves the same as ItemStacks.
     * @returns {SpellBook|undefined}
     */
    static getSpellBookObject(containerSlot) {
        const string = String(containerSlot.getDynamicProperty("spellBookObject"));
        if(string === "") { return undefined; }
        try { 
            /** @type {SpellBook} */
            console.log(`SpellBook: ${string}`);
            const object = JSON.parse(string);
            console.assert(object instanceof SpellBook);
            return object;
        }
        catch { 
            console.error(`unable to parse ${containerSlot.typeId} into a SpellBookObject.`);
            return undefined;
        }
    }


    
    /**
     * WARNING: after this function only alters the containerSlot, not the entity container (it doesn't actually replace the item). Yu must also do `container.setItem(i, newContainerSlot.getItem());` manually.
     * @param {ContainerSlot} containerSlot - we must use containerSlot if we want to use dynamicProperties. It behaves the same as ItemStacks.
     * @param {SpellBook} spellBookObject
     * @returns {ContainerSlot|undefined}
     */
    static setSpellBookObject(containerSlot, spellBookObject) {
        if(!containerSlot.hasTag(SpellBookTag)) {
            console.warn(`Item ${containerSlot.typeId} is not a spellbook, but we are trying to set a SpellBookObject on it.`);
            return undefined;
        }
        const string = JSON.stringify(spellBookObject);
        if(string.length > 32767) {
            console.error(`spellBookObject stringified is too long and exceeds 32767 chars.`);
            return undefined;
        }
        containerSlot.setDynamicProperty("spellBookObject", string);
        return containerSlot;
    }
}

export { PlayerUtil, SpellUtil, SpellBookUtil };