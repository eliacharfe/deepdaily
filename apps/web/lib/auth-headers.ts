import { auth } from "@/lib/firebase";

export async function getAuthHeaders(): Promise<Record<string, string>> {
    const token = await auth.currentUser?.getIdToken();

    if (!token) {
        throw new Error("User is not authenticated");
    }

    return { Authorization: `Bearer ${token}` };
}
