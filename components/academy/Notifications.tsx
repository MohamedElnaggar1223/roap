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
    id: string
    title: string
    description: string
    user_id: number | null
    profile_id: number | null
    academic_id: number | null
    read_at: string | null
    created_at: string | null
    updated_at: string | null
    profile?: {
        name: string
    } | null
    academic?: {
        academic_translations: {
            name: string | null
            locale: string
        }[]
    } | null
}

const NotificationsComponent: React.FC<Props> = ({ academicId }) => {
    const supabase = createClient()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const [open, setOpen] = useState(false)

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const { data: notificationsData, error } = await supabase
                    .from('notifications')
                    .select(`
                        *,
                        profile:profiles(name),
                        academic:academics(
                            academic_translations(
                                name,
                                locale
                            )
                        )
                    `)
                    .eq('academic_id', academicId)
                    .order('created_at', { ascending: false })

                if (error) throw error

                setNotifications(notificationsData || [])
            } catch (error) {
                console.error('Error fetching notifications:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchNotifications()

        // Set up realtime subscription
        const subscription = supabase
            .channel('notifications_channel')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notifications',
                    filter: `academic_id=eq.${academicId}`,
                },
                async (payload) => {
                    if (payload.eventType === 'INSERT') {
                        // Fetch the complete notification with relations
                        const { data: newNotification } = await supabase
                            .from('notifications')
                            .select(`
                                *,
                                profile:profiles(name),
                                academic:academics(
                                    academic_translations(
                                        name,
                                        locale
                                    )
                                )
                            `)
                            .eq('id', payload.new.id)
                            .single()

                        if (newNotification) {
                            setNotifications(prev => [newNotification, ...prev])
                        }
                    } else if (payload.eventType === 'UPDATE') {
                        setNotifications(prev =>
                            prev?.map(notification =>
                                notification.id === payload.new.id
                                    ? { ...notification, ...payload.new }
                                    : notification
                            )
                        )
                    } else if (payload.eventType === 'DELETE') {
                        setNotifications(prev =>
                            prev.filter(notification => notification.id !== payload.old.id)
                        )
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(subscription)
        }
    }, [academicId])

    const markAsRead = async (notificationId: string) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ read_at: new Date().toISOString() })
                .eq('id', notificationId)

            if (error) throw error

            setNotifications(prev =>
                prev?.map(notification =>
                    notification.id === notificationId
                        ? { ...notification, read_at: new Date().toISOString() }
                        : notification
                )
            )
        } catch (error) {
            console.error('Error marking notification as read:', error)
        }
    }

    const unreadCount = notifications.filter(n => !n.read_at).length

    const getAcademicName = (notification: Notification) => {
        if (!notification.academic?.academic_translations?.length) return null

        // Try to find english translation first
        const englishTranslation = notification.academic.academic_translations
            .find(t => t.locale === 'en')

        // If no english translation, use the first available
        return englishTranslation?.name || notification.academic.academic_translations[0].name
    }

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
                        notifications?.map((notification) => (
                            <div
                                key={notification.id}
                                className={`p-4 border-b border-[#CDD1C7] cursor-pointer ${!notification.read_at ? 'bg-[#F1F2E9]' : 'bg-white'}`}
                                onClick={() => !notification.read_at && markAsRead(notification.id)}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex-1">
                                        <h3 className="font-medium text-[#1F441F]">{notification.title}</h3>
                                        <p className="text-sm text-[#454745] mt-1">{notification.description}</p>
                                        {notification.profile && (
                                            <p className="text-sm text-[#6A6C6A] mt-1">
                                                Student: {notification.profile.name}
                                            </p>
                                        )}
                                        {notification.academic && (
                                            <p className="text-sm text-[#6A6C6A] mt-1">
                                                Academy: {getAcademicName(notification)}
                                            </p>
                                        )}
                                        <div className="text-xs text-[#6A6C6A] mt-1">
                                            {notification.created_at && formatDistanceToNow(new Date(notification.created_at), {
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
                        ))
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