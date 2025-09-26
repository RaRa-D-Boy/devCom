"use client";

import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  UserPlus,
  MessageCircle,
  Heart,
  Users,
  X,
  Check,
  CheckCheck,
} from "lucide-react";
import { useTheme } from "@/contexts/theme-context";
import { FriendRequestsList } from "./friend-requests-list";

interface Notification {
  id: string;
  type:
    | "friend_request"
    | "friend_accepted"
    | "message"
    | "post_like"
    | "post_comment"
    | "group_invite";
  title: string;
  message: string;
  data: any;
  is_read: boolean;
  created_at: string;
}

interface NotificationsListProps {
  user: User;
}

export function NotificationsList({ user }: NotificationsListProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAsRead, setMarkingAsRead] = useState<string | null>(null);

  // Safe theme hook usage with fallback
  let theme = "light";
  let glassEffect = "translucent";

  try {
    const themeContext = useTheme();
    theme = themeContext.theme;
    glassEffect = themeContext.glassEffect;
  } catch (error) {
    console.warn(
      "Theme context not available in NotificationsList component, using fallback values"
    );
  }

  const isDarkTheme = theme === "dark";

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/notifications");
      const result = await response.json();

      if (response.ok) {
        setNotifications(result.notifications || []);
        setUnreadCount(result.unreadCount || 0);
      } else {
        console.error("Failed to load notifications:", result.error);
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      setMarkingAsRead(notificationId);
      const response = await fetch("/api/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notification_id: notificationId,
          action: "mark_read",
        }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === notificationId ? { ...notif, is_read: true } : notif
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    } finally {
      setMarkingAsRead(null);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "mark_all_read",
        }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notif) => ({ ...notif, is_read: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications?id=${notificationId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.filter((notif) => notif.id !== notificationId)
        );
        // Update unread count if the deleted notification was unread
        const deletedNotification = notifications.find(
          (notif) => notif.id === notificationId
        );
        if (deletedNotification && !deletedNotification.is_read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "friend_request":
        return <UserPlus className="h-4 w-4" />;
      case "friend_accepted":
        return <Check className="h-4 w-4" />;
      case "message":
        return <MessageCircle className="h-4 w-4" />;
      case "post_like":
        return <Heart className="h-4 w-4" />;
      case "post_comment":
        return <MessageCircle className="h-4 w-4" />;
      case "group_invite":
        return <Users className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "friend_request":
        return isDarkTheme ? "text-blue-400" : "text-blue-600";
      case "friend_accepted":
        return isDarkTheme ? "text-green-400" : "text-green-600";
      case "message":
        return isDarkTheme ? "text-purple-400" : "text-purple-600";
      case "post_like":
        return isDarkTheme ? "text-red-400" : "text-red-600";
      case "post_comment":
        return isDarkTheme ? "text-orange-400" : "text-orange-600";
      case "group_invite":
        return isDarkTheme ? "text-indigo-400" : "text-indigo-600";
      default:
        return isDarkTheme ? "text-gray-400" : "text-gray-600";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Friend Requests Section */}
      <FriendRequestsList user={user} />

      {/* Notifications Section */}
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell
              className={`h-5 w-5 ${isDarkTheme ? "text-white" : "text-black"}`}
            />
            <h2
              className={`text-lg font-semibold ${
                isDarkTheme ? "text-white" : "text-black"
              }`}
            >
              Notifications
            </h2>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className={`text-xs ${
                isDarkTheme
                  ? "border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                  : "border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell
                className={`h-12 w-12 mx-auto mb-4 ${
                  isDarkTheme ? "text-gray-600" : "text-gray-400"
                }`}
              />
              <p
                className={`text-sm ${
                  isDarkTheme ? "text-gray-400" : "text-gray-600"
                }`}
              >
                No notifications yet
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`transition-all duration-200 ${
                  !notification.is_read
                    ? isDarkTheme
                      ? "bg-primary/10 border-primary/30"
                      : "bg-primary/5 border-primary/20"
                    : ""
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    {/* Avatar */}
                    {notification.data?.sender_avatar ||
                    notification.data?.accepter_avatar ? (
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={
                            notification.data?.sender_avatar ||
                            notification.data?.accepter_avatar
                          }
                        />
                        <AvatarFallback className="bg-neutral-700 text-white text-sm">
                          {
                            (notification.data?.sender_name ||
                              notification.data?.accepter_name)?.[0]
                          }
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center ${getNotificationColor(
                          notification.type
                        )}`}
                      >
                        {getNotificationIcon(notification.type)}
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p
                            className={`text-sm font-medium ${
                              isDarkTheme ? "text-white" : "text-black"
                            }`}
                          >
                            {notification.title}
                          </p>
                          <p
                            className={`text-sm mt-1 ${
                              isDarkTheme ? "text-gray-300" : "text-gray-600"
                            }`}
                          >
                            {notification.message}
                          </p>
                          <p
                            className={`text-xs mt-2 ${
                              isDarkTheme ? "text-gray-500" : "text-gray-500"
                            }`}
                          >
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-1 ml-2">
                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              disabled={markingAsRead === notification.id}
                              className={`h-6 w-6 p-0 ${
                                isDarkTheme
                                  ? "text-gray-300 hover:text-white hover:bg-gray-700"
                                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                              }`}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                            className={`h-6 w-6 p-0 ${
                              isDarkTheme
                                ? "text-gray-400 hover:text-red-400 hover:bg-gray-700"
                                : "text-gray-500 hover:text-red-500 hover:bg-gray-100"
                            }`}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
