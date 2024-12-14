'use client'
import { Loader2, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog-no-close";

export default function LogOutBtn() {
    const [loading, setLoading] = useState(false)

    const handleLogout = async () => {
        setLoading(true)
        await signOut()
        setLoading(false)
    }

    return (
        <>
            <div className="flex items-center gap-2 text-sm bg-main-green rounded-3xl ml-auto mt-4 px-4 py-2 w-fit text-main-yellow">
                <button
                    type="button"
                    className="flex items-center gap-2 text-sm text-main-yellow"
                    onClick={handleLogout}
                >
                    <LogOut className="h-4 w-4" />
                    Log Out
                </button>
            </div>
            <Dialog open={loading}>
                <DialogContent className='flex items-center justify-center bg-transparent border-none shadow-none outline-none'>
                    <DialogTitle />
                    <Loader2 className='animate-spin' size={42} color="#000" />
                </DialogContent>
            </Dialog>
        </>
    );
}