const config = require('config');
// const fetch = require('node-fetch'); // If using Node.js version < 18, you need to install node-fetch

class ApiClient {
    static instance;

    constructor() {
        if (ApiClient.instance) {
            return ApiClient.instance;
        }

        this.queue = [];
        this.isProcessing = false;
        this.maxRetries = 3;
        this.retryDelay = 3000; // Delay before retrying after a 429 response (in milliseconds)
        this.processInterval = 200; // Interval between requests to respect rate limits (in milliseconds)
        this.paused = false; // Flag to indicate if processing is paused
        ApiClient.instance = this;
        this.startProcessing();
    }

    static getInstance() {
        if (!ApiClient.instance) {
            ApiClient.instance = new ApiClient();
        }

        return ApiClient.instance;
    }

    apiRequest(urlPath, query, body, method = 'GET') {
        return new Promise((resolve, reject) => {
            const request = {
                urlPath,
                query,
                body,
                method,
                resolve,
                reject,
                retries: 0
            };
            this.queue.push(request);
        this.startProcessing();
        });
    }

    startProcessing() {
        if (this.isProcessing) return;

        this.isProcessing = true;
        this.intervalId = setInterval(() => {
            if (this.paused) {
                // Skip processing while paused
                return;
            }

            if (this.queue.length === 0) {
                // No requests to process
                return;
            }

            const request = this.queue.shift();
            this.makeRequest(request)
                .then(response => {
                    request.resolve(response);
                })
                .catch(error => {
                    if (error.status === 429 && request.retries < this.maxRetries) {
                        request.retries++;
                        console.log(`Received 429, pausing request processing for ${this.retryDelay}ms and retrying request (attempt ${request.retries})`);

                        // Pause processing
                        this.pauseProcessing(this.retryDelay);

                        // Re-add the request to the front of the queue
                        setTimeout(() => {
                            this.queue.unshift(request);
                        }, this.retryDelay);
                    } else {
                        request.reject(error);
                    }
                });
        }, this.processInterval);
    }

    pauseProcessing(duration) {
        this.paused = true;
        setTimeout(() => {
            this.paused = false;
        }, duration);
    }

    stopProcessing() {
        if (this.isProcessing) {
            clearInterval(this.intervalId);
            this.isProcessing = false;
        }
    }

    async makeRequest(request) {
        const { urlPath, query, body, method } = request;

        let url = [config.reuters.host, urlPath].join('/');
        if (query) {
            url += '?' + new URLSearchParams(query);
        }

        console.log('Making request to:', url);

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'x-api-key': config.reuters.apiKey
            },
            body: body ? JSON.stringify(body) : undefined
        });

        if (response.ok) {
            return await response.json();
        } else {
            const error = new Error(response.statusText);
            error.status = response.status;
            throw error;
        }
    }
}

module.exports = ApiClient;