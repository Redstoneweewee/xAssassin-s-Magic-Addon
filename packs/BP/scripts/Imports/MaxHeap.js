//Implement a max heap in Javascript
//Written by Zeeshan Ahmad (https://gist.github.com/zeeshan1112) and modified by Warden

/**
 * @typedef {object} PriorityItem
 * @property {number} priority - Determines the item's priority in the heap.
 * @property {number} id - Determines the item's priority in the heap.
 */

/**
 * Elements must be objects with a `priority` attribute
 */
class MaxHeap {
    /** @type {PriorityItem[]} */
    heap;
	/**
	 * Let’s build a max-heap now. Suppose we have nn elements in an array which represents our heap. For every node to be positioned in accordance with the max-heap property, we call the _maxHeapify method at every index of that array, starting from the bottom of the heap
     * @param {PriorityItem[]} [arr] 
	 */
	constructor(arr) {
        if(arr === undefined) { 
            this.heap = []; 
            return;
        }
		this.heap = arr;
		for (let i = this.heap.length - 1; i >= 0; i--) {
			this.#maxHeapify(i);
		}
	}
    /**
     * @param {PriorityItem} val 
     */
	insert(val) {
		//create a new child at the end of the heap
		this.heap.push(val);
		let index = this.heap.length - 1;
		this.#bubbleUp(index);
	}
	/**
	 * This function returns the maximum value in the heap which is the root, i.e., the first value in the array. It does not modify the heap itself. The time complexity of this function is in O(1) constant time.
	 */
	getMax() {
		if (this.heap.length != 0) return this.heap[0];
		return null;
	}

    /**
     * @param {number} id 
     * @returns {boolean}
     */
    removeById(id) {
        // Find the index of the item with the matching id
        let index = -1;
        for (let i = 0; i < this.heap.length; i++) {
            if (this.heap[i].id === id) {
                index = i;
                break;
            }
        }
        // If not found, return false
        if (index === -1) return false;
        
        // If it's the last element, simply remove it
        if (index === this.heap.length - 1) {
            this.heap.pop();
            return true;
        }
        
        // Replace the removed item with the last item in the heap
        const removedElement = this.heap.pop();
        if(removedElement === undefined) { return false; }
        this.heap[0] = removedElement;
        
        // Restore heap property
        // First try bubbling up (in case the new item is greater than its parent)
        this.#bubbleUp(index);
        
        // Then heapify (in case the new item is smaller than its children)
        // We only need to do this if bubbling up didn't happen
        if (index > 0 && this.heap[index].priority > this.heap[Math.floor((index - 1) / 2)].priority) {
            // If we bubbled up, we don't need to heapify
        } 
        else {
            this.#maxHeapify(index);
        }
        return true;
    }

	/**
	 * This function removes and returns the maximum value in the heap. The time complexity of this function is in O(log(n)) because that is the maximum number of nodes that would have to be traversed and/or swapped.
	 */
	removeMax() {
		if (this.heap.length > 1) {
			let max = this.heap[0];
			// move the last child node to root
            const removedElement = this.heap.pop();
            if(removedElement === undefined) { return null; }
			this.heap[0] = removedElement;
			this.#maxHeapify(0);
			return max;
		} else if (this.heap.length === 1) {
			return this.heap.pop();
		} else return null;
	}
	/**
	 * This function restores the heap property after a node is removed. It swaps the values of the parent nodes with the values of their largest child nodes until the heap property is restored. The time complexity of this function is in O(log(n)) because that is the maximum number of nodes that would have to be traversed and/or swapped.
	 */
	#maxHeapify(index) {
		while (true) {
			let leftChild = (index * 2) + 1;
			let rightChild = leftChild + 1;
			let largest = index;
			// if the leftChild exists & index value is less the left child, set the largest to leftChild
			if (this.heap.length > leftChild && this.heap[largest].priority < this.heap[leftChild].priority) largest = leftChild;
			// if the rightChild exists & index value is less the right child, set the largest to rightChild
			if (this.heap.length > rightChild && this.heap[largest].priority < this.heap[rightChild].priority) largest = rightChild;
			// if root/parent is not largest, then swap with the largest
			if (largest !== index) {
				let temp = this.heap[largest];
				this.heap[largest] = this.heap[index];
				this.heap[index] = temp;
				this.#maxHeapify(largest);
			} else break;
		}

	}
	/**
	 * This function restores heap property by swapping the value at a parent node if it is less than the value at a child node. The time complexity of this function is in O(log(n)) because that is the maximum number of nodes that would have to be traversed and/or swapped.
	 */
	#bubbleUp(index) {
		//Fetch the element that has to be moved
		const element = this.heap[index];
		while (index > 0) {
			// Find the parent element's index and fetch it
			let parentIndex = Math.floor((index - 1) / 2);
			let parent = this.heap[parentIndex];
			// if parent is lesser than child,then swap
			if (parent.priority <= element.priority) {
				this.heap[parentIndex] = element;
				this.heap[index] = parent;
				index = parentIndex;
			} else break;
		}
	}
}

export { MaxHeap };