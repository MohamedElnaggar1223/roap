'use client'
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useProgramsStore } from '@/providers/store-provider';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    program: any;
    branches: {
        id: number;
        name: string;
    }[];
}

export default function DuplicateProgramDialog({ open, onOpenChange, program, branches }: Props) {
    const [selectedBranchId, setSelectedBranchId] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const addProgram = useProgramsStore((state) => state.addProgram);

    const handleDuplicate = async () => {
        if (!selectedBranchId) return;
        setLoading(true);

        // Create a new program based on the existing one
        const duplicatedProgram = {
            ...program,
            id: Math.floor(Math.random() * 1000000), // Temporary ID
            branchId: parseInt(selectedBranchId),
            packages: program.packages.map((pkg: any) => ({
                ...pkg,
                id: undefined,
                tempId: Math.floor(Math.random() * 1000000),
            })),
            discounts: program.discounts.map((discount: any) => ({
                ...discount,
                id: undefined,
                tempId: Math.floor(Math.random() * 1000000),
            })),
            coachPrograms: program.coachPrograms.map((cp: any) => ({
                ...cp,
                id: undefined,
                tempId: Math.floor(Math.random() * 1000000),
            })),
        };

        await addProgram(duplicatedProgram);
        setLoading(false);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-main-white max-w-md">
                <DialogHeader className="flex flex-row pr-6 text-center items-center justify-between gap-2">
                    <DialogTitle className="font-normal text-base">Duplicate Program</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4 p-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Select Branch</label>
                        <Select onValueChange={setSelectedBranchId} value={selectedBranchId}>
                            <SelectTrigger className="px-2 py-6 rounded-[10px] border border-gray-500 font-inter">
                                <SelectValue placeholder="Select a branch" />
                            </SelectTrigger>
                            <SelectContent className="!bg-[#F1F2E9]">
                                {branches.map((branch) => (
                                    <SelectItem key={branch.id} value={branch.id.toString()}>
                                        {branch.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                        <Button
                            onClick={() => onOpenChange(false)}
                            variant="outline"
                            className="flex items-center justify-center gap-1 rounded-3xl px-4 py-2.5"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDuplicate}
                            disabled={!selectedBranchId || loading}
                            className="flex items-center justify-center gap-1 rounded-3xl text-main-yellow bg-main-green px-4 py-2.5"
                        >
                            {loading && <Loader2 className="h-5 w-5 animate-spin" />}
                            Duplicate
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}