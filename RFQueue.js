// Version 1.0 4/15/2026
//
// RFQueue.js added with 433Mhz accessories version 2.0
// This singleton ensures only one RF command is sent at a time.
// Queues the rest.
//
class RFQueue {
    constructor() {
        this.queue = Promise.resolve();
    }

    /**
     * Adds an RF command to the queue.
     * @param {string} url - The endpoint URL to fetch
     * @param {number} gap - Delay in ms after sending before next command can fire
     */
    add(url, gap = 300) {
        // Chain the new task onto the end of the existing promise chain
        this.queue = this.queue.then(async () => {
            try {
                console.log(`[Queue] Blasting: ${url}`);
                const response = await fetch(url, { timeout: 5000, family: 4 });

                if (response.status === 200) {
                    // This is the "Airgap" that prevents signal stepping
                    await new Promise(resolve => setTimeout(resolve, gap));
                    return true;
                }
            } catch (err) {
                console.error(`[Queue Error] Hardware/Network fail: ${err.message}`);
            }
            return false;
        });
        return this.queue;
    }
}

module.exports = new RFQueue();