function assertValue<T>(v: T | undefined, errorMessage: string): T {
    if (v === undefined) {
        throw new Error(errorMessage)
    }

    return v
}

function env(key: string) {
    return () => assertValue(process.env[key], `Missing environment variable: ${key}`);
}


export const config = {
    openaiApiKey: env("OPENAI_API_KEY"),
}
