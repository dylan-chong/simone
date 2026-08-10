export class SimoneError extends Error {
    constructor(message) {
        super(message);
        this.name = 'SimoneError';
    }
}
export class SimoneAlreadyFailedError extends SimoneError {
    constructor() {
        super('A previous expectation already failed in this test. Check the earlier error for details.');
        this.name = 'SimoneAlreadyFailedError';
        this.stack = '';
    }
}
