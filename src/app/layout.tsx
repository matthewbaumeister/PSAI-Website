import type { Metadata } from "next"
import { Inter, IBM_Plex_Mono } from "next/font/google"
import "./globals.css"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { AuthProvider } from "@/contexts/AuthContext"
import { InactivityTimer } from "@/components/InactivityTimer"

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter"
})

const ibmPlexMono = IBM_Plex_Mono({ 
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-mono"
})

export const metadata: Metadata = {
  title: "Prop Shop AI - Procurement Intelligence Platform | Where innovation meets compliance",
  description: "Find, win, and deliver government contracts — without the gatekeepers. The procurement intelligence platform that levels the playing field for challengers and incumbents alike.",
  keywords: "procurement intelligence, government contracts, proposal automation, compliance platform, federal contracting, DoD contracts, procurement platform, AI procurement",
  authors: [{ name: "Prop Shop AI" }],
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: "Prop Shop AI - Procurement Intelligence Platform",
    description: "Where innovation meets compliance. The infrastructure layer for government procurement.",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <style dangerouslySetInnerHTML={{
          __html: `
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              background: #0B1220;
              min-height: 100vh;
              font-family: 'Inter', sans-serif;
              color: #ffffff;
              line-height: 1.6;
              overflow-x: hidden;
            }
            
            /* Tech Grid Background */
            body::before {
              content: '';
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background-image: 
                linear-gradient(rgba(45, 91, 255, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(45, 91, 255, 0.03) 1px, transparent 1px);
              background-size: 50px 50px;
              z-index: -1;
            }
            
            /* Animated Tech Particles */
            body::after {
              content: '';
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: radial-gradient(circle at 20% 80%, rgba(154, 242, 58, 0.1) 0%, transparent 50%),
                          radial-gradient(circle at 80% 20%, rgba(45, 91, 255, 0.1) 0%, transparent 50%),
                          radial-gradient(circle at 40% 40%, rgba(255, 122, 41, 0.05) 0%, transparent 50%);
              z-index: -1;
              animation: tech-pulse 20s ease-in-out infinite;
            }
            
            @keyframes tech-pulse {
              0%, 100% { opacity: 0.3; transform: scale(1); }
              50% { opacity: 0.6; transform: scale(1.1); }
            }
            
            /* Enhanced Fireworks Animation - Flowing from Top and Bottom */
            .fireworks {
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              pointer-events: none;
              z-index: -999;
              overflow: hidden;
            }
            
            .firework {
              position: absolute;
              width: 4px;
              height: 4px;
              border-radius: 50%;
              animation: firework-float 8s ease-in-out infinite;
              opacity: 0;
            }
            
            /* Bottom to Top Fireworks */
            .firework:nth-child(1) {
              left: 10%;
              top: 20%;
              background: rgba(45, 91, 255, 0.25);
              animation-delay: 0s;
              animation-duration: 12s;
              animation-name: firework-float-up;
            }
            
            .firework:nth-child(2) {
              left: 85%;
              top: 15%;
              background: rgba(154, 242, 58, 0.2);
              animation-delay: 2s;
              animation-duration: 10s;
              animation-name: firework-float-up;
            }
            
            .firework:nth-child(3) {
              left: 20%;
              top: 80%;
              background: rgba(255, 122, 41, 0.22);
              animation-delay: 4s;
              animation-duration: 14s;
              animation-name: firework-float-up;
            }
            
            .firework:nth-child(4) {
              left: 75%;
              top: 70%;
              background: rgba(45, 91, 255, 0.2);
              animation-delay: 6s;
              animation-duration: 11s;
              animation-name: firework-float-up;
            }
            
            /* Top to Bottom Fireworks */
            .firework:nth-child(5) {
              left: 50%;
              top: 30%;
              background: rgba(154, 242, 58, 0.25);
              animation-delay: 1s;
              animation-duration: 13s;
              animation-name: firework-float-down;
            }
            
            .firework:nth-child(6) {
              left: 30%;
              top: 60%;
              background: rgba(255, 122, 41, 0.2);
              animation-delay: 3s;
              animation-duration: 9s;
              animation-name: firework-float-down;
            }
            
            .firework:nth-child(7) {
              left: 90%;
              top: 50%;
              background: rgba(45, 91, 255, 0.18);
              animation-delay: 5s;
              animation-duration: 15s;
              animation-name: firework-float-down;
            }
            
            .firework:nth-child(8) {
              left: 5%;
              top: 40%;
              background: rgba(154, 242, 58, 0.22);
              animation-delay: 7s;
              animation-duration: 12s;
              animation-name: firework-float-down;
            }
            
            /* Bottom to Top Animation */
            @keyframes firework-float-up {
              0% {
                transform: translateY(100vh) scale(0);
                opacity: 0;
              }
              15% {
                opacity: 0.4;
              }
              50% {
                transform: translateY(50vh) scale(1);
                opacity: 0.3;
              }
              85% {
                opacity: 0.2;
              }
              100% {
                transform: translateY(-20vh) scale(0.5);
                opacity: 0;
              }
            }
            
            /* Top to Bottom Animation */
            @keyframes firework-float-down {
              0% {
                transform: translateY(-20vh) scale(0);
                opacity: 0;
              }
              15% {
                opacity: 0.4;
              }
              50% {
                transform: translateY(50vh) scale(1);
                opacity: 0.3;
              }
              85% {
                opacity: 0.2;
              }
              100% {
                transform: translateY(100vh) scale(0.5);
                opacity: 0;
              }
            }
            
            .container {
              max-width: 1200px;
              margin: 0 auto;
              padding: 0 1rem;
              position: relative;
              z-index: 10;
            }
            
            /* Enhanced Header with Tech Vibes */
            header {
              border-bottom: 1px solid rgba(45, 91, 255, 0.2);
              background: rgba(11, 18, 32, 0.95);
              backdrop-filter: blur(20px);
              position: sticky;
              top: 0;
              z-index: 100;
              padding: 1rem 0;
            }
            
            header .container {
              display: flex;
              align-items: center;
              justify-content: space-between;
            }
            
            .logo {
              display: flex;
              align-items: center;
              gap: 0.75rem;
              text-decoration: none;
              color: white;
            }
            
            .logo-icon {
              height: 6rem;
              width: 6rem;
              border-radius: 0.5rem;
              display: flex;
              align-items: center;
              justify-content: center;
              position: relative;
              margin-right: 0;
            }
            
            .logo-icon img {
              width: 6rem;
              height: 6rem;
              filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.4));
            }
            
            .brand {
              display: flex;
              align-items: center;
            }
            
            .logo-text {
              font-weight: bold;
              font-size: 1.25rem;
              font-family: 'Inter', sans-serif;
              margin-left: 0.1rem;
            }
            
            nav {
              display: flex;
              align-items: center;
              gap: 2rem;
            }
            
            nav a {
              color: #3B4761;
              text-decoration: none;
              font-size: 0.875rem;
              font-weight: 500;
              transition: all 0.3s;
              font-family: 'Inter', sans-serif;
              position: relative;
            }
            
            nav a::after {
              content: '';
              position: absolute;
              bottom: -5px;
              left: 0;
              width: 0;
              height: 2px;
              background: linear-gradient(90deg, #2D5BFF, #9AF23A);
              transition: width 0.3s ease;
            }
            
            nav a:hover {
              color: #2D5BFF;
            }
            
            nav a:hover::after {
              width: 100%;
            }
            
            .header-buttons {
              display: flex;
              align-items: center;
              gap: 1rem;
            }
            
            .btn {
              padding: 0.5rem 1rem;
              border-radius: 0.375rem;
              font-size: 0.875rem;
              font-weight: 500;
              text-decoration: none;
              transition: all 0.3s;
              border: none;
              cursor: pointer;
              font-family: 'Inter', sans-serif;
              position: relative;
              overflow: hidden;
            }
            
            .btn::before {
              content: '';
              position: absolute;
              top: 0;
              left: -100%;
              width: 100%;
              height: 100%;
              background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
              transition: left 0.5s;
            }
            
            .btn:hover::before {
              left: 100%;
            }
            
            .btn-ghost {
              background: transparent;
              color: #3B4761;
              border: 1px solid rgba(45, 91, 255, 0.2);
            }
            
            .btn-ghost:hover {
              color: white;
              background: rgba(45, 91, 255, 0.1);
              border-color: rgba(45, 91, 255, 0.4);
              transform: translateY(-2px);
              box-shadow: 0 10px 20px rgba(45, 91, 255, 0.2);
            }
            
            .btn-primary {
              background: linear-gradient(-45deg, #0B1220, #2D5BFF, #9AF23A, #FF7A29);
              background-size: 400% 400%;
              animation: tech-gradient 15s ease infinite;
              color: white;
              box-shadow: 0 0 20px rgba(154, 242, 58, 0.4);
            }
            
            .btn-primary:hover {
              transform: translateY(-2px) scale(1.05);
              box-shadow: 0 15px 30px rgba(154, 242, 58, 0.6);
            }
            
            /* Enhanced Hero Section */
            .hero {
              padding: 8rem 0 6rem;
              text-align: center;
              position: relative;
              overflow: hidden;
            }
            

            
            .hero::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: linear-gradient(135deg, rgba(11, 18, 32, 0.8) 0%, rgba(45, 91, 255, 0.1) 100%);
              z-index: -1;
            }
            
            .badge {
              display: inline-block;
              padding: 0.75rem 1.5rem;
              background: rgba(11, 18, 32, 0.9);
              backdrop-filter: blur(20px);
              border: 1px solid rgba(45, 91, 255, 0.3);
              border-radius: 2rem;
              font-size: 0.875rem;
              font-weight: 600;
              color: #9AF23A;
              box-shadow: 0 0 30px rgba(45, 91, 255, 0.3);
              margin-bottom: 2rem;
              font-family: 'IBM Plex Mono', monospace;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              position: relative;
              overflow: hidden;
            }
            
            .badge::before {
              content: '';
              position: absolute;
              top: 0;
              left: -100%;
              width: 100%;
              height: 100%;
              background: linear-gradient(90deg, transparent, rgba(154, 242, 58, 0.2), transparent);
              animation: badge-shine 3s ease-in-out infinite;
            }
            
            @keyframes badge-shine {
              0%, 100% { left: -100%; }
              50% { left: 100%; }
            }
            
            .hero h1 {
              font-size: 4rem;
              font-weight: 800;
              margin-bottom: 2rem;
              font-family: 'Inter', sans-serif;
              letter-spacing: -0.025em;
              line-height: 1.1;
            }
            
            .hero h1 span {
              background: linear-gradient(45deg, #2D5BFF 0%, #9AF23A 50%, #FF7A29 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              position: relative;
            }
            
            .hero h1 span::after {
              content: '';
              position: absolute;
              bottom: -5px;
              left: 0;
              width: 100%;
              height: 3px;
              background: linear-gradient(90deg, #2D5BFF, #9AF23A, #FF7A29);
              border-radius: 2px;
            }
            
            .hero p {
              font-size: 1.5rem;
              color: #3B4761;
              margin-bottom: 3rem;
              max-width: 64rem;
              margin-left: auto;
              margin-right: auto;
              font-family: 'Inter', sans-serif;
              line-height: 1.6;
            }
            
            .hero-buttons {
              display: flex;
              flex-direction: column;
              gap: 1.5rem;
              justify-content: center;
              margin-bottom: 6rem;
            }
            
            @media (min-width: 640px) {
              .hero-buttons {
                flex-direction: row;
              }
            }
            
            .btn-lg {
              padding: 1.25rem 2.5rem;
              font-size: 1.125rem;
              border-radius: 0.5rem;
            }
            
            .btn-outline {
              background: transparent;
              border: 2px solid #2D5BFF;
              color: #2D5BFF;
            }
            
            .btn-outline:hover {
              background: rgba(45, 91, 255, 0.1);
              border-color: #9AF23A;
              color: #9AF23A;
            }
            
            /* Tech-Enhanced Proof Row */
            .proof-row {
              margin-top: 5rem;
              text-align: center;
            }
            
            .proof-label {
              font-size: 0.875rem;
              font-weight: 600;
              color: #3B4761;
              text-transform: uppercase;
              letter-spacing: 0.15em;
              margin-bottom: 2rem;
              font-family: 'IBM Plex Mono', monospace;
            }
            
            .proof-items {
              display: flex;
              justify-content: center;
              align-items: center;
              gap: 3rem;
              opacity: 0.9;
            }
            
            .proof-item {
              font-size: 1.25rem;
              font-weight: 600;
              color: #2D5BFF;
              box-shadow: 0 0 30px rgba(45, 91, 255, 0.3);
              font-family: 'IBM Plex Mono', monospace;
              padding: 0.5rem 1rem;
              border-radius: 0.5rem;
              background: rgba(45, 91, 255, 0.1);
              border: 1px solid rgba(45, 91, 255, 0.2);
              transition: all 0.3s ease;
            }
            
            .proof-item:hover {
              transform: translateY(-5px);
              box-shadow: 0 10px 30px rgba(45, 91, 255, 0.5);
              background: rgba(45, 91, 255, 0.2);
            }
            
            /* Tech-Enhanced Feature Cards */
            .features-grid {
              margin-top: 6rem;
              display: grid;
              gap: 2.5rem;
              grid-template-columns: 1fr;
            }
            
            @media (min-width: 640px) {
              .features-grid {
                grid-template-columns: repeat(2, 1fr);
              }
            }
            
            @media (min-width: 1024px) {
              .features-grid {
                grid-template-columns: repeat(3, 1fr);
              }
            }
            
            .feature-card {
              background: rgba(11, 18, 32, 0.9);
              backdrop-filter: blur(20px);
              border: 1px solid rgba(45, 91, 255, 0.2);
              border-radius: 1rem;
              padding: 2.5rem;
              box-shadow: 0 0 40px rgba(45, 91, 255, 0.2);
              transition: all 0.4s ease;
              position: relative;
              overflow: hidden;
            }
            
            .feature-card::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 3px;
              background: linear-gradient(90deg, #2D5BFF, #9AF23A, #FF7A29);
              transform: scaleX(0);
              transition: transform 0.3s ease;
            }
            
            .feature-card:hover {
              box-shadow: 0 20px 60px rgba(154, 242, 58, 0.3);
              transform: translateY(-10px) scale(1.02);
              border-color: rgba(154, 242, 58, 0.4);
            }
            
            .feature-card:hover::before {
              transform: scaleX(1);
            }
            
            .feature-icon {
              height: 5rem;
              width: 5rem;
              border-radius: 1rem;
              background: linear-gradient(-45deg, #0B1220, #2D5BFF, #9AF23A, #FF7A29);
              background-size: 400% 400%;
              animation: tech-gradient 15s ease infinite;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 0 40px rgba(45, 91, 255, 0.4);
              margin-bottom: 2rem;
              font-weight: bold;
              font-size: 2rem;
              font-family: 'IBM Plex Mono', monospace;
              position: relative;
            }
            
            .feature-icon::after {
              content: '';
              position: absolute;
              inset: -2px;
              border-radius: 1rem;
              background: linear-gradient(45deg, #2D5BFF, #9AF23A, #FF7A29, #2D5BFF);
              background-size: 400% 400%;
              animation: tech-gradient 15s ease infinite;
              z-index: -1;
              opacity: 0.5;
            }
            
            .feature-card h3 {
              font-size: 1.5rem;
              font-weight: 700;
              margin-bottom: 1.5rem;
              font-family: 'Inter', sans-serif;
              color: white;
            }
            
            .feature-card p {
              color: #3B4761;
              font-family: 'Inter', sans-serif;
              font-size: 1.1rem;
              line-height: 1.6;
            }
            
            /* Tech-Enhanced Quote Section */
            .quote-section {
              margin-top: 6rem;
              text-align: center;
            }
            
            .quote-container {
              max-width: 48rem;
              margin: 0 auto;
              padding: 3rem;
              background: rgba(11, 18, 32, 0.8);
              backdrop-filter: blur(20px);
              border: 1px solid rgba(45, 91, 255, 0.2);
              border-radius: 1.5rem;
              box-shadow: 0 0 50px rgba(45, 91, 255, 0.2);
            }
            
            .quote {
              font-size: 2rem;
              font-weight: 700;
              font-style: italic;
              font-family: 'Inter', sans-serif;
              color: white;
              margin-bottom: 1.5rem;
              position: relative;
            }
            

            
            .quote-attribution {
              font-size: 1rem;
              color: #3B4761;
              font-family: 'IBM Plex Mono', monospace;
              font-weight: 500;
            }
            
            /* Enhanced Background Decorations */
            .bg-decoration {
              position: absolute;
              inset: 0;
              z-index: -1;
            }
            
            .bg-circle {
              position: absolute;
              border-radius: 50%;
              filter: blur(4rem);
              animation: tech-pulse 8s ease-in-out infinite;
            }
            
            .bg-circle:nth-child(1) {
              top: 10%;
              left: 20%;
              width: 30rem;
              height: 30rem;
              background: radial-gradient(circle, rgba(45, 91, 255, 0.2) 0%, transparent 70%);
            }
            
            .bg-circle:nth-child(2) {
              bottom: 10%;
              right: 20%;
              width: 25rem;
              height: 25rem;
              background: radial-gradient(circle, rgba(154, 242, 58, 0.15) 0%, transparent 70%);
              animation-delay: 2s;
            }
            
            .bg-circle:nth-child(3) {
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 20rem;
              height: 20rem;
              background: radial-gradient(circle, rgba(255, 122, 41, 0.1) 0%, transparent 70%);
              animation-delay: 4s;
            }
            
            @keyframes tech-gradient {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
            
            /* Responsive Design */
            @media (max-width: 768px) {
              .hero h1 {
                font-size: 2.5rem;
              }
              
              .hero p {
                font-size: 1.25rem;
              }
              
              nav {
                display: none;
              }
              
              .proof-items {
                flex-direction: column;
                gap: 1rem;
              }
            }
          `
        }} />
      </head>
      <body className={`${inter.variable} ${ibmPlexMono.variable} min-h-screen bg-[#0B1220] text-white`}>
        {/* Subtle Fireworks Background */}
        <div className="fireworks">
          <div className="firework"></div>
          <div className="firework"></div>
          <div className="firework"></div>
          <div className="firework"></div>
          <div className="firework"></div>
          <div className="firework"></div>
          <div className="firework"></div>
          <div className="firework"></div>
        </div>
        
        <AuthProvider>
          <Header />
          {children}
          <InactivityTimer />
        </AuthProvider>
        <Footer />
      </body>
    </html>
  )
}
