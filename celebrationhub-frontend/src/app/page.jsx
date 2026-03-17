// 'use client';
// import Link from 'next/link';

// export default function Home() {
//   return (
//     <div className="landing-page">
//       <div className="hero">
//         <h1>Welcome to CelebrationHub</h1>
//         <p>Manage birthdays and anniversaries with ease</p>
//         <div className="cta-buttons">
//           <Link href="/dashboard" className="btn-primary">
//             Go to Dashboard
//           </Link>
//           <Link href="/login" className="btn-secondary">
//             Login
//           </Link>
//         </div>
//       </div>

//       <style jsx>{`
//         .landing-page {
//           min-height: 100vh;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//         }

//         .hero {
//           text-align: center;
//           color: white;
//           padding: 40px;
//         }

//         h1 {
//           font-family: Georgia, serif;
//           font-size: 48px;
//           margin-bottom: 16px;
//         }

//         p {
//           font-size: 20px;
//           margin-bottom: 32px;
//           opacity: 0.9;
//         }

//         .cta-buttons {
//           display: flex;
//           gap: 16px;
//           justify-content: center;
//         }

//         .btn-primary, .btn-secondary {
//           padding: 14px 32px;
//           border-radius: 8px;
//           font-size: 16px;
//           font-weight: 600;
//           text-decoration: none;
//           transition: transform 0.2s;
//         }

//         .btn-primary {
//           background: white;
//           color: #667eea;
//         }

//         .btn-secondary {
//           background: transparent;
//           color: white;
//           border: 2px solid white;
//         }

//         .btn-primary:hover, .btn-secondary:hover {
//           transform: translateY(-2px);
//         }

//         @media (max-width: 768px) {
//           h1 {
//             font-size: 32px;
//           }

//           p {
//             font-size: 16px;
//           }

//           .cta-buttons {
//             flex-direction: column;
//           }
//         }
//       `}</style>
//     </div>
//   );
// }

'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/dashboard');
  }, [router]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh' 
    }}>
      <p>Redirecting to dashboard...</p>
    </div>
  );
}