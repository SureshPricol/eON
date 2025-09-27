import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

// Store temporary tokens (in production, use Redis or database)
const tempTokens = new Map<string, { email: string, expires: number }>();

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({
                success: false,
                error: 'Email is required'
            }, { status: 400 });
        }

        console.log(`🔐 Passwordless login requested for: ${email}`);

        // Check if database is connected
        if (!db) {
            return NextResponse.json({
                success: false,
                error: 'Database not connected'
            }, { status: 500 });
        }

        // Check if user exists
        const user = await db.select().from(users).where(eq(users.email, email)).limit(1);

        if (user.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'User not found. Please check your email address.'
            }, { status: 404 });
        }

        const userData = user[0];

        if (userData.status !== 'active') {
            return NextResponse.json({
                success: false,
                error: 'User account is not active'
            }, { status: 403 });
        }

        // Generate temporary token
        const token = crypto.randomBytes(32).toString('hex');
        const expires = Date.now() + (15 * 60 * 1000); // 15 minutes

        // Store token
        tempTokens.set(token, { email, expires });

        // Clean up expired tokens
        for (const [key, value] of tempTokens.entries()) {
            if (value.expires < Date.now()) {
                tempTokens.delete(key);
            }
        }

        console.log(`✅ Passwordless token generated for: ${email}`);

        return NextResponse.json({
            success: true,
            message: 'Passwordless login token generated',
            token: token,
            expires_in: 900, // 15 minutes in seconds
            user: {
                id: userData.id,
                email: userData.email,
                name: userData.name,
                roles: userData.roles
            }
        });

    } catch (error) {
        console.error('❌ Passwordless login error:', error);

        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json({
                success: false,
                error: 'Token is required'
            }, { status: 400 });
        }

        console.log(`🔍 Validating passwordless token: ${token}`);

        // Check if token exists and is valid
        const tokenData = tempTokens.get(token);

        if (!tokenData) {
            return NextResponse.json({
                success: false,
                error: 'Invalid or expired token'
            }, { status: 401 });
        }

        if (tokenData.expires < Date.now()) {
            tempTokens.delete(token);
            return NextResponse.json({
                success: false,
                error: 'Token has expired'
            }, { status: 401 });
        }

        // Get user data
        const user = await db.select().from(users).where(eq(users.email, tokenData.email)).limit(1);

        if (user.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'User not found'
            }, { status: 404 });
        }

        const userData = user[0];

        // Remove token after successful validation
        tempTokens.delete(token);

        console.log(`✅ Passwordless login successful for: ${userData.email}`);

        return NextResponse.json({
            success: true,
            message: 'Login successful',
            user: {
                id: userData.id,
                email: userData.email,
                name: userData.name,
                roles: userData.roles,
                status: userData.status
            }
        });

    } catch (error) {
        console.error('❌ Token validation error:', error);

        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
