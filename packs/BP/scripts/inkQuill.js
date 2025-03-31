import { world, ItemStack, EntityComponentTypes, EquipmentSlot } from "@minecraft/server";
import { ModalFormData, ActionFormData } from "@minecraft/server-ui";

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

function openRenameNameTagGui(player, mainHandItem, offHandItem, mainHandSlotIndex, equipmentCompPlayer) {
    const form = new ModalFormData()
        .title("§6Rename Name Tag")
        .textField("§7Enter new name:", "§eName here...");

    form.show(player).then((response) => {  
        if (!response.canceled && response.formValues[0]) {  
            const newName = String(response.formValues[0]).trim();  
            if (newName.length > 0) {  
                mainHandItem.nameTag = newName;  

                const inventory = player.getComponent("minecraft:inventory").container;  
                inventory.setItem(mainHandSlotIndex, mainHandItem);  

                if (offHandItem.amount > 1) {  
                    offHandItem.amount -= 1;  
                    equipmentCompPlayer.setEquipment(EquipmentSlot.Offhand, offHandItem);  
                } else {  
                    equipmentCompPlayer.setEquipment(EquipmentSlot.Offhand, new ItemStack("minecraft:air"));  
                }  

                player.playSound("block.cartography_table.use");  
            }  
        }  
    }).catch((error) => {  
        console.log("Error opening form: ", error);  
    });
}

function openEnchantmentsGui(player, enchantments) {
    const form = new ActionFormData()
        .title("§6Enchantments")
        .body("§7Select an enchantment to view its details.")
        .button("§cCancel");

    enchantments.forEach(enchant => {
        form.button(`§e${enchant.type} §7(Level ${enchant.level})`);
    });

    form.show(player).then((response) => {
        if (!response.canceled) {
            const selectedButton = response.selection;
            if (selectedButton !== -1) {
                const selectedEnchantment = enchantments[selectedButton];
                player.sendMessage(`§6You selected the enchantment: §e${selectedEnchantment.type} §7(Level ${selectedEnchantment.level})`);
            }
        }
    }).catch((error) => {
        console.log("Error opening form: ", error);
    });
}

world.beforeEvents.itemUse.subscribe((eventData) => {
    const player = eventData.source;

    const equipmentCompPlayer = player.getComponent(EntityComponentTypes.Equippable);  
    if (equipmentCompPlayer) {  
        const mainHandSlotIndex = player.selectedSlotIndex;  
        const inventory = player.getComponent("minecraft:inventory").container;  
        const mainHandItem = inventory.getItem(mainHandSlotIndex);  
        const offHandItem = equipmentCompPlayer.getEquipment(EquipmentSlot.Offhand);  

        if (mainHandItem && mainHandItem.typeId === "minecraft:name_tag" && offHandItem && offHandItem.typeId === "xassassin:ink_and_quill") {  
            const enchantments = getEnchantsFromItem(mainHandItem);
            const resonanceInkEnchantment = enchantments.find(enchant => enchant.type === "xassassin:resonance_ink");
            if (resonanceInkEnchantment) {
                eventData.cancel = true;
            }
        }
    } else {  
        console.warn('No equipment component found on player');  
    }
});

world.afterEvents.itemUse.subscribe(async (eventData) => {
    const player = eventData.source;

    const equipmentCompPlayer = player.getComponent(EntityComponentTypes.Equippable);  
    if (equipmentCompPlayer) {  
        const mainHandSlotIndex = player.selectedSlotIndex;  
        const inventory = player.getComponent("minecraft:inventory").container;  
        const mainHandItem = inventory.getItem(mainHandSlotIndex);  
        const offHandItem = equipmentCompPlayer.getEquipment(EquipmentSlot.Offhand);  

        if (mainHandItem && mainHandItem.typeId === "minecraft:name_tag" && offHandItem && offHandItem.typeId === "xassassin:ink_and_quill") {  
            const enchantments = getEnchantsFromItem(mainHandItem);
            const resonanceInkEnchantment = enchantments.find(enchant => enchant.type === "xassassin:resonance_ink");
            if (resonanceInkEnchantment) {
                openEnchantmentsGui(player, enchantments);
            } else {
                openRenameNameTagGui(player, mainHandItem, offHandItem, mainHandSlotIndex, equipmentCompPlayer);
            }
        }
    } else {  
        console.warn('No equipment component found on player');  
    }
});
