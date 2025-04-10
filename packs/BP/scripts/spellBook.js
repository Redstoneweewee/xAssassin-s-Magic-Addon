import { world, system, Player, EntityTypes, MolangVariableMap, EntityComponentTypes, EntityInventoryComponent, ItemStack, EntityEquippableComponent, EquipmentSlot } from "@minecraft/server";
import { ModalFormData, ActionFormData } from "@minecraft/server-ui";
import { PlayerUtil, SpellUtil } from "./Utilities.js";
import { SpellObjects } from "./Lists/SpellsList.js";
//import { SpellBooksList } from "./Lists/SpellBooksList.js";
const playerSpellIndices = new Map();
const playerChargeStart = new Map();
const playerLastFireball = new Map();
const fireballLifetimes = new Map();

/**
 * @param {Player} player
 */
/*
function updateInventory(player) {
    const inventory = PlayerUtil.getContainer(player);
    if(inventory === undefined) { return; }
    
    for (let i = 0; i < inventory.size; i++) {
        const item = inventory.getItem(i);
        if (item === undefined) { continue; }
        const lore = item.getLore();

        if (item.typeId === "xassassin:evoker_spell_book") {
            if (!lore.includes("§aSpell Slots:") || lore.some(line => line === "§fEmpty Spell Slot")) {
                item.setLore(["§aSpell Slots:", "§fFang Attack", "§fMinor Healing Spell", "§fWoololo"]);
                inventory.setItem(i, item);
            }
        }
        const tags = item.getTags();
        if (tags.includes("xassassin:spell_book")) {
            for (let tier = 1; tier <= 6; tier++) {
                if (tags.includes(`xassassin:tier_${tier}`) && !lore.includes("§aSpell Slots:")) {
                    item.setLore(["§aSpell Slots:", ...Array(tier).fill("§fEmpty Spell Slot")]);
                    inventory.setItem(i, item);
                    break;
                }
            }
        }
    }
}
*/

