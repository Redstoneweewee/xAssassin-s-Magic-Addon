import { Container, ContainerSlot, EntityComponentTypes, EntityEquippableComponent, EntityInventoryComponent, EquipmentSlot, ItemStack, Player, PlayerCursorInventoryComponent } from "@minecraft/server";
import { SpellBook } from "./Definitions/SpellBookDef";
import { SpellBookTag } from "./Lists/SpellBooksList";
import { SpellFunctionsMap } from "./Lists/SpellsList";
import { PlayerObject } from "./Definitions/PlayerDef";
import { PlayerObjectsMap } from "./Player";
import { Spell } from "./Definitions/SpellDef";



class PlayerUtil {
    /**
     * @param {Player} player 
     * @returns {PlayerObject}
     */
    static getPlayerObject(player) {
        const playerObject = PlayerObjectsMap.get(player.id);
        if(playerObject !== undefined) { return playerObject; }
        //else...
        console.error(`player ${player.name} does not have a PlayerObject! Creating a new PlayerObject.`);
        const newPlayerObject = new PlayerObject(player.id);
        PlayerObjectsMap.set(player.id, newPlayerObject);
        return newPlayerObject;
    }
    
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

    /**
     * Only use ContainerSlot when needing to .getItem() or .setItem(). Do not alter directly.
     * @param {Player} player 
     * @returns {ContainerSlot|undefined}
     */
    static getOffhandContainerSlot(player) {
        const equippable = player.getComponent(EntityComponentTypes.Equippable);
        if(equippable === undefined) { return undefined; }
        if(!(equippable instanceof EntityEquippableComponent)) { return undefined; }
        const offhand = equippable.getEquipmentSlot(EquipmentSlot.Offhand);
        return offhand??undefined;
    }
    
    /**
     * @param {Player} player 
     * @returns {ItemStack|undefined}
     */
    static getOffhandItemStack(player) {
        return PlayerUtil.getOffhandContainerSlot(player)?.getItem();
    }

    /**
     * 
     * @param {Player} player 
     * @param {string} itemTypeId 
     * @returns {boolean}
     */
    static hasItemInInventory(player, itemTypeId) {
        const inv = player.getComponent(EntityComponentTypes.Inventory);
        if(inv === undefined) { return false; }
        if(!(inv instanceof EntityInventoryComponent)) { return false; }
        const container = inv.container;
        if(container === undefined) { return false; }
        for(let i=0; i<container.size; i++) {
            if(container.getSlot(i).getItem() && container.getSlot(i).typeId === itemTypeId) {
                return true;
            }
        }
        return false;
    }

