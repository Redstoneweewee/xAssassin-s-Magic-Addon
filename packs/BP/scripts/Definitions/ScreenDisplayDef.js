
import { system } from "@minecraft/server";
/**
 * @typedef {object} DisplayTypesDef
 * @property {string} Title
 * @property {string} Actionbar
 */

/** @type {DisplayTypesDef} */
const DisplayTypes = {
    Title: "Title",
    Actionbar: "Actionbar"
}
/**
 * 
 */
class ScreenDisplay {
    /**
     * @param {number} id the `displayId` of the display
     * @param {string} type can either be `DisplayTypes.Actionbar` or `DisplayTypes.Title`
     * @param {string} displayText 
     * @param {number} priority higher number = higher priority
     * @param {number} displayOnTick the system tick that this message will play on. Is constructed by `system.currentTick + timeout`
     */
    constructor(id, type, displayText, priority, displayOnTick = system.currentTick+1) {
        this.id = id;
        this.type = type;
        this.displayText = displayText;
        this.priority = priority;
        this.displayOnTick = displayOnTick;
    }

    static convertToScreenDisplay(priorityItem) {
        return new ScreenDisplay(priorityItem.id, priorityItem.type, priorityItem.displayText, priorityItem.priority, priorityItem.displayOnTIck);
    }
}

export { ScreenDisplay, DisplayTypes }