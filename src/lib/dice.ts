export class Roll {
    result: number;
    timestamp: string;
    constructor(result: number) {
        this.result = result;
        this.timestamp = Date.now().toString();
    }
}