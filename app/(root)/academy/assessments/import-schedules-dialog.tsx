import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useProgramsStore } from '@/providers/store-provider';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onScheduleImport: (schedules: any[]) => void;
}

export default function ImportSchedulesDialog({ open, onOpenChange, onScheduleImport }: Props) {
    const programs = useProgramsStore((state) => state.programs);

    const availablePackages = programs
        .filter(program => !program.packages.some(pkg => pkg.name.toLowerCase().includes('assessment')))
        .flatMap(program => program.packages.map(pkg => ({
            ...pkg,
            programName: program.name
        })))
        .filter(pkg => !pkg.deleted);

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
                                    {pkg.schedules.map((schedule, index) => (
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