"use client";

import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { Badge } from "@/components/ui/badge";

interface NotificationBadgeProps {
  user: User;
}

export function NotificationBadge({ user }: NotificationBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchUnreadCount = async () => {
      try {
        // Fetch both notifications and friend requests
        const [notificationsResponse, friendRequestsResponse] = await Promise.all([
          fetch('/api/notifications'),
          fetch('/api/friends?type=requests')
        ]);

        let totalUnreadCount = 0;

        if (notificationsResponse.ok) {
          const notificationsResult = await notificationsResponse.json();
          totalUnreadCount += notificationsResult.unreadCount || 0;
        }

        if (friendRequestsResponse.ok) {
          const friendRequestsResult = await friendRequestsResponse.json();
          totalUnreadCount += friendRequestsResult.requests?.length || 0;
        }

        setUnreadCount(totalUnreadCount);
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    // Fetch initial count
    fetchUnreadCount();

    // Set up polling for real-time updates (every 30 seconds)
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, [user]);

  if (unreadCount === 0) {
    return null;
  }

  return (
    <Badge 
      variant="destructive" 
      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
    >
      {unreadCount > 99 ? '99+' : unreadCount}
    </Badge>
  );
}
