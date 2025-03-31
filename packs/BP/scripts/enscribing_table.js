import * as SERVER from '@minecraft/server';
import * as GUI from '@minecraft/server-ui';

const ENSCRIBING_TABLE_TYPE = 'xassassin:enscribing_table';

function getLocationAbove(blockLocation) {
    return {
        x: blockLocation.x + 0.5,
        y: blockLocation.y + 1,
        z: blockLocation.z + 0.5,
    };
}

function spawnItemAt(block, item, amount = 1) {
    const locationAbove = getLocationAbove(block.location);
    const itemToSpawn = item instanceof SERVER.ItemStack 
        ? item 
        : new SERVER.ItemStack(item, amount);
    block.dimension.spawnItem(itemToSpawn, locationAbove);
}

function playBlockSound(block, soundId) {
    block.dimension.playSound(soundId, block.location);
}

function updateBlockState(block, stateKey, stateValue) {
    const blockState = block.permutation.getAllStates();
    blockState[stateKey] = stateValue;
    block.setPermutation(SERVER.BlockPermutation.resolve(block.typeId, blockState));
}

function getEnchantsFromItem(item) {
    const enchantable = item.getComponent("minecraft:enchantable");
    if (!enchantable) return [];
    const enchantments = enchantable.getEnchantments();
    if (enchantments.length === 0) return [];
    return enchantments.map((enchant) => ({
        type: enchant.type.id.replace("minecraft:", ""),
        level: enchant.level,
        maxLevel: enchant.type.maxLevel,
    }));
}

function removeInkAndQuill(player) {
    const equippable = player.getComponent("minecraft:equippable");
    const offhandItem = equippable.getEquipment(EquipmentSlot.Offhand);
    if (offhandItem?.typeId === 'xassassin:ink_and_quill') {
        if (offhandItem.amount > 1) {
            offhandItem.amount -= 1;
            equippable.setEquipment(EquipmentSlot.Offhand, offhandItem);
        } else {
            equippable.setEquipment(EquipmentSlot.Offhand, undefined);
        }
    }
}

function removeResonanceInkAndQuill(player) {
    const equippable = player.getComponent("minecraft:equippable");
    const offhandItem = equippable.getEquipment(EquipmentSlot.Offhand);
    if (offhandItem?.typeId === 'xassassin:resonance_ink_and_quill') {
        if (offhandItem.amount > 1) {
            offhandItem.amount -= 1;
            equippable.setEquipment(EquipmentSlot.Offhand, offhandItem);
        } else {
            equippable.setEquipment(EquipmentSlot.Offhand, undefined);
        }
    }
}

function openCustomEnchantGui(player, item, block) {
    const equippable = player.getComponent("minecraft:equippable");
    const offhandItem = equippable.getEquipment(EquipmentSlot.Offhand);
    if (offhandItem?.typeId !== 'xassassin:resonance_ink_and_quill') {
        playBlockSound(block, "pickup_enchanted.chiseled_bookshelf");
        player.onScreenDisplay.setActionBar("§fYou need Resonance Ink & Quill to copy this.");
        return;
    }
    let rawName = item.typeId.replace('book:', '');
    playBlockSound(block, 'item.book.page_turn');
    const levelMatch = rawName.match(/_(i{1,3}|iv|v)$/);
    let level = 1; 
    let levelDisplay = "I"; 
    if (levelMatch) {
        const levelStr = levelMatch[0].replace('_', '').toLowerCase();
        const romanToNumber = { i: 1, ii: 2, iii: 3, iv: 4, v: 5 };
        level = romanToNumber[levelStr] || 1;
        levelDisplay = levelStr.toUpperCase();
        rawName = rawName.replace(/_(i{1,3}|iv|v)$/, ''); 
    }
    const formattedName = rawName
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    const guiText = `§8It will cost §l§2${level} XP Levels§r§8 to copy this enchanted book.\n§8--------------------\n`
                  + `§5■ §l§d${formattedName} ${levelDisplay}§r\n§8--------------------`;
    block.dimension.playSound("insert_enchanted.chiseled_bookshelf", block.location);
    const form = new GUI.ActionFormData()
        .title("copy_book_ui")
        .body(guiText)
        .button("§5§lCopy Enchanted Book")
        .button("§4§lCancel");
    form.show(player).then(response => {
        if (response.selection === 0) {
            const gameMode = player.getGameMode();
            if (gameMode === SERVER.GameMode.creative || player.level >= level) {
                if (gameMode !== SERVER.GameMode.creative) {
                    player.addLevels(-level);
                }
                const clonedItem = item.clone();
                spawnItemAt(block, clonedItem);
                removeResonanceInkAndQuill(player);
                updateBlockState(block, 'xassassin:withBook', false);
                playBlockSound(block, "block.enchanting_table.use");
                playBlockSound(block, 'ui.cartography_table.take_result');
            } else {
                playBlockSound(block, "pickup_enchanted.chiseled_bookshelf");
            }
        }
    });
}

