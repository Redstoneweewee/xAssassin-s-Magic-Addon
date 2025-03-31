import { world, system, ItemStack } from "@minecraft/server";

world.afterEvents.itemCompleteUse.subscribe((event) => {
    if (event.itemStack?.typeId === "a:sculk_vial") {
        const player = event.source;
        player.addEffect("blindness", 400, { amplifier: 1 });
        player.addEffect("nausea", 200, { amplifier: 1 });

        player.playSound("ominous_bottle.end_use", player.location);
        player.playSound("mob.wanderingtrader.drink_potion", player.location);

        let xpAtCurrentLevel = player.xpEarnedAtCurrentLevel;
        let currentLevel = player.level;

        if (xpAtCurrentLevel >= 10) {
            player.addExperience(-10);
            const pos = player.location;

            if (player.getTotalXp() >= 30) {
                const experienceBottle = new ItemStack("minecraft:experience_bottle");
                system.run(() => {
                    player.dimension.spawnItem(experienceBottle, pos);
                });
            }
        } else {
            player.addLevels(-1);
            const totalXpNeededForNextLevel = player.totalXpNeededForNextLevel;
            player.addExperience(totalXpNeededForNextLevel - 10);

            if (player.getTotalXp() >= 5) {
                const pos = player.location;
                const experienceBottle = new ItemStack("minecraft:experience_bottle");
                system.run(() => {
                    player.dimension.spawnItem(experienceBottle, pos);
                });
            }
        }
    }
});


world.afterEvents.itemCompleteUse.subscribe((event) => {
    if (event.itemStack?.typeId === "xassassin:ink_well") {
        const player = event.source;
        event.source.addEffect("poison", 300, { amplifier: 1 });
        event.source.addEffect("nausea", 300, { amplifier: 1 });
        player.playSound("mob.wanderingtrader.drink_potion", player.location);
    }
});

world.afterEvents.itemCompleteUse.subscribe((event) => {
    if (event.itemStack?.typeId === "xassassin:resonance_ink_well") {
        const player = event.source;
        player.addEffect("poison", 300, { amplifier: 1 });
        player.addEffect("darkness", 300, { amplifier: 1 });
        player.playSound("mob.wanderingtrader.drink_potion", player.location);
    }
});

world.afterEvents.itemCompleteUse.subscribe((event) => {
    if (event.itemStack?.typeId === "xassassin:glow_ink_well") {
        const player = event.source;
        player.addEffect("poison", 300, { amplifier: 2 });
        player.addEffect("nausea", 300, { amplifier: 1 });
        player.playSound("mob.wanderingtrader.drink_potion", player.location);
    }
});