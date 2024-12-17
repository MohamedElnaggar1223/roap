import { checkAcademyStatus } from "@/lib/actions/check-academy-status";
import Calendar from "./sports-calendar";
import { redirect } from "next/navigation";

export default async function CalendarPage() {
    const status = await checkAcademyStatus()

    if (!status.isOnboarded) {
        return redirect('/academy')
    }

    return <Calendar />
}