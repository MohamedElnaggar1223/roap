'use client'

import React, { useEffect, useState } from 'react'
import { Bell, CheckCircle2, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createClient } from '@/utils/supabase/client'
import { formatDistanceToNow } from 'date-fns'

type Props = {
    academicId: number
}

type Notification = {
    created_at: string | null
    data: string
    id: string
    notifiable_id: number
    notifiable_type: string
    read_at: string | null
    type: string
    updated_at: string | null
    booking?: {
        id: number
        profile: {
            name: string
        } | null
        package: {
            name: string
        } | null
    }
}

const NotificationsComponent: React.FC<Props> = ({ academicId }) => {
    const supabase = createClient()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const [open, setOpen] = useState(false)

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                // Get the academy owner's user_id and all athletes' user_ids
                const { data: academic, error: academicError } = await supabase
                    .from('academics')
                    .select('user_id')
                    .eq('id', academicId)
                    .single()

                if (academicError) throw academicError

                const { data: athleticUsers, error: athleticError } = await supabase
                    .from('academic_athletic')
                    .select('user_id')
                    .eq('academic_id', academicId)

                if (athleticError) throw athleticError

                // Create array of all possible notifiable_ids
                const notifiableIds = [
                    academicId, // Academy itself
                    academic.user_id, // Academy owner
                    ...athleticUsers.map(au => au.user_id) // All athletes
                ].filter(Boolean)

                // First fetch notifications
                const { data: notificationsData, error } = await supabase
                    .from('notifications')
                    .select('*')
                    .in('notifiable_id', notifiableIds)
                    .order('created_at', { ascending: false })

                if (error) throw error

                // Then fetch booking details for booking notifications
                const notificationsWithBookings = await Promise.all(
                    notificationsData.map(async (notification) => {
                        try {
                            const cleanedData = notification.data.replace(/\\/g, '');
                            const data = JSON.parse(cleanedData);

                            // console.log('Notification data:', data)

                            if (data.title === 'booking_completed' && data.relatable_type === 'booking_completed') {
                                const { data: bookingData, error: bookingError } = await supabase
                                    .from('bookings')
                                    .select(`
                                        id,
                                        profile_id,
                                        package_id
                                    `)
                                    .eq('id', data.relatable_id)
                                    .single()

                                // console.log('Booking data:', bookingData)
                                if (bookingError || !bookingData?.profile_id || !bookingData?.package_id) return notification

                                const { data: profileData, error: profileError } = await supabase
                                    .from('profiles')
                                    .select('name')
                                    .eq('id', bookingData?.profile_id)
                                    .single()

                                const { data: packageData, error: packageError } = await supabase
                                    .from('packages')
                                    .select('name')
                                    .eq('id', bookingData?.package_id)
                                    .single()


                                if (!bookingError && bookingData) {
                                    return {
                                        ...notification,
                                        booking: {
                                            id: bookingData.id,
                                            profile: profileData,
                                            package: packageData
                                        }
                                    }
                                }
                            }
                            return notification
                        } catch (error) {
                            console.error('Error processing notification data:', error)
                            return notification
                        }
                    })
                )

                setNotifications(notificationsWithBookings)
            } catch (error) {
                console.error('Error fetching notifications:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchNotifications()
    }, [academicId])

    useEffect(() => {
        let notifiableIds: number[] = []

        // First fetch the IDs we need to watch
        const setupSubscription = async () => {
            try {
                const { data: academic } = await supabase
                    .from('academics')
                    .select('user_id')
                    .eq('id', academicId)
                    .single()

                const { data: athleticUsers } = await supabase
                    .from('academic_athletic')
                    .select('user_id')
                    .eq('academic_id', academicId)

                notifiableIds = [
                    academicId!,
                    academic?.user_id!,
                    ...(athleticUsers?.map(au => au.user_id!) || [])
                ].filter(Boolean)

                // Now set up the subscription with all IDs
                const subscription = supabase
                    .channel('notifications_channel')
                    .on(
                        'postgres_changes',
                        {
                            event: '*',
                            schema: 'public',
                            table: 'notifications',
                            filter: `notifiable_id=in.(${notifiableIds.join(',')})`,
                        },
                        (payload) => {
                            if (payload.eventType === 'INSERT') {
                                setNotifications((prev) => [payload.new as Notification, ...prev])
                            } else if (payload.eventType === 'UPDATE') {
                                setNotifications((prev) =>
                                    prev.map((notification) =>
                                        notification.id === payload.new.id
                                            ? (payload.new as Notification)
                                            : notification
                                    )
                                )
                            } else if (payload.eventType === 'DELETE') {
                                setNotifications((prev) =>
                                    prev.filter((notification) => notification.id !== payload.old.id)
                                )
                            }
                        }
                    )
                    .subscribe()

                return () => {
                    supabase.removeChannel(subscription)
                }
            } catch (error) {
                console.error('Error setting up notification subscription:', error)
            }
        }

        setupSubscription()
    }, [academicId])

    const markAsRead = async (notificationId: string) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ read_at: new Date().toISOString() })
                .eq('id', notificationId)

            if (error) throw error

            setNotifications((prev) =>
                prev.map((notification) =>
                    notification.id === notificationId
                        ? { ...notification, read_at: new Date().toISOString() }
                        : notification
                )
            )
        } catch (error) {
            console.error('Error marking notification as read:', error)
        }
    }

    const unreadCount = notifications.filter((n) => !n.read_at).length

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className="relative h-10 w-10 rounded-full bg-transparent"
                >
                    <Bell className="h-6 w-6 text-[#1F441F]" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-500" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b border-[#CDD1C7]">
                    <h2 className="text-lg font-semibold text-[#1F441F]">Notifications</h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setOpen(false)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
                <ScrollArea className="h-[400px]">
                    {loading ? (
                        <div className="flex justify-center items-center h-full">
                            <p className="text-[#454745]">Loading notifications...</p>
                        </div>
                    ) : notifications.length > 0 ? (
                        notifications.map((notification) => {
                            let data;
                            try {
                                const cleanedData = notification.data.replace(/\\/g, '');
                                data = JSON.parse(cleanedData);

                                return (
                                    <div
                                        key={notification.id}
                                        className={`p-4 border-b border-[#CDD1C7] ${!notification.read_at ? 'bg-[#F1F2E9]' : 'bg-white'}`}
                                        onClick={() => !notification.read_at && markAsRead(notification.id)}
                                    >
                                        <div className="flex items-start gap-3">
                                            {data.icon && (
                                                <img
                                                    src={data.icon}
                                                    alt="Notification"
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                            )}
                                            <div className="flex-1">
                                                {data.title === 'booking_completed' ? (
                                                    <p className="text-sm text-[#454745]">
                                                        <span className="font-medium text-[#1F441F]">
                                                            {notification.booking?.profile?.name || 'Unknown'}
                                                        </span>
                                                        : new booking completed for{' '}
                                                        <span className="font-medium">
                                                            {notification.booking?.package?.name || 'Unknown Package'}
                                                        </span>
                                                    </p>
                                                ) : (
                                                    <>
                                                        <h3 className="font-medium text-[#1F441F]">{data.title}</h3>
                                                        <p className="text-sm text-[#454745] mt-1">{data.description}</p>
                                                    </>
                                                )}
                                                <div className="text-xs text-[#6A6C6A] mt-1">
                                                    {formatDistanceToNow(new Date(notification.created_at!), {
                                                        addSuffix: true
                                                    })}
                                                </div>
                                            </div>
                                            {notification.read_at && (
                                                <div className="flex items-center gap-1 text-[#1F441F]">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    <span className="text-xs">Read</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            } catch (error) {
                                console.error('Error processing notification:', error);
                                return null;
                            }
                        })
                    ) : (
                        <div className="flex justify-center items-center h-full">
                            <p className="text-[#454745]">No notifications</p>
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    )
}

export default NotificationsComponent

