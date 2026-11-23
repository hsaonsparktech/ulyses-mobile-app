import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SvgIcon } from "@/components/ui/SvgIcon";
import { useNotificationStore } from "../store";

interface NotificationsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function NotificationsModal({
  visible,
  onClose,
}: NotificationsModalProps) {
  const { notifications, markAsRead, markAllAsRead, clearAll } =
    useNotificationStore();
  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case "payment":
        return <SvgIcon name="dollar-sign" size={16} color="#059669" />;
      case "scan":
        return <SvgIcon name="file-text" size={16} color="#1570EF" />;
      case "tax":
        return <SvgIcon name="alert-circle" size={16} color="#D97706" />;
      default:
        return <SvgIcon name="users" size={16} color="#7C3AED" />;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-surface" edges={["top", "bottom"]}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pt-2 pb-4 border-b border-border bg-surface">
          <View className="flex-row items-center space-x-3">
            <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
              <SvgIcon name="bell" size={20} color="#1570EF" />
            </View>
            <View collapsable={false}>
              <Text
                className="text-xl font-bold text-text"
                accessibilityRole="header"
              >
                Notifications
              </Text>
              <Text className="text-xs text-textMuted">
                Figma Frame 37:953 · {unreadCount} Unread
              </Text>
            </View>
          </View>
          <Pressable
            onPress={onClose}
            className="w-9 h-9 rounded-full bg-surface border border-border items-center justify-center min-h-[44px] min-w-[44px]"
            accessibilityRole="button"
            accessibilityLabel="Close notifications"
            collapsable={false}
          >
            <SvgIcon name="x" size={20} color="#6B7280" />
          </Pressable>
        </View>

        {/* Toolbar */}
        <View className="flex-row items-center justify-between px-6 py-3 border-b border-border-subtle bg-surface-secondary/40">
          <Pressable
            onPress={markAllAsRead}
            disabled={unreadCount === 0}
            accessibilityLabel="Mark all as read"
          >
            <Text
              className={`text-xs font-semibold ${
                unreadCount > 0 ? "text-brand-primary" : "text-content-disabled"
              }`}
            >
              Mark all as read
            </Text>
          </Pressable>
          <Pressable
            onPress={clearAll}
            accessibilityLabel="Clear all notifications"
          >
            <Text className="text-xs font-semibold text-content-secondary">
              Clear all
            </Text>
          </Pressable>
        </View>

        {/* Notifications list */}
        <ScrollView
          className="flex-1 px-6 py-4"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {notifications.length === 0 ? (
            <View className="items-center justify-center py-20">
              <View className="w-16 h-16 rounded-full bg-surface-secondary items-center justify-center mb-4">
                <SvgIcon name="bell-off" size={28} color="#9CA3AF" />
              </View>
              <Text className="text-base font-bold text-content-primary mb-1">
                No notifications
              </Text>
              <Text className="text-xs text-content-secondary text-center">
                You're all caught up! Updates about invoices and scans will
                appear here.
              </Text>
            </View>
          ) : (
            <View className="space-y-3">
              {notifications.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => markAsRead(item.id)}
                  className={`p-4 rounded-2xl border ${
                    !item.read
                      ? "bg-surface-secondary border-brand-primary/30"
                      : "bg-surface-primary border-border-subtle"
                  }`}
                  accessibilityLabel={`Notification: ${item.title}`}
                >
                  <View className="flex-row items-start space-x-3">
                    <View className="w-8 h-8 rounded-full bg-surface-secondary items-center justify-center mt-0.5">
                      {getIcon(item.type)}
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-sm font-bold text-content-primary">
                          {item.title}
                        </Text>
                        {!item.read && (
                          <View className="w-2 h-2 rounded-full bg-brand-primary" />
                        )}
                      </View>
                      <Text className="text-xs text-content-secondary leading-4 mt-1">
                        {item.message}
                      </Text>
                      <Text className="text-[10px] text-content-disabled mt-2">
                        {item.timestamp}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
