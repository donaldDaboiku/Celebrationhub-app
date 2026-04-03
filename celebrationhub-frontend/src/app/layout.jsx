import './globals.css';

export const metadata = {
    title: 'CelebrationHub',
    description: 'Birthday and Anniversary Management System',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body suppressHydrationWarning>
                {children}
            </body>
        </html>
    );
}
