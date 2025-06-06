import { EntityColorComponent, EntityComponentTypes, MolangVariableMap, Player, system } from "@minecraft/server";
import { PlayerUtil, SpellUtil } from "../Utilities";


/**
 * @typedef {((player: Player, chargeLevel: number) => void)} SpellFunction
 */



function none() {}


/**
 * @param {Player} player 
 * @param {number} chargeLevel 
 */
function fangAttack(player, chargeLevel) {
    for (let ring = 0; ring < chargeLevel; ring++) {
        const radius = 3 + ring * 2;
        const fangCount = 8 + (ring === 1 ? 2 : ring === 2 ? 4 : 0);
        const angleStep = (2 * Math.PI) / fangCount;
        system.runTimeout(() => {
            for (let i = 0; i < fangCount; i++) {
                const angle = i * angleStep;
                const x = player.location.x + radius * Math.cos(angle);
                const z = player.location.z + radius * Math.sin(angle);
                const spawnY = SpellUtil.getSpawnY(player.dimension, x, z, Math.floor(player.location.y), true);
                if (spawnY !== null) player.dimension.runCommand(`summon minecraft:evocation_fang ${x} ${spawnY} ${z}`);
            }
        }, ring * 5);
    }
}

/**
 * @param {Player} player 
 * @param {number} chargeLevel 
 */
function fangLine(player, chargeLevel) {
    const direction = player.getViewDirection();
    const horizontalMagnitude = Math.sqrt(direction.x * direction.x + direction.z * direction.z);
    const horizontalDirection = { x: horizontalMagnitude > 0 ? direction.x / horizontalMagnitude : 0, z: horizontalMagnitude > 0 ? direction.z / horizontalMagnitude : 0 }
    const fangCount = 8;
    const startDistance = 1.5;
    const stepSize = 2.0;
    const lineCount = chargeLevel;
    const perpX = -horizontalDirection.z;
    const perpZ = horizontalDirection.x;
    for (let line = 0; line < lineCount; line++) {
        const offset = (line - (lineCount - 1) / 2) * 2.0;
        for (let i = 0; i < fangCount; i++) {
            system.runTimeout(() => {
                const distance = startDistance + i * stepSize;
                const x = player.location.x + horizontalDirection.x * distance + perpX * offset;
                const z = player.location.z + horizontalDirection.z * distance + perpZ * offset;
                const spawnY = SpellUtil.getSpawnY(player.dimension, x, z, Math.floor(player.location.y), true);
                if (spawnY !== null) {
                    player.dimension.runCommand(`summon minecraft:evocation_fang ${x} ${spawnY} ${z}`);
                }
            }, i * 3);
        }
    }
}

/**
 * @param {Player} player 
 * @param {number} chargeLevel 
 */
function minorHealing(player, chargeLevel) {
    player.addEffect("regeneration", 200, { amplifier: 1 });
    if (chargeLevel >= 2) {
        const radius = chargeLevel === 3 ? 8 : 5;
        const particleCount = chargeLevel === 3 ? 24 : 16;
        const angleStep = (2 * Math.PI) / particleCount;
        for (let i = 0; i < particleCount; i++) {
            const angle = i * angleStep;
            const x = player.location.x + radius * Math.cos(angle);
            const z = player.location.z + radius * Math.sin(angle);
            const spawnY = SpellUtil.getSpawnY(player.dimension, x, z, Math.floor(player.location.y), true);
            if (spawnY !== null) {
                player.dimension.spawnParticle("minecraft:heart_particle", { x, y: spawnY + 0.5, z }, new MolangVariableMap());
            }
        }
        player.dimension.getEntities({ location: player.location, maxDistance: radius, excludeTypes: ["minecraft:item", "minecraft:xp_orb"] }).filter(entity => entity.hasComponent("minecraft:health") && (entity instanceof Player || (entity.typeId.startsWith("minecraft:") && !entity.typeId.includes("monster")))).forEach(entity => entity.addEffect("regeneration", 200, { amplifier: chargeLevel === 3 ? 1 : 0 }));
    }
    if (chargeLevel === 3) player.addEffect("absorption", 200, { amplifier: 1 })
}

/**
 * @param {Player} player 
 * @param {number} chargeLevel 
 */