function spawnChargeParticles(player, chargeLevel, spell) {
    let particleCount, radius, particleType, yOffset
    if (spell === "Fireball") {
        particleCount = 4 + chargeLevel * 2
        radius = 0.8
        yOffset = 0
        const baseY = player.location.y + yOffset
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * 2 * Math.PI
            const r = radius * Math.sqrt(Math.random())
            const x = player.location.x + r * Math.cos(angle)
            const z = player.location.z + r * Math.sin(angle)
            const y = baseY + Math.random() * 1.7
            let particleVariables = new MolangVariableMap()
            if (chargeLevel === 4) {
                const purpleShade = 0.7 + Math.random() * 0.2
                const greenShade = Math.random() * 0.2
                particleVariables.setColorRGBA("variable.color", { red: purpleShade, green: greenShade, blue: 1.0, alpha: 1.0 })
                player.dimension.spawnParticle("minecraft:colored_flame_particle", { x: x + (Math.random() - 0.5) * 0.15, y: y + (Math.random() - 0.5) * 0.1, z: z + (Math.random() - 0.5) * 0.15 }, particleVariables)
            } else {
                player.dimension.spawnParticle("minecraft:basic_flame_particle", { x: x + (Math.random() - 0.5) * 0.15, y: y + (Math.random() - 0.5) * 0.1, z: z + (Math.random() - 0.5) * 0.15 }, particleVariables)
            }
        }
        if (chargeLevel > 0) {
            const ringParticleCount = chargeLevel
            const ringRadius = 1.2
            const angleStep = (2 * Math.PI) / ringParticleCount
            for (let i = 0; i < ringParticleCount; i++) {
                const angle = i * angleStep + (system.currentTick * 0.05)
                const x = player.location.x + ringRadius * Math.cos(angle)
                const z = player.location.z + ringRadius * Math.sin(angle)
                const y = baseY + 1
                let particleVariables = new MolangVariableMap()
                if (chargeLevel === 4) {
                    const purpleShade = 0.7 + Math.random() * 0.2
                    const greenShade = Math.random() * 0.2
                    particleVariables.setColorRGBA("variable.color", { red: purpleShade, green: greenShade, blue: 1.0, alpha: 1.0 })
                    player.dimension.spawnParticle("minecraft:colored_flame_particle", { x, y, z }, particleVariables)
                } else {
                    player.dimension.spawnParticle("minecraft:basic_flame_particle", { x, y, z }, particleVariables)
                }
            }
        }
        if (system.currentTick % 4 === 0) {
            const timeOffset = system.currentTick * 0.05
            const phase = (Math.sin(timeOffset) + 1) / 2
            let auraVariables = new MolangVariableMap()
            if (chargeLevel === 4) {
                const purpleShade = 0.7 + phase * 0.2
                const greenShade = phase * 0.2
                try {
                    auraVariables.setColorRGBA("variable.color", { red: purpleShade, green: greenShade, blue: 1.0, alpha: 1.0 })
                } catch (e) {
                    player.sendMessage(`Error setting aura particle color: ${e.message}`)
                    auraVariables.setColorRGBA("variable.color", { red: 1.0, green: 1.0, blue: 1.0, alpha: 1.0 })
                }
            } else {
                const colors = [{ r: 1.0, g: 0.4, b: 0.0 }, { r: 1.0, g: 0.6, b: 0.0 }, { r: 1.0, g: 0.8, b: 0.0 }, { r: 1.5263157894736843, g: 1.0, b: 0.0 }]
                const colorIndex = phase * (colors.length - 1)
                const lowerIndex = Math.floor(colorIndex)
                const upperIndex = Math.min(lowerIndex + 1, colors.length - 1)
                const blendFactor = colorIndex - lowerIndex
                const lowerColor = colors[lowerIndex]
                const upperColor = colors[upperIndex]
                const r = lowerColor.r + (upperColor.r - lowerColor.r) * blendFactor
                const g = lowerColor.g + (upperColor.g - lowerColor.g) * blendFactor
                const b = lowerColor.b + (upperColor.b - lowerColor.b) * blendFactor
                try {
                    auraVariables.setColorRGBA("variable.color", { red: r, green: g, blue: b, alpha: 1.0 })
                } catch (e) {
                    player.sendMessage(`Error setting aura particle color: ${e.message}`)
                    auraVariables.setColorRGBA("variable.color", { red: 1.0, green: 1.0, blue: 1.0, alpha: 1.0 })
                }
            }
            player.dimension.spawnParticle("xassassin:spell_aura", { x: player.location.x, y: baseY, z: player.location.z }, auraVariables)
        }
    } 
    else if (spell === "Woololo") {
        radius = chargeLevel === 0 ? 0 : chargeLevel === 1 ? 3 : chargeLevel === 2 ? 8 : 12
        particleCount = chargeLevel === 0 ? 0 : chargeLevel === 1 ? 12 : chargeLevel === 2 ? 20 : 28
        particleType = "minecraft:villager_happy"
        if (radius === 0) return
        const angleStepRing = (2 * Math.PI) / particleCount
        for (let i = 0; i < particleCount; i++) {
            const angle = i * angleStepRing
            const x = player.location.x + radius * Math.cos(angle)
            const z = player.location.z + radius * Math.sin(angle)
            const spawnY = SpellUtil.getSpawnY(player.dimension, x, z, Math.floor(player.location.y), true)
            if (spawnY !== null) {
                player.dimension.spawnParticle(particleType, { x, y: spawnY + 0.5, z }, new MolangVariableMap())
            }
        }
        particleType = "xassassin:spell_aura"
        let auraVariables = new MolangVariableMap()
        const colorCycleSpeed = 0.05
        const timeOffset = system.currentTick * colorCycleSpeed
        const phase = timeOffset
        const blendFactor = (Math.sin(phase) + 1) / 2
        const greenTurquoise = { r: 0.2, g: 0.95, b: 0.7 }
        const cyan = { r: 0.0, g: 1.0, b: 1.0 }
        const auraR = greenTurquoise.r + (cyan.r - greenTurquoise.r) * blendFactor
        const auraG = greenTurquoise.g + (cyan.g - greenTurquoise.g) * blendFactor
        const auraB = greenTurquoise.b + (cyan.b - greenTurquoise.b) * blendFactor
        try {
            auraVariables.setColorRGBA("variable.color", { red: auraR, green: auraG, blue: auraB, alpha: 1.0 })
        } catch (e) {
            player.sendMessage(`Error setting aura particle color: ${e.message}`)
            auraVariables.setColorRGBA("variable.color", { red: 1.0, green: 1.0, blue: 1.0, alpha: 1.0 })
        }
        player.dimension.spawnParticle(particleType, { x: player.location.x, y: player.location.y, z: player.location.z }, auraVariables)
        const trailRadius = 1.3
        const trailHeight = 2.3
        const trailType = "xassassin:spell_trail"
        const angleStep = 0.3
        if (!player.hasOwnProperty("trailAngle")) {
            player.trailAngle = 0
        }
        player.trailAngle += angleStep
        if (player.trailAngle >= 2 * Math.PI) {
            player.trailAngle -= 2 * Math.PI
        }
        const angle = player.trailAngle
        const x = player.location.x + trailRadius * Math.cos(angle)
        const z = player.location.z + trailRadius * Math.sin(angle)
        const y = player.location.y + trailHeight
        let trailVariables = new MolangVariableMap()
        const trailR = greenTurquoise.r + (cyan.r - greenTurquoise.r) * blendFactor
        const trailG = greenTurquoise.g + (cyan.g - greenTurquoise.g) * blendFactor
        const trailB = greenTurquoise.b + (cyan.b - greenTurquoise.b) * blendFactor
        try {
            trailVariables.setColorRGBA("variable.color", { red: trailR, green: trailG, blue: trailB, alpha: 1.0 })
        } catch (e) {
            player.sendMessage(`Error setting trail particle color: ${e.message}`)
            trailVariables.setColorRGBA("variable.color", { red: 1.0, green: 1.0, blue: 1.0, alpha: 1.0 })
        }
        player.dimension.spawnParticle(trailType, { x, y, z }, trailVariables)
    } 
    else if (spell === "Wind Dash") {
        particleType = "xassassin:spell_aura"
        let auraVariables = new MolangVariableMap()
        const colorCycleSpeed = 0.1
        const timeOffset = system.currentTick * colorCycleSpeed
        const phase = (Math.sin(timeOffset) + 1) / 2
        const lightBlue = { r: 0.68, g: 0.85, b: 0.9 }
        const grey = { r: 0.75, g: 0.75, b: 0.75 }
        const white = { r: 1.0, g: 1.0, b: 1.0 }
        let auraR, auraG, auraB
        if (phase < 0.5) {
            const blendFactor = phase * 2
            auraR = lightBlue.r + (grey.r - lightBlue.r) * blendFactor
            auraG = lightBlue.g + (grey.g - lightBlue.g) * blendFactor
            auraB = lightBlue.b + (grey.b - lightBlue.b) * blendFactor
        } else {
            const blendFactor = (phase - 0.5) * 2
            auraR = grey.r + (white.r - grey.r) * blendFactor
            auraG = grey.g + (white.g - grey.g) * blendFactor
            auraB = grey.b + (white.b - grey.b) * blendFactor
        }
        try {
            auraVariables.setColorRGBA("variable.color", { red: auraR, green: auraG, blue: auraB, alpha: 1.0 })
        } catch (e) {
            player.sendMessage(`Error setting aura particle color: ${e.message}`)
            auraVariables.setColorRGBA("variable.color", { red: 1.0, green: 1.0, blue: 1.0, alpha: 1.0 })
        }
        player.dimension.spawnParticle(particleType, { x: player.location.x, y: player.location.y, z: player.location.z }, auraVariables)
        const trailRadius = 1.3
        const trailHeight = 2.3
        const trailType = "xassassin:spell_trail"
        const angleStep = 0.3
        if (!player.hasOwnProperty("trailAngle")) {
            player.trailAngle = 0
        }
        player.trailAngle += angleStep
        if (player.trailAngle >= 2 * Math.PI) {
            player.trailAngle -= 2 * Math.PI
        }
        const angle = player.trailAngle
        const x = player.location.x + trailRadius * Math.cos(angle)
        const z = player.location.z + trailRadius * Math.sin(angle)
        const y = player.location.y + trailHeight
        let trailVariables = new MolangVariableMap()
        let trailR, trailG, trailB
        if (phase < 0.5) {
            const blendFactor = phase * 2
            trailR = lightBlue.r + (grey.r - lightBlue.r) * blendFactor
            trailG = lightBlue.g + (grey.g - lightBlue.g) * blendFactor
            trailB = lightBlue.b + (grey.b - lightBlue.b) * blendFactor
        } else {
            const blendFactor = (phase - 0.5) * 2
            trailR = grey.r + (white.r - grey.r) * blendFactor
            trailG = grey.g + (white.g - grey.g) * blendFactor
            trailB = grey.b + (white.b - grey.b) * blendFactor
        }
        try {
            trailVariables.setColorRGBA("variable.color", { red: trailR, green: trailG, blue: trailB, alpha: 1.0 })
        } catch (e) {
            player.sendMessage(`Error setting trail particle color: ${e.message}`)
            trailVariables.setColorRGBA("variable.color", { red: 1.0, green: 1.0, blue: 1.0, alpha: 1.0 })
        }
        player.dimension.spawnParticle(trailType, { x, y, z }, trailVariables)
    } 
    else if (spell === "Fang Attack") {
        for (let ring = 0; ring < chargeLevel; ring++) {
            const radius = 3 + ring * 2
            const fangCount = 8 + (ring === 1 ? 2 : ring === 2 ? 4 : 0)
            const angleStep = (2 * Math.PI) / fangCount
            for (let i = 0; i < fangCount; i++) {
                const angle = i * angleStep
                const x = player.location.x + radius * Math.cos(angle)
                const z = player.location.z + radius * Math.sin(angle)
                const spawnY = SpellUtil.getSpawnY(player.dimension, x, z, Math.floor(player.location.y), true)
                if (spawnY !== null) {
                    player.dimension.spawnParticle("xassassin:spell_assist", { x, y: spawnY + 0.5, z }, new MolangVariableMap())
                }
            }
        }
        particleType = "xassassin:spell_aura"
        let auraVariables = new MolangVariableMap()
        const auraCycleSpeed = 0.08
        const auraTimeOffset = system.currentTick * auraCycleSpeed
        const auraPhase = auraTimeOffset
        const auraR = (Math.sin(auraPhase) + 1) / 2
        const auraG = (Math.sin(auraPhase + 2 * Math.PI / 3) + 1) / 2
        const auraB = (Math.sin(auraPhase + 4 * Math.PI / 3) + 1) / 2
        try {
            auraVariables.setColorRGBA("variable.color", { red: auraR, green: auraG, blue: auraB, alpha: 1.0 })
        } catch (e) {
            player.sendMessage(`Error setting aura particle color: ${e.message}`)
            auraVariables.setColorRGBA("variable.color", { red: 1.0, green: 1.0, blue: 1.0, alpha: 1.0 })
        }
        player.dimension.spawnParticle(particleType, { x: player.location.x, y: player.location.y, z: player.location.z }, auraVariables)
        const trailRadius = 1.3
        const trailHeight = 2.3
        const trailType = "xassassin:spell_trail"
        const angleStepTrail = 0.3
        const colorCycleSpeed = 0.05
        if (!player.hasOwnProperty("trailAngle")) {
            player.trailAngle = 0
        }
        player.trailAngle += angleStepTrail
        if (player.trailAngle >= 2 * Math.PI) {
            player.trailAngle -= 2 * Math.PI
        }
        const timeOffset = system.currentTick * colorCycleSpeed
        const angle = player.trailAngle
        const x = player.location.x + trailRadius * Math.cos(angle)
        const z = player.location.z + trailRadius * Math.sin(angle)
        const y = player.location.y + trailHeight
        let trailVariables = new MolangVariableMap()
        const phase = timeOffset
        const r = (Math.sin(phase) + 1) / 2
        const g = (Math.sin(phase + 2 * Math.PI / 3) + 1) / 2
        const b = (Math.sin(phase + 4 * Math.PI / 3) + 1) / 2
        try {
            trailVariables.setColorRGBA("variable.color", { red: r, green: g, blue: b, alpha: 1.0 })
        } catch (e) {
            player.sendMessage(`Error setting trail particle color: ${e.message}`)
            trailVariables.setColorRGBA("variable.color", { red: 1.0, green: 1.0, blue: 1.0, alpha: 1.0 })
        }
        player.dimension.spawnParticle(trailType, { x, y, z }, trailVariables)
    } 
    else if (spell === "Fang Line") {
        const direction = player.getViewDirection()
        const horizontalMagnitude = Math.sqrt(direction.x * direction.x + direction.z * direction.z)
        const horizontalDirection = { x: horizontalMagnitude > 0 ? direction.x / horizontalMagnitude : 0, z: horizontalMagnitude > 0 ? direction.z / horizontalMagnitude : 0 }
        const fangCount = 8
        const startDistance = 1.5
        const stepSize = 2.0
        const lineCount = chargeLevel
        const perpX = -horizontalDirection.z
        const perpZ = horizontalDirection.x
        for (let line = 0; line < lineCount; line++) {
            const offset = (line - (lineCount - 1) / 2) * 2.0
            for (let i = 0; i < fangCount; i++) {
                const distance = startDistance + i * stepSize
                const x = player.location.x + horizontalDirection.x * distance + perpX * offset
                const z = player.location.z + horizontalDirection.z * distance + perpZ * offset
                const spawnY = SpellUtil.getSpawnY(player.dimension, x, z, Math.floor(player.location.y), true)
                if (spawnY !== null) {
                    player.dimension.spawnParticle("xassassin:spell_assist", { x, y: spawnY + 0.5, z }, new MolangVariableMap())
                }
            }
        }
        particleType = "xassassin:spell_aura"
        let auraVariables = new MolangVariableMap()
        const auraCycleSpeed = 0.08
        const auraTimeOffset = system.currentTick * auraCycleSpeed
        const auraPhase = auraTimeOffset
        const auraR = (Math.sin(auraPhase) + 1) / 2
        const auraG = (Math.sin(auraPhase + 2 * Math.PI / 3) + 1) / 2
        const auraB = (Math.sin(auraPhase + 4 * Math.PI / 3) + 1) / 2
        try {
            auraVariables.setColorRGBA("variable.color", { red: auraR, green: auraG, blue: auraB, alpha: 1.0 })
        } catch (e) {
            player.sendMessage(`Error setting aura particle color: ${e.message}`)
            auraVariables.setColorRGBA("variable.color", { red: 1.0, green: 1.0, blue: 1.0, alpha: 1.0 })
        }
        player.dimension.spawnParticle(particleType, { x: player.location.x, y: player.location.y, z: player.location.z }, auraVariables)
        const trailRadius = 1.3
        const trailHeight = 2.3
        const trailType = "xassassin:spell_trail"
        const angleStep = 0.3
        const colorCycleSpeed = 0.05
        if (!player.hasOwnProperty("trailAngle")) {
            player.trailAngle = 0
        }
        player.trailAngle += angleStep
        if (player.trailAngle >= 2 * Math.PI) {
            player.trailAngle -= 2 * Math.PI
        }
        const timeOffset = system.currentTick * colorCycleSpeed
        const angle = player.trailAngle
        const x = player.location.x + trailRadius * Math.cos(angle)
        const z = player.location.z + trailRadius * Math.sin(angle)
        const y = player.location.y + trailHeight
        let trailVariables = new MolangVariableMap()
        const phase = timeOffset
        const r = (Math.sin(phase) + 1) / 2
        const g = (Math.sin(phase + 2 * Math.PI / 3) + 1) / 2
        const b = (Math.sin(phase + 4 * Math.PI / 3) + 1) / 2
        try {
            trailVariables.setColorRGBA("variable.color", { red: r, green: g, blue: b, alpha: 1.0 })
        } catch (e) {
            player.sendMessage(`Error setting trail particle color: ${e.message}`)
            trailVariables.setColorRGBA("variable.color", { red: 1.0, green: 1.0, blue: 1.0, alpha: 1.0 })
        }
        player.dimension.spawnParticle(trailType, { x, y, z }, trailVariables)
    }
}



