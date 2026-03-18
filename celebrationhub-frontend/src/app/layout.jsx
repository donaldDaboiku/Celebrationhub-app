import Script from 'next/script';
import './globals.css';

export const metadata = {
    title: 'CelebrationHub',
    description: 'Birthday and Anniversary Management System',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                <Script
                    src="https://js.paystack.co/v1/inline.js"
                    strategy="lazyOnload"
                />
                {children}
            </body>
        </html>
    );
}