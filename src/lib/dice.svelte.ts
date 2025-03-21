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
	minRoll = $state(1);
	lastRoll = $state<Roll | null>(null);
	locked = $state(false);

	constructor(initialMaxRoll: number = 6) {
		this.maxRoll = initialMaxRoll;
	}

	setMaxRoll(newMaxRoll: number) {
		this.maxRoll = newMaxRoll;
	}

	setLastRoll(roll: Roll) {
		this.lastRoll = roll;
	}

	reset(initialMaxRoll: number = 6) {
		this.locked = false;
		this.lastRoll = null;
		this.maxRoll = initialMaxRoll;
	}
}