/*
function updateChargeIndicator() {
    for (const player of world.getPlayers()) {
        const startTick = playerChargeStart.get(player.id)
        if (!startTick) continue
        const mainHand = player.getComponent("minecraft:equippable").getEquipment("Mainhand")
        if (!mainHand || !mainHand.getTags().includes("xassassin:magic_staff") || player.isSneaking) {
            playerChargeStart.delete(player.id)
            player.onScreenDisplay.setActionBar("")
            continue
        }
        const chargeTime = system.currentTick - startTick
        const offHand = player.getComponent("minecraft:equippable").getEquipment("Offhand")
        const inventory = player.getComponent("inventory").container
        const hasDragonBreath = Array.from({ length: inventory.size }, (_, i) => inventory.getItem(i)).some(item => item && item.typeId === "minecraft:dragon_breath")
        let maxChargeLevel = 3
        let currentSpell = ""
        if (offHand && offHand.getTags().includes("xassassin:spell_book")) {
            const spells = offHand.getLore().slice(offHand.getLore().indexOf("§aSpell Slots:") + 1).filter(line => line !== "§fEmpty Spell Slot").map(line => line.replace("§f", ""))
            currentSpell = spells[playerSpellIndices.get(player.id) || 0]
            if (hasDragonBreath && currentSpell === "Fireball") {
                maxChargeLevel = 4
            }
        }
        const chargeLevel = Math.min(maxChargeLevel, Math.floor(chargeTime / 16))
        let display = offHand && offHand.getTags().includes("xassassin:spell_book") ? offHand.getLore().slice(offHand.getLore().indexOf("§aSpell Slots:") + 1).filter(line => line !== "§fEmpty Spell Slot").map(line => line.replace("§f", ""))[playerSpellIndices.get(player.id) || 0] + "\n" : ""
        display += maxChargeLevel === 4 ? Array(4).fill(0).map((_, i) => i < chargeLevel ? (i === 3 ? "§5[§d+§5]§r" : "§a[§e+§a]§r") : "§7[§f-§7]§r").join(" ") : Array(3).fill(0).map((_, i) => i < chargeLevel ? "§a[§e+§a]§r" : "§7[§f-§7]§r").join(" ")
        player.onScreenDisplay.setActionBar(display)
        if (offHand && offHand.getTags().includes("xassassin:spell_book")) {
            if (["Fireball", "Woololo", "Fang Attack", "Fang Line", "Wind Dash"].includes(currentSpell)) {
                if (system.currentTick % 2 === 0) {
                    spawnChargeParticles(player, chargeLevel, currentSpell)
                }
            }
        }
        if (chargeLevel > Math.min(maxChargeLevel, Math.floor((chargeTime - 1) / 16))) {
            const basePitch = 0.8
            const pitchIncrement = 0.1
            const pitch = basePitch + chargeLevel * pitchIncrement
            player.playSound("random.orb", { pitch: Math.min(pitch, 2.0) })
        }
    }
}
*/
    /*
function handleItemUse({ source: player }) {
    const mainHand = player.getComponent("minecraft:equippable").getEquipment("Mainhand")
    const offHand = player.getComponent("minecraft:equippable").getEquipment("Offhand")
    if (!mainHand) return
    const mainTags = mainHand.getTags()
    if (mainTags.includes("xassassin:spell_book") || mainHand.typeId === "xassassin:evoker_spell_book") {
        const lore = mainHand.getLore()
        const spellSlotsIndex = lore.indexOf("§aSpell Slots:")
        if (spellSlotsIndex === -1) return
        const spells = lore.slice(spellSlotsIndex + 1).filter(line => line !== "§fEmpty Spell Slot")
        const totalSlots = lore.slice(spellSlotsIndex + 1).length
        const usedSlots = spells.length
        const display = spells.length ? `§aSpells:\n§d${spells.join("\n§d")}\n§r${usedSlots}/${totalSlots} slots used.` : "§aSpells:\n§dNone\n§r0/${totalSlots} slots used."
        player.onScreenDisplay.setActionBar(display)
        player.playSound("pickup_enchanted.chiseled_bookshelf")
        return
    }
    if (!offHand) return
    const offTags = offHand.getTags()
    if (mainTags.includes("xassassin:magic_staff") && offTags.includes("xassassin:spell_book") && player.isSneaking) {
        const lore = offHand.getLore()
        const spells = lore.slice(lore.indexOf("§aSpell Slots:") + 1).filter(line => line !== "§fEmpty Spell Slot").map(line => line.replace("§f", ""))
        if (spells.length) {
            const currentIndex = playerSpellIndices.get(player.id) ?? 0
            const newIndex = (currentIndex + 1) % spells.length
            playerSpellIndices.set(player.id, newIndex)
            const prevIndex = (newIndex - 1 + spells.length) % spells.length
            const nextIndex = (newIndex + 1) % spells.length
            player.onScreenDisplay.setActionBar(spells.length === 1 ? `§f>> §e${spells[newIndex]}§r §f<<` : spells.length === 2 ? `§7${spells[prevIndex]}\n§f>> §e${spells[newIndex]}§r §f<<` : `§7${spells[prevIndex]}\n§f>> §e${spells[newIndex]}§r §f<<\n§7${spells[nextIndex]}`)
            player.playSound("pickup_enchanted.chiseled_bookshelf")
        } else {
            player.onScreenDisplay.setActionBar("No spells available")
        }
    }   
   const mainHand = player.getComponent("minecraft:equippable").getEquipment("Mainhand")
   const offHand = player.getComponent("minecraft:equippable").getEquipment("Offhand")

   const mainTags = mainHand.getTags()
    const offTags = offHand.getTags()
    if (offTags.includes("xassassin:spell_book")) {
        const scrollTag = mainTags.find(tag => tag.startsWith("spellscroll:"))
        if (scrollTag) {
            const spellName = "§f" + scrollTag.replace("spellscroll:", "").replace(/_/g, " ").split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")
            const tier = Math.min(6, Math.max(1, [1, 2, 3, 4, 5, 6].find(t => offTags.includes(`xassassin:tier_${t}`)) || 1))
            const lore = offHand.getLore()
            const spellSlotsIndex = lore.indexOf("§aSpell Slots:")
            if (spellSlotsIndex === -1) return
            const currentSlots = lore.slice(spellSlotsIndex + 1)
            const slots = currentSlots.length >= tier ? currentSlots.slice(0, tier) : currentSlots.concat(Array(tier - currentSlots.length).fill("§fEmpty Spell Slot"))
            if (slots.includes(spellName)) {
                player.onScreenDisplay.setActionBar("Cant have two identical spells on one spell_book")
                player.playSound("random.orb")
                return
            }
            new ModalFormData().title("Select Spell Slot").dropdown("Choose a slot to override:", slots.map((slot, i) => `Slot ${i + 1}: ${slot}`)).show(player).then(({ canceled, formValues }) => {
                if (canceled) return
                const index = formValues[0]
                const isCreative = player.getGameMode() === "creative"
                const newLore = [...lore]
                if (slots[index] === "§fEmpty Spell Slot") {
                    newLore[spellSlotsIndex + 1 + index] = spellName
                    offHand.setLore(newLore)
                    player.getComponent("minecraft:equippable").setEquipment("Offhand", offHand)
                    if (!isCreative) player.getComponent("minecraft:equippable").setEquipment("Mainhand", null)
                    player.playSound("use.chiseled_bookshelf")
                    player.sendMessage(`Added "${spellName}" to slot ${index + 1}`)
                } else {
                    new ActionFormData().title("Confirm Overwrite").body(`Are you sure you want to overwrite "${slots[index]}" with "${spellName}"?`).button("Yes").button("No").show(player).then(({ canceled, selection }) => {
                        if (canceled || selection === 1) return
                        if (selection === 0) {
                            newLore[spellSlotsIndex + 1 + index] = spellName
                            offHand.setLore(newLore)
                            player.getComponent("minecraft:equippable").setEquipment("Offhand", offHand)
                            if (!isCreative) player.getComponent("minecraft:equippable").setEquipment("Mainhand", null)
                            player.playSound("use.chiseled_bookshelf")
                            player.sendMessage(`Overwrote slot ${index + 1} with "${spellName}"`)
                        }
                    })
                }
            })
        }
    }
}
    */      
