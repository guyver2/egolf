export class Roll {
    result: number;
    timestamp: string;
    constructor(result: number) {
        this.result = result;
        this.timestamp = Date.now().toString();
    }
}

export class Dice {
    maxRoll = $state(6);
    lastRoll = $state<Roll | null>(null);

    constructor(initialMaxRoll: number = 6) {
        this.maxRoll = initialMaxRoll;
    }

    setMaxRoll(newMaxRoll: number) {
        this.maxRoll = newMaxRoll;
    }
    
    setLastRoll(roll: Roll) {
        this.lastRoll = roll;
    }
}