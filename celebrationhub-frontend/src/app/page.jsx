'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/api';

export default function Home() {
    const router = useRouter();

    useEffect(() => {
        if (isAuthenticated()) {
            router.replace('/dashboard');
        } else {
            router.replace('/login');
        }
    }, [router]);

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontFamily: 'Georgia, serif',
            fontSize: '18px',
        }}>
            Loading CelebrationHub...
        </div>
    );
}