function woololo(player, chargeLevel) {
    const radius = chargeLevel === 1 ? 3 : chargeLevel === 2 ? 8 : 12;
    const particleCount = chargeLevel === 1 ? 12 : chargeLevel === 2 ? 20 : 28;
    const angleStep = (2 * Math.PI) / particleCount;
    for (let i = 0; i < particleCount; i++) {
        const angle = i * angleStep;
        const x = player.location.x + radius * Math.cos(angle);
        const z = player.location.z + radius * Math.sin(angle);
        const spawnY = SpellUtil.getSpawnY(player.dimension, x, z, Math.floor(player.location.y), true);
        if (spawnY !== null) {
            player.dimension.spawnParticle("minecraft:villager_happy", { x, y: spawnY + 0.5, z }, new MolangVariableMap());
        }
    }
    let affected = 0;
    player.dimension.getEntities({ location: player.location, maxDistance: radius, type: "minecraft:sheep", excludeTypes: ["minecraft:item", "minecraft:xp_orb"] }).forEach(sheep => {
        const colorComponent = sheep.getComponent(EntityComponentTypes.Color);
        if(colorComponent !== undefined && (colorComponent instanceof EntityColorComponent)) {
            colorComponent.value = Math.floor(Math.random() * 16);
            if (chargeLevel === 3 && Math.random() < 0.25) sheep.nameTag = "jeb_";
            const spawnY = SpellUtil.getSpawnY(sheep.dimension, sheep.location.x, sheep.location.z, Math.floor(sheep.location.y));
            if (spawnY !== null) { 
                sheep.dimension.spawnParticle("minecraft:villager_happy", { x: sheep.location.x, y: spawnY + 0.5, z: sheep.location.z }, new MolangVariableMap());
            }
            affected++;
        }
    })
    if (affected > 0) {
        player.playSound("mob.sheep.say");
    }
}

const playerLastFireball = new Map();
const fireballLifetimes = new Map();
/**
 * @param {Player} player 
 * @param {number} chargeLevel 
 */
function fireball(player, chargeLevel) {
    const inventory = PlayerUtil.getContainer(player);
    if(inventory === undefined) { return; }
    const directionFireball = player.getViewDirection();
    let spawnCount = chargeLevel === 4 ? 4 : chargeLevel === 3 ? 3 : chargeLevel;
    for (let i = 0; i < spawnCount; i++) {
        system.runTimeout(() => {
            const spawnDistance = 3.0;
            const eyeHeight = 1.6;
            let spawnLoc = { x: player.location.x, y: player.location.y + eyeHeight, z: player.location.z }
            const stepSize = 0.2;
            let distanceTraveled = 0;
            let hitBlock = false;
            while (distanceTraveled < spawnDistance && !hitBlock) {
                spawnLoc.x += directionFireball.x * stepSize;
                spawnLoc.y += directionFireball.y * stepSize;
                spawnLoc.z += directionFireball.z * stepSize;
                distanceTraveled += stepSize;
                const block = player.dimension.getBlock({ x: Math.floor(spawnLoc.x), y: Math.floor(spawnLoc.y), z: Math.floor(spawnLoc.z) })
                if (block && !block.isAir) {
                    hitBlock = true;
                    spawnLoc.x -= directionFireball.x * stepSize;
                    spawnLoc.y -= directionFireball.y * stepSize;
                    spawnLoc.z -= directionFireball.z * stepSize;
                    break;
                }
            }
            if (!hitBlock) {
                spawnLoc.x = player.location.x + directionFireball.x * spawnDistance;
                spawnLoc.y = player.location.y + eyeHeight + directionFireball.y * spawnDistance;
                spawnLoc.z = player.location.z + directionFireball.z * spawnDistance;
            }
            if (spawnLoc.y < player.location.y + 0.5 && directionFireball.y < -0.2) {
                spawnLoc.y = player.location.y + 0.5;
            }
            let entityType;
            if (chargeLevel === 4) {
                if (i === 0 || i === 1) entityType = "minecraft:small_fireball"
                else if (i === 2) entityType = "minecraft:fireball"
                else entityType = "minecraft:dragon_fireball"
            } else if (chargeLevel === 3 && i === 2) {
                entityType = "minecraft:fireball"
            } else {
                entityType = "minecraft:small_fireball"
            }
            if (entityType === "minecraft:fireball") {
                spawnLoc.y += 1.3
            } else if (entityType === "minecraft:dragon_fireball") {
                spawnLoc.y += 0
            }
            const fireball = player.dimension.spawnEntity(entityType, spawnLoc)
            fireball.applyImpulse({ x: directionFireball.x * 2, y: directionFireball.y * 2, z: directionFireball.z * 2 })
            playerLastFireball.set(player.id, fireball)
            fireballLifetimes.set(fireball.id, system.currentTick)
            player.playSound("mob.ghast.fireball")
            if (entityType === "minecraft:dragon_fireball") {
                for (let slot = 0; slot < inventory.size; slot++) {
                    const item = inventory.getItem(slot)
                    if (item && item.typeId === "minecraft:dragon_breath") {
                        item.amount--
                        if (item.amount <= 0) {
                            inventory.setItem(slot, undefined);
                        } else {
                            inventory.setItem(slot, item);
                        }
                        break
                    }
                }
            }
            if (entityType === "minecraft:fireball" || entityType === "minecraft:dragon_fireball") {
                system.runTimeout(() => {
                    const lastFireball = playerLastFireball.get(player.id)
                    if (lastFireball && lastFireball.isValid()) {
                        const velocity = lastFireball.getVelocity()
                        const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2)
                        if (speed < 0.5) {
                            lastFireball.applyImpulse({ x: directionFireball.x * 2, y: directionFireball.y * 2, z: directionFireball.z * 2 })
                        }
                    }
                }, 5)
            }
        }, i * 5)
    }
}

/**
 * @param {Player} player 
 * @param {number} chargeLevel 
 */