function openEnchantCopyGui(player, item, block) {
    const equippable = player.getComponent("minecraft:equippable");
    const offhandItem = equippable.getEquipment(EquipmentSlot.Offhand);
    if (offhandItem?.typeId !== 'xassassin:resonance_ink_and_quill') {
        playBlockSound(block, "pickup_enchanted.chiseled_bookshelf");
        player.onScreenDisplay.setActionBar("§fYou need Resonance Ink & Quill to copy this.");
        return;
    }
    function toRoman(num) {
        if (num < 1 || num > 10) {
            return ''; 
        }
        const romanNumerals = [
            "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"
        ];
        return romanNumerals[num - 1]; 
    }
    playBlockSound(block, 'item.book.page_turn');
    const enchants = getEnchantsFromItem(item);
    let totalLevels = enchants.reduce((sum, enchant) => sum + enchant.level, 0);
    const hasMending = enchants.some((enchant) => enchant.type === "mending");
    if (hasMending) {
        totalLevels += 4;
    }
    let enchantmentDetails = `§8It will cost §l§2${totalLevels} XP Levels§r§8 to copy this enchanted book.\n§8--------------------\n`;
    enchantmentDetails += enchants.length > 0
        ? enchants
              .map((enchant) => {
                  const formattedType = enchant.type
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (char) => char.toUpperCase());
                  return ` §5■ §l§d${formattedType} ${toRoman(enchant.level)}§r\n§8--------------------`;
              })
              .join("\n")
        : "§4This item has no enchantments.";
    block.dimension.playSound("insert_enchanted.chiseled_bookshelf", block.location);
    const form = new GUI.ActionFormData()
        .title("copy_book_ui")
        .body(enchantmentDetails)
        .button("§5§lCopy Enchanted Book")
        .button("§4§lCancel");
    form.show(player).then((response) => {
        if (response.selection === 0) {
            const gameMode = player.getGameMode(); 
            if (gameMode === SERVER.GameMode.creative || player.level >= totalLevels) {
                if (gameMode !== SERVER.GameMode.creative) {
                    player.addLevels(-totalLevels);
                }
                const clonedItem = item.clone();
                spawnItemAt(block, clonedItem);
                removeResonanceInkAndQuill(player);
                updateBlockState(block, 'xassassin:withBook', false);
                playBlockSound(block, "block.enchanting_table.use");
                playBlockSound(block, 'ui.cartography_table.take_result');
            } else {
                playBlockSound(block, "pickup_enchanted.chiseled_bookshelf");
            }
        }
    });
}

function handleBookInsertion(block, player, bookType) {
    updateBlockState(block, 'xassassin:withBook', true);
    const inventory = player.getComponent("minecraft:inventory").container;
    const mainHandSlotIndex = player.selectedSlotIndex;
    const mainHandItem = inventory.getItem(mainHandSlotIndex);
    if (mainHandItem?.typeId === bookType && mainHandItem.amount > 0) {
        if (mainHandItem.amount > 1) {
            mainHandItem.amount -= 1;
            inventory.setItem(mainHandSlotIndex, mainHandItem);
        } else {
            inventory.setItem(mainHandSlotIndex, null);
        }
    }
    playBlockSound(block, 'block.itemframe.add_item');
}

import { EquipmentSlot } from '@minecraft/server';

function handleBookRemoval(block, player) {
    const equippable = player.getComponent("minecraft:equippable");
    const mainHandItem = equippable.getEquipment(EquipmentSlot.Mainhand);
    const offhandItem = equippable.getEquipment(EquipmentSlot.Offhand);
    if (mainHandItem?.typeId === 'minecraft:written_book' || mainHandItem?.typeId === 'minecraft:writable_book') {
        if (offhandItem?.typeId !== 'xassassin:ink_and_quill') {
            playBlockSound(block, "pickup.chiseled_bookshelf");
            player.onScreenDisplay.setActionBar("§fYou need an Ink & Quill to copy this.");
            return;
        }
        const clonedItem = mainHandItem.clone();
        clonedItem.amount = 1;
        spawnItemAt(block, clonedItem);
        if (offhandItem.amount > 1) {
            offhandItem.amount -= 1;
            equippable.setEquipment(EquipmentSlot.Offhand, offhandItem);
        } else {
            equippable.setEquipment(EquipmentSlot.Offhand, undefined);
        }
        if (Math.random() <= 0.2) {
            const xpAmount = Math.floor(Math.random() * 3) + 2;
            const locationAbove = getLocationAbove(block.location);
            for (let i = 0; i < xpAmount; i++) {
                block.dimension.spawnEntity("minecraft:xp_orb", locationAbove);
            }
        }
        playBlockSound(block, 'ui.cartography_table.take_result');
    } else {
        spawnItemAt(block, 'minecraft:book');
    }
    updateBlockState(block, 'xassassin:withBook', false);
    playBlockSound(block, 'block.itemframe.remove_item');
}

SERVER.world.beforeEvents.playerInteractWithBlock.subscribe((eventData) => {
    const { block, itemStack, player } = eventData;
    if (player.isSneaking) {
        return;
    }
    if (block.typeId === ENSCRIBING_TABLE_TYPE) {
        const blockState = block.permutation.getAllStates();
        if (blockState['xassassin:withBook']) {
            if (itemStack?.typeId === 'minecraft:enchanted_book') {
                SERVER.system.run(() => openEnchantCopyGui(player, itemStack, block));
            } else if (itemStack?.typeId.startsWith('book:')) {
                SERVER.system.run(() => openCustomEnchantGui(player, itemStack, block));
            } else {
                SERVER.system.run(() => handleBookRemoval(block, player));
            }
        } else if (itemStack?.typeId === 'minecraft:book') {
            SERVER.system.run(() => handleBookInsertion(block, player, 'minecraft:book'));
        }
    }
});

SERVER.world.afterEvents.entityHitBlock.subscribe((eventData) => {
    const block = eventData.hitBlock;
    if (block.typeId === ENSCRIBING_TABLE_TYPE) {
        SERVER.system.run(() => {
            const blockState = block.permutation.getAllStates();
            if (blockState['xassassin:withBook']) {
                updateBlockState(block, 'xassassin:withBook', false);
                spawnItemAt(block, 'minecraft:book');
                playBlockSound(block, 'block.itemframe.remove_item');
            }
        });
    }
});