/*
function handleItemStartUse({ source: player, itemStack: item }) {
    if (!item || !item.getTags().includes("xassassin:magic_staff") || player.isSneaking) return
    playerChargeStart.set(player.id, system.currentTick)
    const offHand = player.getComponent("minecraft:equippable").getEquipment("Offhand")
    if (offHand && offHand.getTags().includes("xassassin:spell_book")) {
        const spells = offHand.getLore().slice(offHand.getLore().indexOf("§aSpell Slots:") + 1).filter(line => line !== "§fEmpty Spell Slot").map(line => line.replace("§f", ""))
        if (spells.length) {
            const spell = spells[playerSpellIndices.get(player.id) || 0]
            player.playSound(spell === "Woololo" ? "mob.evocation_illager.prepare_wololo" : "mob.evocation_illager.prepare_attack")
            return
        }
    }
    player.playSound("mob.evocation_illager.prepare_attack")
}
*/


/**
 * @param {Player} player 
 * @param {ItemStack|undefined} mainHand 
 */
/*
function handleItemReleaseUse(player, mainHand) {
    const equippable = player.getComponent(EntityComponentTypes.Equippable);
    if(equippable === undefined || !(equippable instanceof EntityEquippableComponent)) { return; }
    const offHand = equippable.getEquipment(EquipmentSlot.Offhand);
    if (!mainHand || !offHand || !mainHand.getTags().includes("xassassin:magic_staff") || !offHand.getTags().includes("xassassin:spell_book") || player.isSneaking) {
        playerChargeStart.delete(player.id);
        return;
    }

    const startTick = playerChargeStart.get(player.id);
    if (!startTick) return;

    const inventory = PlayerUtil.getContainer(player);
    if(inventory === undefined) { return; }
    const hasDragonBreath = Array.from({ length: inventory.size }, (_, i) => inventory.getItem(i)).some(item => item && item.typeId === "minecraft:dragon_breath");
    const maxChargeLevel = hasDragonBreath && offHand.getLore().slice(offHand.getLore().indexOf("§aSpell Slots:") + 1).filter(line => line !== "§fEmpty Spell Slot").map(line => line.replace("§f", ""))[playerSpellIndices.get(player.id) || 0] === "Fireball" ? 4 : 3;
    const chargeTime = system.currentTick - startTick;
    const chargeLevel = Math.min(maxChargeLevel, Math.floor(chargeTime / 16));
    playerChargeStart.delete(player.id);
    player.onScreenDisplay.setActionBar("§r");
    if (chargeTime < 16) {
        player.onScreenDisplay.setActionBar("§cCharge for at least 16 ticks!");
        player.playSound("note.bass");
        return;
    }
    const spells = offHand.getLore().slice(offHand.getLore().indexOf("§aSpell Slots:") + 1).filter(line => line !== "§fEmpty Spell Slot").map(line => line.replace("§f", ""));
    if (!spells.length) return;
    const spell = spells[playerSpellIndices.get(player.id) || 0];
    const spellObject = SpellObjects.get(spell);
    if(spellObject) {
        SpellUtil.castSpell(spellObject.exitFuncName, player, chargeLevel);
        player.playSound("mob.evocation_illager.cast_spell");
    }
    else {
        player.sendMessage(`Spell "${spell}" is not yet implemented`);
        player.playSound("note.bass");
    }
}
*/






