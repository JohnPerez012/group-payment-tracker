<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interactive Payment Tracker | Login</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background-color: #fdfcfb;
            color: #3f3f46;
        }
    </style>
</head>
<body class="antialiased flex items-center justify-center min-h-screen p-4">
    <main class="w-full max-w-lg">
        <div class="bg-white p-8 md:p-12 rounded-xl shadow-lg border border-zinc-200 text-center">
            <div class="mb-8">
                <h1 class="text-4xl font-bold text-zinc-800">Welcome</h1>
                <p class="text-zinc-500 mt-2">Sign in to manage your group payments or continue as a guest.</p>
            </div>
            
            <div class="space-y-4">
                <button id="google-signin-btn" class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-zinc-700 font-medium rounded-lg shadow-sm border border-zinc-300 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors">
                    <img src="https://www.svgrepo.com/show/355037/google.svg" alt="Google logo" class="w-5 h-5">
                    <span>Sign in with Google</span>
                </button>
                <button id="anonymous-signin-btn" class="w-full px-4 py-3 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors">
                    Continue as Guest
                </button>
            </div>
            
            <p id="loading-message" class="mt-6 text-sm text-zinc-500 hidden">Loading...</p>
        </div>
    </main>

    <script type="module">
        import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
        import { getAuth, GoogleAuthProvider, signInWithPopup, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

        // Global variables provided by the Canvas environment
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
        const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

        const googleBtn = document.getElementById('google-signin-btn');
        const anonymousBtn = document.getElementById('anonymous-signin-btn');
        const loadingMessage = document.getElementById('loading-message');

        // Main app initialization function
        function initApp() {
            try {
                if (!firebaseConfig) {
                    console.error("Firebase config is missing. Please ensure it's provided.");
                    return;
                }
                const app = initializeApp(firebaseConfig);
                const auth = getAuth(app);
                
                // Add event listeners to the buttons
                googleBtn.addEventListener('click', () => handleSignIn(auth, 'google'));
                anonymousBtn.addEventListener('click', () => handleSignIn(auth, 'anonymous'));

            } catch (error) {
                console.error("Error initializing Firebase:", error);
                loadingMessage.textContent = 'Failed to initialize. Please try again.';
                loadingMessage.classList.remove('hidden');
            }
        }

        async function handleSignIn(auth, method) {
            loadingMessage.classList.remove('hidden');
            try {
                if (method === 'google') {
                    const provider = new GoogleAuthProvider();
                    await signInWithPopup(auth, provider);
                } else {
                    await signInAnonymously(auth);
                }
                
                window.location.href = 'public/payment_tracker.html';
                
            } catch (error) {
                console.error("Authentication error:", error);
                loadingMessage.textContent = 'Sign-in failed. Please try again.';
            } finally {
                loadingMessage.classList.add('hidden');
            }
        }
        
        initApp();
    </script>
</body>
</html>
