import React, { useMemo, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useProgramsStore } from '@/providers/store-provider';
import { getAssessmentsData } from '@/lib/actions/assessments.actions';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onScheduleImport: (schedules: any[]) => void;
    branchId: number;
}

export default function ImportSchedulesDialog({ open, onOpenChange, onScheduleImport, branchId }: Props) {
    const programs = useProgramsStore((state) => state.programs);
    const [assessmentPrograms, setAssessmentPrograms] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            const fetchAssessmentData = async () => {
                setLoading(true);
                try {
                    const { data } = await getAssessmentsData();
                    setAssessmentPrograms(data || []);
                } catch (error) {
                    console.error('Error fetching assessment data:', error);
                    setAssessmentPrograms([]);
                } finally {
                    setLoading(false);
                }
            };

            fetchAssessmentData();
        }
    }, [open]);

    const availablePackages = useMemo(() => {
        // Combine regular programs with assessment programs that have full package data
        const allPrograms = [...programs, ...assessmentPrograms];

        const finalPrograms = allPrograms
            .filter(program => program.branchId === branchId)
            .reduce<Array<any>>((acc, program) => {
                const firstValidPackage = program.packages?.find((pkg: any) => !pkg?.deleted);

                if (firstValidPackage) {
                    acc.push({
                        ...firstValidPackage,
                        programName: program.name ?? '',
                        schedules: firstValidPackage.schedules || []
                    });
                }
                return acc;
            }, []);

        return finalPrograms;
    }, [programs, assessmentPrograms, branchId]);

    if (loading) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="bg-main-white max-w-2xl">
                    <DialogHeader className="flex flex-row pr-6 text-center items-center justify-between gap-2">
                        <DialogTitle className="font-normal text-base">Import Schedules</DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-1 gap-4 py-4">
                        <p className="text-sm text-gray-600">Loading...</p>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-main-white max-w-2xl">
                <DialogHeader className="flex flex-row pr-6 text-center items-center justify-between gap-2">
                    <DialogTitle className="font-normal text-base">Import Schedules</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 gap-4 py-4">
                    <p className="text-sm text-gray-600">Select a package to import schedules from:</p>

                    <div className="space-y-4 max-h-[400px] overflow-y-auto">
                        {availablePackages.map((pkg) => (
                            <div
                                key={pkg.id || pkg.tempId}
                                className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                                onClick={() => {
                                    onScheduleImport(pkg.schedules);
                                    onOpenChange(false);
                                }}
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-medium">{pkg.programName}</p>
                                        <p className="text-sm text-gray-600">{pkg.name}</p>
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        {pkg.schedules.length} schedule{pkg.schedules.length !== 1 ? 's' : ''}
                                    </p>
                                </div>

                                <div className="mt-2 text-sm text-gray-500">
                                    {pkg.schedules.map((schedule: any, index: number) => (
                                        <p key={index}>
                                            {schedule.day.toUpperCase()}: {schedule.from} - {schedule.to}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {availablePackages.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                No packages available to import schedules from
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}