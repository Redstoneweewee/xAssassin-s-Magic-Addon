
import { Player, system } from "@minecraft/server";
import { MaxHeap } from "../Imports/MaxHeap";
import { DisplayTypes, ScreenDisplay } from "./ScreenDisplayDef";
import { PlayerUtil } from "../Utilities";


class PlayerState {
    /**
     * 
     * @param {string} name 
     * @param {boolean} canCastSpells 
     * @param {boolean} canChangeSpells 
     */
    constructor(name, canCastSpells, canChangeSpells) {
        this.name = name;
        this.canCastSpells = canCastSpells;
        this.canChangeSpells = canChangeSpells;
    }
}


/**
 * @typedef {object} PlayerStatesDef
 * @property {PlayerState} Default
 * @property {PlayerState} CanCastSpells
 * @property {PlayerState} CanChangeSpells
 */
const PlayerStates = {
    Default: new PlayerState("Default", false, false),
    CanCastSpells: new PlayerState("CanCastSpells", true, false),
    CanChangeSpells: new PlayerState("CanChangeSpells", false, true),
}

class PlayerObject {
    static #displayId = 0;

    /** @type {Map<number, MaxHeap>} */
    #titleQueues = new Map();
    /** @type {Map<number, MaxHeap>} */
    #actionbarQueues = new Map();
    #spellChargeStartTime = 0;
    playerState = PlayerStates.Default;
    isCanCastSpells = false;
    /** @type {number|undefined} */
    spellChargeRunId = undefined;

    /**
     * @param {Player} player 
     */
    constructor(player) {
        this.player = player;
        this.id = player.id;
        this.#runAllPlayerLoops();
    }

    startCountingSpellChargeTime() {
        this.#spellChargeStartTime = system.currentTick;
    }

    /**
     * @returns {number} the time elapsed since the previous startCountingSpellChargeTime()
     */
    returnSpellChargeTime() {
        return system.currentTick - this.#spellChargeStartTime;
    }

    /**
     * Queues a display message for the next tick, but will be overridden by another with higher priority.
     * @param {string} displayText 
     * @param {number} priority higher number = higher priority
     * @param {number} timeout the number of ticks to wait until this message possibly gets displayed. The actual timeout is timeout + 1 because a 1-tick delay is necessary.
     * @returns {number} the `displayId` of the display. Used to remove the display if necessary
     */
    queueActionbarDisplay(displayText, priority, timeout = 0) {
        const displayId = PlayerObject.#displayId;
        const displayOnTick = system.currentTick + timeout + 1;
        const screenDisplayObject = new ScreenDisplay(displayId, DisplayTypes.Actionbar, displayText, priority, displayOnTick);
        if(this.#actionbarQueues.has(displayOnTick)) 
            this.#actionbarQueues.get(displayOnTick)?.insert(screenDisplayObject);
        else this.#actionbarQueues.set(displayOnTick, new MaxHeap([screenDisplayObject]));
        PlayerObject.#displayId++;
        return displayId;
    }

    /**
     * Queues a display message for the next tick, but will be overridden by another with higher priority.
     * @param {string} displayText 
     * @param {number} priority higher number = higher priority
     * @param {number} timeout the number of ticks to wait until this message possibly gets displayed
     * @returns {number} the `displayId` of the display. Used to remove the display if necessary
     */
    queueTitleDisplay(displayText, priority, timeout = 0) {
        const displayId = PlayerObject.#displayId;
        const displayOnTick = system.currentTick + timeout;
        const screenDisplayObject = new ScreenDisplay(displayId, DisplayTypes.Title, displayText, priority, displayOnTick);
        if(this.#titleQueues.has(displayOnTick)) 
            this.#titleQueues.get(displayOnTick)?.insert(screenDisplayObject);
        else this.#titleQueues.set(displayOnTick, new MaxHeap([screenDisplayObject]));
        PlayerObject.#displayId++;
        return displayId;
    }

    /**
     * @param {number} displayId 
     */
    removeDisplay(displayId) {
        for(const [key, heap] of this.#titleQueues) {
            if(heap.removeById(displayId)) return;
        }
        for(const [key, heap] of this.#actionbarQueues) {
            if(heap.removeById(displayId)) return;
        }
    }

    /**
     * 
     * @param {string} [type] can be `DisplayTypes.Actionbar`, `DisplayTypes.Title`, or both if no argument is passed.
     */
    clearDisplay(type) {
        if(type === undefined) {
            this.#titleQueues.clear();
            this.#actionbarQueues.clear();
            return;
        }
        if(type === DisplayTypes.Title) {
            this.#titleQueues.clear();
        }
        else {
            this.#actionbarQueues.clear();
        }
    }

    
    #runAllPlayerLoops() {
        const runId = system.runInterval(() => {
            if(!this.player.isValid()) {
                system.clearRun(runId);
            }

            this.#detectDisplay();
            this.#alterPlayerState();
        });
    }

    #detectDisplay() {
        const maxHeapActionbar = this.#actionbarQueues.get(system.currentTick);
        if(maxHeapActionbar !== undefined) {
            if(maxHeapActionbar.getMax() !== null) {
                const displayText = ScreenDisplay.convertToScreenDisplay(maxHeapActionbar.getMax()).displayText;
                this.player.onScreenDisplay.setActionBar(displayText);
            }
            this.#actionbarQueues.delete(system.currentTick);
        }

        const maxHeapTitle = this.#titleQueues.get(system.currentTick);
        if(maxHeapTitle !== undefined) {
            if(maxHeapTitle.getMax() !== null) {
                const displayText = ScreenDisplay.convertToScreenDisplay(maxHeapTitle.getMax()).displayText;
                this.player.onScreenDisplay.setTitle(displayText);
            }
            this.#titleQueues.delete(system.currentTick);
        }
    }
    
    #alterPlayerState() {
        //very rudimentary state machine
        if(this.playerState === PlayerStates.Default) {
            if((PlayerUtil.holdingSpellBookOffhand(this.player) && PlayerUtil.holdingStaffMainhand(this.player)) && this.player.isSneaking) {
                this.playerState = PlayerStates.CanChangeSpells;
            }
            else if(PlayerUtil.holdingSpellBookOffhand(this.player) && PlayerUtil.holdingStaffMainhand(this.player)) {
                this.playerState = PlayerStates.CanCastSpells;
            }
        }

        else if(this.playerState === PlayerStates.CanChangeSpells) {
            if((PlayerUtil.holdingSpellBookOffhand(this.player) && PlayerUtil.holdingStaffMainhand(this.player)) && !this.player.isSneaking) {
                this.playerState = PlayerStates.CanCastSpells;
            }
            if(!(PlayerUtil.holdingSpellBookOffhand(this.player) && PlayerUtil.holdingStaffMainhand(this.player)) || !this.player.isSneaking) {
                this.playerState = PlayerStates.Default;
            }
        }

        else if(this.playerState === PlayerStates.CanCastSpells) {
            if(this.player.isSneaking) {
                this.playerState = PlayerStates.CanChangeSpells;
            }
            if(!(PlayerUtil.holdingSpellBookOffhand(this.player) && PlayerUtil.holdingStaffMainhand(this.player))) {
                this.playerState = PlayerStates.Default;
            }
        }
    }
}

export { PlayerObject, PlayerStates }