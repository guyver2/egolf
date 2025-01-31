import { writable } from 'svelte/store';

export class Roll {
    result: number;
    timestamp: string;
    constructor(result: number) {
        this.result = result;
        this.timestamp = Date.now().toString();
    }
}

export class Dice {
    private store;

    constructor(maxRoll: number = 6) {
        this.store = writable({
            maxRoll,
            lastRoll: null as Roll | null
        });
    }

    get subscribe() {
        return this.store.subscribe;
    }

    setMaxRoll(maxRoll: number) {
        this.store.update(state => ({ ...state, maxRoll }));
    }
    
    setLastRoll(roll: Roll) {
        this.store.update(state => ({ ...state, lastRoll: roll }));
    }

    get maxRoll() {
        let value;
        this.store.subscribe(state => value = state.maxRoll)();
        return value;
    }

    get lastRoll() {
        let value;
        this.store.subscribe(state => value = state.lastRoll)();
        return value;
    }
}