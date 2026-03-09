export default function LoginForm() {
    return (
        <div className="w-full max-w-sm space-y-5">
            <h2 className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>Welcome back!</h2>

            <div className="space-y-3">
                <div>
                    <label
                        htmlFor="username"
                        className="mb-1 block text-sm font-medium"
                        style={{ color: "var(--text-muted)" }}
                    >
                        Username
                    </label>
                    <input
                        id="username"
                        type="text"
                        placeholder="Enter your username"
                        className="w-full rounded-lg border px-4 py-2.5 text-sm transition-colors focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                        style={{ borderColor: "var(--border-soft)", backgroundColor: "var(--surface-base)", color: "var(--foreground)" }}
                    />
                </div>

                <div>
                    <label
                        htmlFor="password"
                        className="mb-1 block text-sm font-medium"
                        style={{ color: "var(--text-muted)" }}
                    >
                        Password
                    </label>
                    <input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        className="w-full rounded-lg border px-4 py-2.5 text-sm transition-colors focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                        style={{ borderColor: "var(--border-soft)", backgroundColor: "var(--surface-base)", color: "var(--foreground)" }}
                    />
                </div>
            </div>

            <button
                type="button"
                className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700"
            >
                Sign In
            </button>

            <p className="text-center text-sm" style={{ color: "var(--text-subtle)" }}>
                New User?{" "}
                <button type="button" className="font-medium text-green-600 hover:text-green-700">
                    Create account
                </button>
            </p>
        </div>
    );
}
