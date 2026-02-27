import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        // Optional: Add custom logic here
        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
        pages: {
            signIn: "/login",
        },
    }
);

// Protect all routes starting with /dashboard
// AUTH routes like /login, /signup, /forgot-password, /reset-password are NOT matched here and thus are public
export const config = {
    matcher: ["/dashboard/:path*"],
};
