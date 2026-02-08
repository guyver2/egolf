export class Roll {
  result: number
  timestamp: number

  constructor(result: number) {
    this.result = result
    this.timestamp = Date.now()
  }
}

export class Dice {
  maxRoll: number
  lastRoll: Roll | null
  locked: boolean

  constructor(initialMaxRoll: number = 6) {
    this.maxRoll = initialMaxRoll
    this.lastRoll = null
    this.locked = false
  }

  setMaxRoll(newMaxRoll: number): void {
    this.maxRoll = newMaxRoll
  }

  roll(): Roll {
    const result = Math.floor(Math.random() * this.maxRoll) + 1
    this.lastRoll = new Roll(result)
    this.locked = true
    return this.lastRoll
  }

  putt(): Roll {
    this.lastRoll = new Roll(1)
    this.locked = true
    return this.lastRoll
  }

  unlock(): void {
    this.locked = false
  }

  reset(initialMaxRoll: number = 6): void {
    this.locked = false
    this.lastRoll = null
    this.maxRoll = initialMaxRoll
  }
}
