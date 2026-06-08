/**
 * Retry a function with exponential backoff
 * Useful for handling transient errors like rate limits
 */
export async function retryWithExponentialBackoff<T>(
    fn: () => Promise<T>,
    options: {
        maxAttempts?: number;
        baseDelayMs?: number;
        maxDelayMs?: number;
        shouldRetry?: (error: Error) => boolean;
    } = {},
): Promise<T> {
    const {
        maxAttempts = 3,
        baseDelayMs = 1000,
        maxDelayMs = 10000,
        shouldRetry = (error) => {
            const message = error.message.toLowerCase();
            return (
                message.includes('rate limit') ||
                message.includes('429') ||
                message.includes('too many requests')
            );
        },
    } = options;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            // Don't retry if it's not a retryable error
            if (!shouldRetry(lastError)) {
                throw error;
            }

            // Don't wait after the last attempt
            if (attempt < maxAttempts) {
                // Exponential backoff: 1s, 2s, 4s (with jitter)
                const delayMs = Math.min(baseDelayMs * Math.pow(2, attempt - 1), maxDelayMs);
                const jitterMs = Math.random() * delayMs * 0.1; // 10% jitter
                const totalDelay = delayMs + jitterMs;

                console.warn(
                    `Rate limit or transient error (attempt ${attempt}/${maxAttempts}). Retrying in ${Math.round(totalDelay)}ms...`,
                );

                await new Promise((resolve) => setTimeout(resolve, totalDelay));
            }
        }
    }

    throw lastError || new Error('Max retry attempts reached');
}
