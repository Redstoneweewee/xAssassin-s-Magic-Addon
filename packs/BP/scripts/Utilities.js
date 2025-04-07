import { Container, EntityComponentTypes, EntityInventoryComponent, Player } from "@minecraft/server";



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

export { PlayerUtil, SpellUtil };