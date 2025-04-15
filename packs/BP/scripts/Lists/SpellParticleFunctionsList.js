import { EntityColorComponent, EntityComponentTypes, MolangVariableMap, Player, system } from "@minecraft/server";
import { PlayerUtil, SpellUtil } from "../Utilities";

/**
 * @typedef {((player: Player, chargeLevel: number) => void)} SpellParticleFunction
 */

function none() {}

/**
 * @param {Player} player 
 * @param {number} chargeLevel 
 */
function sonicBlast(player, chargeLevel) {
    const particleType = "xassassin:spell_aura";
    let auraVariables = new MolangVariableMap();
    const colorCycleSpeed = 0.1;
    const timeOffset = system.currentTick * colorCycleSpeed;
    const phase = (Math.sin(timeOffset) + 1) / 2;
    const brightBlue = { r: 0.0, g: 0.7, b: 1.0 };
    const brightTeal = { r: 0.0, g: 1.0, b: 0.8 };
    const auraR = brightBlue.r + (brightTeal.r - brightBlue.r) * phase;
    const auraG = brightBlue.g + (brightTeal.g - brightBlue.g) * phase;
    const auraB = brightBlue.b + (brightTeal.b - brightBlue.b) * phase;

    try {
        auraVariables.setColorRGBA("variable.color", { red: auraR, green: auraG, blue: auraB, alpha: 1.0 });
    } catch (e) {
        player.sendMessage(`Error setting aura particle color: ${e.message}`);
        auraVariables.setColorRGBA("variable.color", { red: 1.0, green: 1.0, blue: 1.0, alpha: 1.0 });
    }

    player.dimension.spawnParticle(particleType, { x: player.location.x, y: player.location.y, z: player.location.z }, auraVariables);

    const trailRadius = 1.3;
    const trailHeight = 2.3;
    const trailType = "xassassin:spell_trail";
    const angleStep = 0.3;

    if (!player.hasOwnProperty("trailAngle")) player.trailAngle = 0;
    player.trailAngle += angleStep;
    if (player.trailAngle >= 2 * Math.PI) player.trailAngle -= 2 * Math.PI;
    const angle = player.trailAngle;

    const x = player.location.x + trailRadius * Math.cos(angle);
    const z = player.location.z + trailRadius * Math.sin(angle);
    const y = player.location.y + trailHeight;

    let trailVariables = new MolangVariableMap();
    const trailR = brightBlue.r + (brightTeal.r - brightBlue.r) * phase;
    const trailG = brightBlue.g + (brightTeal.g - brightBlue.g) * phase;
    const trailB = brightBlue.b + (brightTeal.b - brightBlue.b) * phase;

    try {
        trailVariables.setColorRGBA("variable.color", { red: trailR, green: trailG, blue: trailB, alpha: 1.0 });
    } catch (e) {
        player.sendMessage(`Error setting trail particle color: ${e.message}`);
        trailVariables.setColorRGBA("variable.color", { red: 1.0, green: 1.0, blue: 1.0, alpha: 1.0 });
    }

    player.dimension.spawnParticle(trailType, { x, y, z }, trailVariables);
}

/**
 * @param {Player} player 
 * @param {number} chargeLevel 
 */
