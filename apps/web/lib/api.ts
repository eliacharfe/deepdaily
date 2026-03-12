
import { config } from "./config";

export async function apiGet<T>(path: string): Promise<T> {
    const response = await fetch(`${config.apiBaseUrl}${path}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        },
        cache: "no-store"
    });

    if (!response.ok) {
        throw new Error(`GET ${path} failed with status ${response.status}`);
    }

    return response.json() as Promise<T>;
}