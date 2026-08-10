import { afterEach } from 'vitest';
import { verifyAll, resetAll } from '../index.js';
afterEach(() => {
    try {
        verifyAll();
    }
    finally {
        resetAll();
    }
});