function fireball(player, chargeLevel) {
    let particleCount, radius, yOffset;
    particleCount = 4 + chargeLevel * 2;
    radius = 0.8;
    yOffset = 0;
    const baseY = player.location.y + yOffset;
    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const r = radius * Math.sqrt(Math.random());
        const x = player.location.x + r * Math.cos(angle);
        const z = player.location.z + r * Math.sin(angle);
        const y = baseY + Math.random() * 1.7;
        let particleVariables = new MolangVariableMap();
        if (chargeLevel === 4) {
            const purpleShade = 0.7 + Math.random() * 0.2;
            const greenShade = Math.random() * 0.2;
            particleVariables.setColorRGBA("variable.color", { red: purpleShade, green: greenShade, blue: 1.0, alpha: 1.0 });
            player.dimension.spawnParticle("minecraft:colored_flame_particle", { x: x + (Math.random() - 0.5) * 0.15, y: y + (Math.random() - 0.5) * 0.1, z: z + (Math.random() - 0.5) * 0.15 }, particleVariables);
        } else {
            player.dimension.spawnParticle("minecraft:basic_flame_particle", { x: x + (Math.random() - 0.5) * 0.15, y: y + (Math.random() - 0.5) * 0.1, z: z + (Math.random() - 0.5) * 0.15 }, particleVariables);
        }
    }
    if (chargeLevel > 0) {
        const ringParticleCount = chargeLevel;
        const ringRadius = 1.2;
        const angleStep = (2 * Math.PI) / ringParticleCount;
        for (let i = 0; i < ringParticleCount; i++) {
            const angle = i * angleStep + (system.currentTick * 0.05);
            const x = player.location.x + ringRadius * Math.cos(angle);
            const z = player.location.z + ringRadius * Math.sin(angle);
            const y = baseY + 1;
            let particleVariables = new MolangVariableMap();
            if (chargeLevel === 4) {
                const purpleShade = 0.7 + Math.random() * 0.2;
                const greenShade = Math.random() * 0.2;
                particleVariables.setColorRGBA("variable.color", { red: purpleShade, green: greenShade, blue: 1.0, alpha: 1.0 });
                player.dimension.spawnParticle("minecraft:colored_flame_particle", { x, y, z }, particleVariables);
            } else {
                player.dimension.spawnParticle("minecraft:basic_flame_particle", { x, y, z }, particleVariables);
            }
        }
    }
    if (system.currentTick % 4 === 0) {
        const timeOffset = system.currentTick * 0.05;
        const phase = (Math.sin(timeOffset) + 1) / 2;
        let auraVariables = new MolangVariableMap();
        if (chargeLevel === 4) {
            const purpleShade = 0.7 + phase * 0.2;
            const greenShade = phase * 0.2;
            try {
                auraVariables.setColorRGBA("variable.color", { red: purpleShade, green: greenShade, blue: 1.0, alpha: 1.0 });
            } catch (e) {
                player.sendMessage(`Error setting aura particle color: ${e.message}`);
                auraVariables.setColorRGBA("variable.color", { red: 1.0, green: 1.0, blue: 1.0, alpha: 1.0 });
            }
        } else {
            const colors = [{ r: 1.0, g: 0.4, b: 0.0 }, { r: 1.0, g: 0.6, b: 0.0 }, { r: 1.0, g: 0.8, b: 0.0 }, { r: 1.5263157894736843, g: 1.0, b: 0.0 }];
            const colorIndex = phase * (colors.length - 1);
            const lowerIndex = Math.floor(colorIndex);
            const upperIndex = Math.min(lowerIndex + 1, colors.length - 1);
            const blendFactor = colorIndex - lowerIndex;
            const lowerColor = colors[lowerIndex];
            const upperColor = colors[upperIndex];
            const r = lowerColor.r + (upperColor.r - lowerColor.r) * blendFactor;
            const g = lowerColor.g + (upperColor.g - lowerColor.g) * blendFactor;
            const b = lowerColor.b + (upperColor.b - lowerColor.b) * blendFactor;
            try {
                auraVariables.setColorRGBA("variable.color", { red: r, green: g, blue: b, alpha: 1.0 });
            } catch (e) {
                player.sendMessage(`Error setting aura particle color: ${e.message}`);
                auraVariables.setColorRGBA("variable.color", { red: 1.0, green: 1.0, blue: 1.0, alpha: 1.0 });
            }
        }
        player.dimension.spawnParticle("xassassin:spell_aura", { x: player.location.x, y: baseY, z: player.location.z }, auraVariables);
    }
}

/**
 * @param {Player} player 
 * @param {number} chargeLevel 
 */
