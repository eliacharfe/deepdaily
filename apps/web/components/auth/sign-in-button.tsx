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
            {/* Sign in with Google */}

            <>
                {/* Google Icon */}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    className="h-5 w-5"
                >
                    <path
                        fill="#FFC107"
                        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12S17.4 12 24 12c3 0 5.8 1.1 8 3l5.7-5.7C34.6 6.5 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 19.7-8.4 19.7-20c0-1.3-.1-2.3-.1-3.5z"
                    />
                    <path
                        fill="#FF3D00"
                        d="M6.3 14.7l6.6 4.8C14.7 16 18.9 12 24 12c3 0 5.8 1.1 8 3l5.7-5.7C34.6 6.5 29.6 4 24 4c-7.7 0-14.4 4.4-17.7 10.7z"
                    />
                    <path
                        fill="#4CAF50"
                        d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.2C29.2 35.4 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.6 5.1C9.5 39.6 16.2 44 24 44z"
                    />
                    <path
                        fill="#1976D2"
                        d="M43.6 20.5H42V20H24v8h11.3c-1 2.7-3 5-5.6 6.6l6.3 5.2C39.6 36.6 44 30.8 44 24c0-1.3-.1-2.3-.4-3.5z"
                    />
                </svg>

                <span>Continue with Google</span>
            </>
        </button>
    );
}