system.runInterval(() => {
    for (const [fireballId, spawnTick] of fireballLifetimes) {
        const fireball = world.getEntity(fireballId)
        if (fireball && system.currentTick - spawnTick > 600) {
            fireball.remove()
            fireballLifetimes.delete(fireballId)
            playerLastFireball.forEach((lastFireball, playerId) => {
                if (lastFireball && lastFireball.id === fireballId) {
                    playerLastFireball.delete(playerId)
                }
            })
        } else if (!fireball) {
            fireballLifetimes.delete(fireballId)
        }
    }
}, 20);
system.afterEvents.scriptEventReceive.subscribe(event => {
    if (event.id === "minecraft:script_loaded") {
        for (const [fireballId] of fireballLifetimes) {
            const fireball = world.getEntity(fireballId)
            if (fireball) fireball.remove()
        }
        fireballLifetimes.clear()
        playerLastFireball.clear()
    }
});

//system.runInterval(() => {
//    world.getAllPlayers().forEach(player => {
//        updateInventory(player);
//    });
//}, 5);

//system.runInterval(updateChargeIndicator, 1);
//world.afterEvents.itemUse.subscribe(handleItemUse);
//world.afterEvents.itemStartUse.subscribe(handleItemStartUse);
//world.afterEvents.itemReleaseUse.subscribe(eventData => {
//    handleItemReleaseUse(eventData.source, eventData.itemStack);
//});