function windDash(player, chargeLevel) {
    const dashDirection = player.getViewDirection();
    const strength = chargeLevel * 2;
    if (chargeLevel === 3 && player.isOnGround) {
        const windCharge = player.dimension.spawnEntity("minecraft:wind_charge_projectile", { x: player.location.x, y: player.location.y, z: player.location.z })
        windCharge.applyImpulse({ x: 0, y: -1.0, z: 0 })
    }
    system.runTimeout(() => {
        player.playSound("item.trident.riptide_1");
        if (chargeLevel === 3 && player.isOnGround) {
            player.applyKnockback(dashDirection.x, dashDirection.z, strength, 0.5)
        } else {
            const boostedStrength = chargeLevel === 3 ? strength + 1 : strength;
            player.applyKnockback(dashDirection.x, dashDirection.z, boostedStrength, 0.5);
        }
    }, 10);
}
/**
 * @param {Player} player 
 * @param {number} chargeLevel 
 */
function sonicBlast(player, chargeLevel) {
    const sonicDirection = player.getViewDirection();
    const sonicMaxRange = 30;
    const sonicDamage = chargeLevel === 1 ? 8 : chargeLevel === 2 ? 16 : 24;
    const sonicStepSize = 0.5;
    let sonicDistance = 2;
    let sonicImpactLoc = null;
    let lastParticleLoc = null;

    while (sonicDistance < sonicMaxRange) {
        const x = player.location.x + sonicDirection.x * sonicDistance;
        const y = player.location.y + 1.6 + sonicDirection.y * sonicDistance;
        const z = player.location.z + sonicDirection.z * sonicDistance;

        player.dimension.spawnParticle("minecraft:sonic_explosion", { x, y, z });
        lastParticleLoc = { x, y, z };

        const block = player.dimension.getBlock({
            x: Math.floor(x),
            y: Math.floor(y),
            z: Math.floor(z)
        });

        if (block && !block.isAir && !["minecraft:water", "minecraft:lava"].includes(block.typeId)) {
            sonicImpactLoc = { x, y, z };
            break;
        }

        const entities = player.dimension.getEntities({
            location: { x, y, z },
            maxDistance: 2,
            excludeTypes: ["minecraft:item", "minecraft:xp_orb"],
            excludeEntities: [player.id]
        });

        for (const entity of entities) {
            if (entity.hasComponent("minecraft:health") && entity.isValid() && entity.id !== player.id) {
                entity.applyDamage(sonicDamage, { cause: "magic" });
                sonicImpactLoc = { x, y, z };
                break;
            }
        }

        if (sonicImpactLoc) break;
        sonicDistance += sonicStepSize;
    }

    if (sonicImpactLoc) {
        if (chargeLevel === 3) {
            player.dimension.createExplosion(sonicImpactLoc, 5, { causesFire: false, breaksBlocks: true });
        }

        const knockbackRadius = 6;
        const knockbackStrength = chargeLevel === 1 ? 3 : chargeLevel * 2.4;
        const entities = player.dimension.getEntities({
            location: sonicImpactLoc,
            maxDistance: knockbackRadius,
            excludeTypes: ["minecraft:item", "minecraft:xp_orb"],
            excludeEntities: [player.id]
        });

        for (const entity of entities) {
            if (entity.hasComponent("minecraft:health") && entity.isValid() && entity.id !== player.id) {
                const dx = entity.location.x - sonicImpactLoc.x;
                const dz = entity.location.z - sonicImpactLoc.z;
                const distance = Math.sqrt(dx * dx + dz * dz);
                if (distance > 0) {
                    const knockbackX = (dx / distance) * knockbackStrength;
                    const knockbackZ = (dz / distance) * knockbackStrength;
                    entity.applyKnockback(knockbackX, knockbackZ, knockbackStrength, 0.5);
                }
            }
        }

        const dx = player.location.x - sonicImpactLoc.x;
        const dz = player.location.z - sonicImpactLoc.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        if (distance <= knockbackRadius && distance > 0) {
            const knockbackX = (dx / distance) * knockbackStrength;
            const knockbackZ = (dz / distance) * knockbackStrength;
            const verticalKnockback = player.isOnGround && sonicDirection.y < -0.2 ? chargeLevel * 0.5 : 0.5;
            player.applyKnockback(knockbackX, knockbackZ, knockbackStrength, verticalKnockback);
        }
    } else if (chargeLevel === 3 && lastParticleLoc) {
        player.dimension.createExplosion(lastParticleLoc, 5, { causesFire: false, breaksBlocks: true });
    }

    player.playSound("mob.warden.sonic_boom");
                    }

/**
 * 
 */
/** @type {SpellFunction[]} */
const SpellExitFunctions = [
    none,
    fangAttack,
    fangLine,
    minorHealing,
    woololo,
    fireball,
    windDash,
    sonicBlast
];

/**
 * @type {Map<string, SpellFunction>}
 */
const SpellExitFunctionsList = new Map();
for(const spellFunction of SpellExitFunctions) {
    SpellExitFunctionsList.set(spellFunction.name, spellFunction);
}

export { SpellExitFunctionsList };
