//apps/web/components/auth/sign-in-button.tsx

"use client";

import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

export default function SignInButton() {
    async function handleSignIn() {
        const provider = new GoogleAuthProvider();

        await signInWithPopup(auth, provider);
    }

    return (
        <button
            onClick={handleSignIn}
            className="rounded-2xl bg-slate-900 px-4 py-2 text-white"
        >
            Sign in with Google
        </button>
    );
}