function woololo(player, chargeLevel) {
    let particleCount, radius, particleType;
    radius = chargeLevel === 0 ? 0 : chargeLevel === 1 ? 3 : chargeLevel === 2 ? 8 : 12;
    particleCount = chargeLevel === 0 ? 0 : chargeLevel === 1 ? 12 : chargeLevel === 2 ? 20 : 28;
    particleType = "minecraft:villager_happy";
    if (radius === 0) return;
    const angleStepRing = (2 * Math.PI) / particleCount;
    for (let i = 0; i < particleCount; i++) {
        const angle = i * angleStepRing;
        const x = player.location.x + radius * Math.cos(angle);
        const z = player.location.z + radius * Math.sin(angle);
        const spawnY = SpellUtil.getSpawnY(player.dimension, x, z, Math.floor(player.location.y), true);
        if (spawnY !== null) {
            player.dimension.spawnParticle(particleType, { x, y: spawnY + 0.5, z }, new MolangVariableMap());
        }
    }
    particleType = "xassassin:spell_aura";
    let auraVariables = new MolangVariableMap();
    const colorCycleSpeed = 0.05;
    const timeOffset = system.currentTick * colorCycleSpeed;
    const phase = timeOffset;
    const blendFactor = (Math.sin(phase) + 1) / 2;
    const greenTurquoise = { r: 0.2, g: 0.95, b: 0.7 };
    const cyan = { r: 0.0, g: 1.0, b: 1.0 };
    const auraR = greenTurquoise.r + (cyan.r - greenTurquoise.r) * blendFactor;
    const auraG = greenTurquoise.g + (cyan.g - greenTurquoise.g) * blendFactor;
    const auraB = greenTurquoise.b + (cyan.b - greenTurquoise.b) * blendFactor;
    try {
        auraVariables.setColorRGBA("variable.color", { red: auraR, green: auraG, blue: auraB, alpha: 1.0 });
    } catch (e) {
        player.sendMessage(`Error setting aura particle color: ${e.message}`);
        auraVariables.setColorRGBA("variable.color", { red: 1.0, green: 1.0, blue: 1.0, alpha: 1.0 });
    }
    player.dimension.spawnParticle(particleType, { x: player.location.x, y: player.location.y, z: player.location.z }, auraVariables);
    const trailRadius = 1.3;
    const trailHeight = 2.3;
    const trailType = "xassassin:spell_trail";
    const angleStep = 0.3;
    if (!player.hasOwnProperty("trailAngle")) {
        player.trailAngle = 0;
    }
    player.trailAngle += angleStep;
    if (player.trailAngle >= 2 * Math.PI) {
        player.trailAngle -= 2 * Math.PI;
    }
    const angle = player.trailAngle;
    const x = player.location.x + trailRadius * Math.cos(angle);
    const z = player.location.z + trailRadius * Math.sin(angle);
    const y = player.location.y + trailHeight;
    let trailVariables = new MolangVariableMap();
    const trailR = greenTurquoise.r + (cyan.r - greenTurquoise.r) * blendFactor;
    const trailG = greenTurquoise.g + (cyan.g - greenTurquoise.g) * blendFactor;
    const trailB = greenTurquoise.b + (cyan.b - greenTurquoise.b) * blendFactor;
    try {
        trailVariables.setColorRGBA("variable.color", { red: trailR, green: trailG, blue: trailB, alpha: 1.0 });
    } catch (e) {
        player.sendMessage(`Error setting trail particle color: ${e.message}`);
        trailVariables.setColorRGBA("variable.color", { red: 1.0, green: 1.0, blue: 1.0, alpha: 1.0 });
    }
    player.dimension.spawnParticle(trailType, { x, y, z }, trailVariables);
}

/**
 * @param {Player} player 
 * @param {number} chargeLevel 
 */
function windDash(player, chargeLevel) {
    let particleType;
    particleType = "xassassin:spell_aura";
    let auraVariables = new MolangVariableMap();
    const colorCycleSpeed = 0.1;
    const timeOffset = system.currentTick * colorCycleSpeed;
    const phase = (Math.sin(timeOffset) + 1) / 2;
    const lightBlue = { r: 0.68, g: 0.85, b: 0.9 };
    const grey = { r: 0.75, g: 0.75, b: 0.75 };
    const white = { r: 1.0, g: 1.0, b: 1.0 };
    let auraR, auraG, auraB;
    if (phase < 0.5) {
        const blendFactor = phase * 2;
        auraR = lightBlue.r + (grey.r - lightBlue.r) * blendFactor;
        auraG = lightBlue.g + (grey.g - lightBlue.g) * blendFactor;
        auraB = lightBlue.b + (grey.b - lightBlue.b) * blendFactor;
    } else {
        const blendFactor = (phase - 0.5) * 2;
        auraR = grey.r + (white.r - grey.r) * blendFactor;
        auraG = grey.g + (white.g - grey.g) * blendFactor;
        auraB = grey.b + (white.b - grey.b) * blendFactor;
    }
    try {
        auraVariables.setColorRGBA("variable.color", { red: auraR, green: auraG, blue: auraB, alpha: 1.0 });
    } catch (e) {
        player.sendMessage(`Error setting aura particle color: ${e.message}`);
        auraVariables.setColorRGBA("variable.color", { red: 1.0, green: 1.0, blue: 1.0, alpha: 1.0 });
    }
    player.dimension.spawnParticle(particleType, { x: player.location.x, y: player.location.y, z: player.location.z }, auraVariables);
    const trailRadius = 1.3;
    const trailHeight = 2.3;
    const trailType = "xassassin:spell_trail";
    const angleStep = 0.3;
    if (!player.hasOwnProperty("trailAngle")) {
        player.trailAngle = 0;
    }
    player.trailAngle += angleStep;
    if (player.trailAngle >= 2 * Math.PI) {
        player.trailAngle -= 2 * Math.PI;
    }
    const angle = player.trailAngle;
    const x = player.location.x + trailRadius * Math.cos(angle);
    const z = player.location.z + trailRadius * Math.sin(angle);
    const y = player.location.y + trailHeight;
    let trailVariables = new MolangVariableMap();
    let trailR, trailG, trailB;
    if (phase < 0.5) {
        const blendFactor = phase * 2;
        trailR = lightBlue.r + (grey.r - lightBlue.r) * blendFactor;
        trailG = lightBlue.g + (grey.g - lightBlue.g) * blendFactor;
        trailB = lightBlue.b + (grey.b - lightBlue.b) * blendFactor;
    } else {
        const blendFactor = (phase - 0.5) * 2;
        trailR = grey.r + (white.r - grey.r) * blendFactor;
        trailG = grey.g + (white.g - grey.g) * blendFactor;
        trailB = grey.b + (white.b - grey.b) * blendFactor;
    }
    try {
        trailVariables.setColorRGBA("variable.color", { red: trailR, green: trailG, blue: trailB, alpha: 1.0 });
    } catch (e) {
        player.sendMessage(`Error setting trail particle color: ${e.message}`);
        trailVariables.setColorRGBA("variable.color", { red: 1.0, green: 1.0, blue: 1.0, alpha: 1.0 });
    }
    player.dimension.spawnParticle(trailType, { x, y, z }, trailVariables);
}

