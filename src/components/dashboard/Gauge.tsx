"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface GaugeProps {
    value: number // 0-100
    max?: number
    label: string
    sublabel?: string
    size?: 'sm' | 'md' | 'lg'
    showTarget?: boolean
    targetValue?: number
    className?: string
}

export function Gauge({
    value,
    max = 100,
    label,
    sublabel,
    size = 'md',
    showTarget = false,
    targetValue,
    className
}: GaugeProps) {
    const [animatedValue, setAnimatedValue] = useState(0)

    useEffect(() => {
        const timeout = setTimeout(() => {
            setAnimatedValue(value)
        }, 100)
        return () => clearTimeout(timeout)
    }, [value])

    const percentage = Math.min((animatedValue / max) * 100, 100)

    // SVG calculations for semi-circular gauge
    const radius = size === 'lg' ? 90 : size === 'md' ? 70 : 50
    const strokeWidth = size === 'lg' ? 14 : size === 'md' ? 12 : 8
    const circumference = Math.PI * radius // Half circle
    const strokeDashoffset = circumference - (percentage / 100) * circumference

    const sizeClasses = {
        sm: 'w-32 h-20',
        md: 'w-44 h-28',
        lg: 'w-56 h-36',
    }

    const textSizes = {
        sm: 'text-2xl',
        md: 'text-3xl',
        lg: 'text-4xl',
    }

    // Color gradient based on value
    const getColor = (val: number) => {
        if (val >= 80) return '#10b981' // green
        if (val >= 60) return '#f59e0b' // yellow
        if (val >= 40) return '#f97316' // orange
        return '#dc2626' // red
    }

    return (
        <div className={cn("flex flex-col items-center", className)}>
            <div className={cn("relative", sizeClasses[size])}>
                <svg
                    className="w-full h-full overflow-visible"
                    viewBox={`0 0 ${radius * 2 + strokeWidth} ${radius + strokeWidth}`}
                >
                    {/* Background arc */}
                    <path
                        d={`M ${strokeWidth / 2} ${radius + strokeWidth / 2} A ${radius} ${radius} 0 0 1 ${radius * 2 + strokeWidth / 2} ${radius + strokeWidth / 2}`}
                        fill="none"
                        stroke="#2a2a2a"
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                    />

                    {/* Animated progress arc */}
                    <path
                        d={`M ${strokeWidth / 2} ${radius + strokeWidth / 2} A ${radius} ${radius} 0 0 1 ${radius * 2 + strokeWidth / 2} ${radius + strokeWidth / 2}`}
                        fill="none"
                        stroke="url(#gaugeGradient)"
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-1000 ease-out"
                    />

                    {/* Gradient definition */}
                    <defs>
                        <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#dc2626" />
                            <stop offset="50%" stopColor="#f59e0b" />
                            <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                    </defs>

                    {/* Tick marks */}
                    {[0, 25, 50, 75, 100].map((tick) => {
                        const angle = (tick / 100) * 180 - 180
                        const rad = (angle * Math.PI) / 180
                        const x1 = radius + strokeWidth / 2 + (radius - strokeWidth) * Math.cos(rad)
                        const y1 = radius + strokeWidth / 2 + (radius - strokeWidth) * Math.sin(rad)
                        const x2 = radius + strokeWidth / 2 + (radius + 4) * Math.cos(rad)
                        const y2 = radius + strokeWidth / 2 + (radius + 4) * Math.sin(rad)

                        return (
                            <line
                                key={tick}
                                x1={x1}
                                y1={y1}
                                x2={x2}
                                y2={y2}
                                stroke="#4a4a4a"
                                strokeWidth={1.5}
                            />
                        )
                    })}
                </svg>

                {/* Center value */}
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
                    <span className={cn("font-bold text-foreground", textSizes[size])}>
                        {animatedValue.toFixed(0)}%
                    </span>
                </div>
            </div>

            {/* Labels */}
            <div className="text-center mt-2">
                <p className="text-sm font-medium text-foreground">{label}</p>
                {sublabel && (
                    <p className="text-xs text-muted-foreground">{sublabel}</p>
                )}
                {showTarget && targetValue && (
                    <p className="text-xs text-muted-foreground mt-1">
                        Objetivo: {targetValue}%
                    </p>
                )}
            </div>
        </div>
    )
}