    /**
     * 
     * @param {Player} player 
     * @returns {boolean}
     */
    static canCastSpells(player) {
        const mainhandItemStack = PlayerUtil.getSelectedItemStack(player);
        if(mainhandItemStack === undefined) { return false; }
        if(!mainhandItemStack.getTags().includes("xassassin:magic_staff")) { return false; }
        const offHandItemStack = PlayerUtil.getOffhandItemStack(player);
        if(offHandItemStack === undefined) { return false; }
        if(!offHandItemStack.getTags().includes("xassassin:spellbook")) { return false; }
        const playerObject = PlayerUtil.getPlayerObject(player);
        if(!playerObject.playerState.canCastSpells) { return false; }
        return true;
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

    /**
     * 
     * @param {string} functionName 
     * @param {Player} player 
     * @param {number} chargeLevel 
     */
    static castSpell(functionName, player, chargeLevel) {
        const spellFunction = SpellFunctionsMap.get(functionName);
        if(spellFunction === undefined) {
            console.warn(`spell function ${functionName} could not be found in SpellFunctionsMap.`);
            return;
        }
        spellFunction(player, chargeLevel);
        player.playSound("mob.evocation_illager.cast_spell");
    }

    /**
     * @param {string} functionName 
     * @param {Player} player 
     * @param {number} [chargeLevel] 
     */
    static callSpellFunction(functionName, player, chargeLevel = 0) {
        const spellFunction = SpellFunctionsMap.get(functionName);
        if(spellFunction === undefined) {
            console.warn(`spell function ${functionName} could not be found in SpellFunctionsMap.`);
            return;
        }
        spellFunction(player, chargeLevel);
    }
}

class SpellBookUtil {
    /**
     * @param {ContainerSlot} spellBookContainerSlot - we must use containerSlot if we want to use dynamicProperties. It behaves the same as ItemStacks.
     * @returns {SpellBook|undefined}
     */
    static getSpellBookObject(spellBookContainerSlot) {
        const raw = String(spellBookContainerSlot.getDynamicProperty("spellBookObject"));
        if(raw === "") { return undefined; }
        try { 
            const object = JSONUtil.reconstructSpellBook(raw);
            return object;
        }
        catch { 
            console.error(`unable to parse ${spellBookContainerSlot.typeId} into a SpellBookObject.`);
            return undefined;
        }
    }


    
    /**
     * This function automatically sets the player's container slot to the spellbook with the dynamic property appended.
     * Also returns the new containerSlot if needed.
     * @param {ContainerSlot} spellBookContainerSlot - we must use containerSlot if we want to use dynamicProperties. It behaves the same as ItemStacks.
     * @param {SpellBook} spellBookObject
     * @returns {ContainerSlot|undefined}
     */
    static setSpellBookObject(spellBookContainerSlot, spellBookObject) {
        if(!spellBookContainerSlot.hasTag(SpellBookTag)) {
            console.warn(`Item ${spellBookContainerSlot.typeId} is not a spellbook, but we are trying to set a SpellBookObject on it.`);
            return;
        }
        const string = JSON.stringify(spellBookObject);
        if(string.length > 32767) {
            console.error(`spellBookObject stringified is too long and exceeds 32767 chars.`);
            return;
        }
        spellBookContainerSlot.setDynamicProperty("spellBookObject", string);
    }

    /**
     * 
     * @param {ContainerSlot} spellBookContainerSlot
     * @returns {ContainerSlot|undefined}
     */
    static updateSpellBookLore(spellBookContainerSlot) {
        const spellBookObject = SpellBookUtil.getSpellBookObject(spellBookContainerSlot);
        if(spellBookObject === undefined) { return undefined; }
        let loreArray = ["§aSpell Slots:"];
        for(const spell of spellBookObject.getSpellsArray()) {
            const spellName = StringUtil.convertTagToName(spell.tag);
            loreArray = [...loreArray, "§f"+spellName];
        }
        spellBookContainerSlot.setLore(loreArray);
        return spellBookContainerSlot;
    }

    
    /**
     * 
     * @param {Player} player 
     * @param {Spell} spellObject 
     * @returns 
     */
    static hasAnyEnhanceItems(player, spellObject) {
        for(const enhanceitemTypeId in spellObject.enhanceItems) {
            if(PlayerUtil.hasItemInInventory(player, enhanceitemTypeId)) {
                return true;
            }
        }
        return false;
    }
}

class StringUtil {
    /**
     * Example: `windDash` --> `Wind Dash`
     * @param {string} tag 
     * @returns {string} the tag separated by spaces and capitalized.
     */
    static convertTagToName(tag) {
        // Insert a space before each capital letter (except the first one), then capitalize the first letter
        const withSpaces = tag.replace(/([a-z])([A-Z])/g, '$1 $2');
        return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
    }
}

class JSONUtil {
    
    /**
     * Reconstructs a SpellBook from plain JSON.
     * @param {string} jsonString 
     * @returns {SpellBook}
     */
    static reconstructSpellBook(jsonString) {
        /** @type {import("./Definitions/SpellBookDef").SpellBookJSONDef} */
        const raw = JSON.parse(jsonString);

        const spellBook = new SpellBook({
                                tag: raw.tag,
                                tier: raw.tier,
                                inherentSpells: raw.inherentSpells
                              }, 
                              raw.spells, 
                              raw.selectedSlot);
        return spellBook;
    }
}
export { PlayerUtil, SpellUtil, SpellBookUtil, StringUtil };