/**
 * @param {Player} player 
 * @param {number} chargeLevel 
 */
function fangAttack(player, chargeLevel) {
    let particleType;
    for (let ring = 0; ring < chargeLevel; ring++) {
        const radius = 3 + ring * 2;
        const fangCount = 8 + (ring === 1 ? 2 : ring === 2 ? 4 : 0);
        const angleStep = (2 * Math.PI) / fangCount;
        for (let i = 0; i < fangCount; i++) {
            const angle = i * angleStep;
            const x = player.location.x + radius * Math.cos(angle);
            const z = player.location.z + radius * Math.sin(angle);
            const spawnY = SpellUtil.getSpawnY(player.dimension, x, z, Math.floor(player.location.y), true);
            if (spawnY !== null) {
                player.dimension.spawnParticle("xassassin:spell_assist", { x, y: spawnY + 0.5, z }, new MolangVariableMap());
            }
        }
    }
    particleType = "xassassin:spell_aura";
    let auraVariables = new MolangVariableMap();
    const auraCycleSpeed = 0.08;
    const auraTimeOffset = system.currentTick * auraCycleSpeed;
    const auraPhase = auraTimeOffset;
    const auraR = (Math.sin(auraPhase) + 1) / 2;
    const auraG = (Math.sin(auraPhase + 2 * Math.PI / 3) + 1) / 2;
    const auraB = (Math.sin(auraPhase + 4 * Math.PI / 3) + 1) / 2;
    try {
        auraVariables.setColorRGBA("variable.color", { red: auraR, green: auraG, blue: auraB, alpha: 1.0 });
    } catch (e) {
        player.sendMessage(`Error setting aura particle color: ${e.message}`);
        auraVariables.setColorRGBA("variable.color", { red: 1.0, green: 1.0, blue: 1.0, alpha: 1.0 });
    }
    player.dimension.spawnParticle(particleType, { x: player.location.x, y: player.location.y, z: player.location.z }, auraVariables);
    const trailRadius = 1.3;
    const trailHeight = 2.3;
    const trailType = "xassassin:spell_trail";
    const angleStepTrail = 0.3;
    const colorCycleSpeed = 0.05;
    if (!player.hasOwnProperty("trailAngle")) {
        player.trailAngle = 0;
    }
    player.trailAngle += angleStepTrail;
    if (player.trailAngle >= 2 * Math.PI) {
        player.trailAngle -= 2 * Math.PI;
    }
    const timeOffset = system.currentTick * colorCycleSpeed;
    const angle = player.trailAngle;
    const x = player.location.x + trailRadius * Math.cos(angle);
    const z = player.location.z + trailRadius * Math.sin(angle);
    const y = player.location.y + trailHeight;
    let trailVariables = new MolangVariableMap();
    const phase = timeOffset;
    const r = (Math.sin(phase) + 1) / 2;
    const g = (Math.sin(phase + 2 * Math.PI / 3) + 1) / 2;
    const b = (Math.sin(phase + 4 * Math.PI / 3) + 1) / 2;
    try {
        trailVariables.setColorRGBA("variable.color", { red: r, green: g, blue: b, alpha: 1.0 });
    } catch (e) {
        player.sendMessage(`Error setting trail particle color: ${e.message}`);
        trailVariables.setColorRGBA("variable.color", { red: 1.0, green: 1.0, blue: 1.0, alpha: 1.0 });
    }
    player.dimension.spawnParticle(trailType, { x, y, z }, trailVariables);
}

