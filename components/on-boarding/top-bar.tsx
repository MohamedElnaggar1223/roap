'use client'

import { useOnboarding } from "@/providers/onboarding-provider"
import { useSave } from "@/providers/onboarding-save-provider"
import { ArrowLeft, ArrowRight, Check, Loader2, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { useRouter } from "next/navigation"
import { academyOnBoarded } from "@/lib/actions/onboarding.actions"
import { useState } from "react"

export default function TopBar() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const {
        currentStep,
        steps,
        completedSteps,
        totalSteps,
        goToNextStep,
        goToPreviousStep,
        isStepComplete
    } = useOnboarding()

    const { save, isSaving } = useSave()
    const { toast } = useToast()

    const handleSave = async () => {
        console.log("aadawdaw")
        const result = await save()
        if (result.success) {
            toast({
                title: "Success",
                description: "Progress saved successfully",
            })
        } else {
            toast({
                title: "Error",
                description: result.error || "Failed to save progress",
                variant: "destructive",
            })
        }
    }

    const handleSaveAndContinue = async () => {
        setLoading(true)
        await handleSave()
        await academyOnBoarded()
        router.refresh()
        setLoading(false)
    }

    return (
        <div className="flex w-full items-center justify-between px-8 pb-2 pt-6 bg-main-white rounded-t-[20px]">
            <p className='font-bold text-xl'>{currentStep.title}</p>

            <div className="flex flex-col items-center gap-1">
                <Popover>
                    <PopoverTrigger asChild>
                        <button className="flex items-center gap-2 px-3 py-1 rounded-lg hover:bg-gray-50">
                            <span className="text-sm text-gray-500">
                                {completedSteps} of {totalSteps} completed
                            </span>
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64" align="center">
                        <div className="flex flex-col gap-2">
                            {steps.map((step) => (
                                <div
                                    key={step.id}
                                    className={`flex items-center justify-between p-2 rounded-lg ${currentStep.id === step.id ? 'bg-[#E0E4D9]' : ''
                                        }`}
                                >
                                    <span className="text-sm font-medium">{step.title}</span>
                                    <div className="flex items-center justify-center w-6 h-6 rounded-full">
                                        {isStepComplete(step.id) ? (
                                            <Check className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <X className="h-4 w-4 text-red-500" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={goToPreviousStep}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-main-green text-main-yellow"
                >
                    <ArrowLeft className="h-4 w-4" />
                </button>
                <button
                    onClick={handleSave}
                    disabled={(isSaving || loading)}
                    className="flex items-center justify-center gap-2 rounded-3xl px-4 py-2 bg-main-green text-sm text-main-yellow disabled:opacity-50"
                >
                    {(isSaving || loading) && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save
                </button>
                {completedSteps === 5 && (
                    <button
                        onClick={handleSaveAndContinue}
                        disabled={(isSaving || loading)}
                        className="flex items-center justify-center gap-2 rounded-3xl px-4 py-2 bg-main-green text-sm text-main-yellow disabled:opacity-50"
                    >
                        {(isSaving || loading) && <Loader2 className="h-4 w-4 animate-spin" />}
                        Save and Continue
                    </button>
                )}
                <button
                    onClick={goToNextStep}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-main-green text-main-yellow"
                >
                    <ArrowRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    )
}