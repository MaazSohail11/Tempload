import React from "react";

export default function LogoSVG({ className, style }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 600 160"
            className={className}
            style={{
                width: "100%",
                maxWidth: "400px",
                height: "auto",
                display: "block",
                ...style,
            }}
        >
            <defs>
                <style>
                    {`
                        .logo-font {
                            font-family: 'Arial Black', Impact, system-ui, sans-serif;
                            font-weight: 900;
                            font-style: italic;
                            text-transform: uppercase;
                        }
                        .base-text {
                            fill: #ffffff;
                        }
                        .glitch-slice-1 {
                            clip-path: polygon(0 0, 100% 0, 100% 40%, 0 40%);
                            transform: translateX(-4px);
                        }
                        .glitch-slice-2 {
                            clip-path: polygon(0 40%, 100% 40%, 100% 55%, 0 55%);
                            transform: translateX(6px);
                            opacity: 0.9;
                        }
                        .glitch-slice-3 {
                            clip-path: polygon(0 55%, 100% 55%, 100% 100%, 0 100%);
                            transform: translateX(-2px);
                        }
                        
                        /* Glitch animations */
                        .glitch-anim-1 {
                            animation: glitch-anim-1-key 4s infinite linear alternate-reverse;
                        }
                        .glitch-anim-2 {
                            animation: glitch-anim-2-key 4s infinite linear alternate-reverse;
                        }
                        @keyframes glitch-anim-1-key {
                            0%, 90% { transform: translateX(-4px); }
                            92% { transform: translateX(8px) skewX(-15deg); }
                            94% { transform: translateX(-4px); }
                        }
                        @keyframes glitch-anim-2-key {
                            0%, 90% { transform: translateX(6px); }
                            92% { transform: translateX(-10px) skewX(15deg); }
                            94% { transform: translateX(6px); }
                        }
                        .decorative-line {
                            fill: #ffffff;
                            opacity: 0.6;
                        }
                    `}
                </style>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            <g transform="translate(60, 110)">
                {/* Back text shadow / glow */}
                <text className="logo-font" fontSize="80" x="0" y="0" fill="rgba(255,255,255,0.1)" transform="translate(4,4)">
                    <tspan fontSize="100" fill="#38bdf8">T</tspan>EMP<tspan fontSize="100" fill="#38bdf8">L</tspan>OAD
                </text>

                {/* Layer 1 (Top) */}
                <text className="logo-font base-text glitch-slice-1 glitch-anim-1" fontSize="80" x="0" y="0">
                    <tspan fontSize="100">T</tspan>EMP<tspan fontSize="100">L</tspan>OAD
                </text>

                {/* Layer 2 (Middle) */}
                <text className="logo-font base-text glitch-slice-2 glitch-anim-2" fontSize="80" x="0" y="0">
                    <tspan fontSize="100">T</tspan>EMP<tspan fontSize="100">L</tspan>OAD
                </text>

                {/* Layer 3 (Bottom) */}
                <text className="logo-font base-text glitch-slice-3" fontSize="80" x="0" y="0">
                    <tspan fontSize="100">T</tspan>EMP<tspan fontSize="100">L</tspan>OAD
                </text>
            </g>

            {/* Decorative shapes that mimic the image's artifacts */}
            <path d="M 30,70 L 100,70" stroke="#fff" strokeWidth="2" strokeDasharray="10, 5, 20, 5" opacity="0.4" />
            <path d="M 50,75 L 120,75" stroke="#fff" strokeWidth="1" opacity="0.2" />
            
            <path d="M 500,85 L 560,85" stroke="#fff" strokeWidth="2" strokeDasharray="15, 10, 5, 5" opacity="0.4" />
            
            {/* Quick slash cut lines inside the SVG */}
            <line x1="40" y1="65" x2="550" y2="65" stroke="#000" strokeWidth="3" opacity="0.8" />
            <line x1="100" y1="88" x2="480" y2="88" stroke="#000" strokeWidth="2" opacity="0.8" />
            
            <rect x="80" y="60" width="10" height="4" fill="#ffffff" opacity="0.8" transform="skewX(-20)" />
            <rect x="520" y="90" width="20" height="3" fill="#ffffff" opacity="0.8" transform="skewX(-20)" />
            <rect x="490" y="55" width="8" height="6" fill="#38bdf8" opacity="0.9" transform="skewX(-20)" />
        </svg>
    );
}