/**
 * @param {Player} player 
 * @param {number} chargeLevel 
 */
function fangLine(player, chargeLevel) {
    let particleType;
    const direction = player.getViewDirection();
    const horizontalMagnitude = Math.sqrt(direction.x * direction.x + direction.z * direction.z);
    const horizontalDirection = { x: horizontalMagnitude > 0 ? direction.x / horizontalMagnitude : 0, z: horizontalMagnitude > 0 ? direction.z / horizontalMagnitude : 0 };
    const fangCount = 8;
    const startDistance = 1.5;
    const stepSize = 2.0;
    const lineCount = chargeLevel;
    const perpX = -horizontalDirection.z;
    const perpZ = horizontalDirection.x;
    for (let line = 0; line < lineCount; line++) {
        const offset = (line - (lineCount - 1) / 2) * 2.0;
        for (let i = 0; i < fangCount; i++) {
            const distance = startDistance + i * stepSize;
            const x = player.location.x + horizontalDirection.x * distance + perpX * offset;
            const z = player.location.z + horizontalDirection.z * distance + perpZ * offset;
            const spawnY = SpellUtil.getSpawnY(player.dimension, x, z, Math.floor(player.location.y), true);
            if (spawnY !== null) {
                player.dimension.spawnParticle("xassassin:spell_assist", { x, y: spawnY + 0.5, z }, new MolangVariableMap());
            }
        }
    }
    particleType = "xassassin:spell_aura";
    let auraVariables = new MolangVariableMap();
    const auraCycleSpeed = 0.08;
    const auraTimeOffset = system.currentTick * auraCycleSpeed;
    const auraPhase = auraTimeOffset;
    const auraR = (Math.sin(auraPhase) + 1) / 2;
    const auraG = (Math.sin(auraPhase + 2 * Math.PI / 3) + 1) / 2;
    const auraB = (Math.sin(auraPhase + 4 * Math.PI / 3) + 1) / 2;
    try {
        auraVariables.setColorRGBA("variable.color", { red: auraR, green: auraG, blue: auraB, alpha: 1.0 });
    } catch (e) {
        player.sendMessage(`Error setting aura particle color: ${e.message}`);
        auraVariables.setColorRGBA("variable.color", { red: 1.0, green: 1.0, blue: 1.0, alpha: 1.0 });
    }
    player.dimension.spawnParticle(particleType, { x: player.location.x, y: player.location.y, z: player.location.z }, auraVariables);
    const trailRadius = 1.3;
    const trailHeight = 2.3;
    const trailType = "xassassin:spell_trail";
    const angleStep = 0.3;
    const colorCycleSpeed = 0.05;
    if (!player.hasOwnProperty("trailAngle")) {
        player.trailAngle = 0;
    }
    player.trailAngle += angleStep;
    if (player.trailAngle >= 2 * Math.PI) {
        player.trailAngle -= 2 * Math.PI;
    }
    const timeOffset = system.currentTick * colorCycleSpeed;
    const angle = player.trailAngle;
    const x = player.location.x + trailRadius * Math.cos(angle);
    const z = player.location.z + trailRadius * Math.sin(angle);
    const y = player.location.y + trailHeight;
    let trailVariables = new MolangVariableMap();
    const phase = timeOffset;
    const r = (Math.sin(phase) + 1) / 2;
    const g = (Math.sin(phase + 2 * Math.PI / 3) + 1) / 2;
    const b = (Math.sin(phase + 4 * Math.PI / 3) + 1) / 2;
    try {
        trailVariables.setColorRGBA("variable.color", { red: r, green: g, blue: b, alpha: 1.0 });
    } catch (e) {
        player.sendMessage(`Error setting trail particle color: ${e.message}`);
        trailVariables.setColorRGBA("variable.color", { red: 1.0, green: 1.0, blue: 1.0, alpha: 1.0 });
    }
    player.dimension.spawnParticle(trailType, { x, y, z }, trailVariables);
}

/**
 * 
 */
/** @type {SpellParticleFunction[]} */
const SpellParticleFunctions = [
    none,
    fangAttack,
    fangLine,
    woololo,
    fireball,
    windDash,
    sonicBlast
]

/**
 * @type {Map<string, SpellParticleFunction>}
 */
const SpellParticleFunctionsList = new Map();
for(const spellFunction of SpellParticleFunctions) {
    SpellParticleFunctionsList.set(spellFunction.name, spellFunction);
}

export { SpellParticleFunctionsList };
