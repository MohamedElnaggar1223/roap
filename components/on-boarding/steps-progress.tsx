'use client'

import { useOnboarding } from "@/providers/onboarding-provider"
import { Check, X } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function StepsProgress() {
    const { steps, currentStep } = useOnboarding()
    const [hoveredStep, setHoveredStep] = useState<string | null>(null)

    return (
        <div className="w-64 bg-main-white rounded-[20px] p-4">
            <div className="flex flex-col gap-4">
                {steps.map((step) => (
                    <Link
                        key={step.id}
                        href={step.path}
                        className={`flex items-center justify-between p-3 rounded-lg transition-colors ${currentStep.id === step.id
                            ? 'bg-[#E0E4D9]'
                            : 'hover:bg-gray-50'
                            }`}
                        onMouseEnter={() => setHoveredStep(step.id)}
                        onMouseLeave={() => setHoveredStep(null)}
                    >
                        <span className="text-sm font-medium">{step.title}</span>
                        <div className="flex items-center justify-center w-6 h-6 rounded-full">
                            {hoveredStep === step.id ? (
                                step.isCompleted ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                    <X className="h-4 w-4 text-red-500" />
                                )
                            ) : null}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}