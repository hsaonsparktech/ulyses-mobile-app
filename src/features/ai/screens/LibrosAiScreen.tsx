import { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Badge } from "@/components/ui/Badge";
import { SvgIcon } from "@/components/ui/SvgIcon";
import { useAiStore } from "../store";

export function LibrosAiScreen() {
  const { messages, suggestions, isThinking, sendMessage, clearConversation } =
    useAiStore();
  const [inputText, setInputText] = useState("");
  const scrollViewRef = useRef<ScrollView>(null);

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText("");
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSelectSuggestion = (prompt: string) => {
    sendMessage(prompt);
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface-primary"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View className="px-6 pt-12 pb-4 bg-surface-primary border-b border-border-subtle">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center space-x-3">
            <View className="w-10 h-10 rounded-full bg-accent-purple/10 items-center justify-center">
              <SvgIcon name="cpu" size={20} color="#7C3AED" />
            </View>
            <View>
              <Text className="text-xl font-bold text-content-primary">
                Libros AI
              </Text>
              <Text className="text-xs text-content-secondary">
                Figma Frame 36:938 · Financial Co-pilot
              </Text>
            </View>
          </View>
          <View className="flex-row items-center space-x-2">
            <Badge variant="success" size="sm" label="Online" />
            <Pressable
              onPress={clearConversation}
              className="w-9 h-9 rounded-full bg-surface-secondary items-center justify-center border border-border-subtle"
              accessibilityLabel="Clear chat conversation"
            >
              <SvgIcon name="trash-2" size={16} color="#6B7280" />
            </Pressable>
          </View>
        </View>

        {/* Business Scope Banner */}
        <View className="flex-row items-center bg-surface-secondary px-3 py-1.5 rounded-lg border border-border-subtle">
          <SvgIcon name="shield" size={12} color="#1570EF" />
          <Text className="text-[11px] text-content-secondary ml-1.5 font-medium">
            Scoped to:{" "}
            <Text className="font-bold text-content-primary">
              Acme Services LLC
            </Text>{" "}
            ledger
          </Text>
        </View>
      </View>

      {/* Chat Messages */}
      <ScrollView
        ref={scrollViewRef}
        className="flex-1 px-6 py-4"
        contentContainerStyle={{ paddingBottom: 24 }}
        onContentSizeChange={() =>
          scrollViewRef.current?.scrollToEnd({ animated: true })
        }
      >
        {/* Messages List */}
        <View className="space-y-4">
          {messages.map((msg) => {
            const isUser = msg.sender === "user";
            return (
              <View
                key={msg.id}
                className={`flex-row ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <View className="w-8 h-8 rounded-full bg-accent-purple/10 items-center justify-center mr-2.5 mt-1">
                    <SvgIcon name="cpu" size={16} color="#7C3AED" />
                  </View>
                )}

                <View
                  className={`max-w-[85%] rounded-2xl p-4 ${
                    isUser
                      ? "bg-brand-primary rounded-tr-sm"
                      : "bg-surface-secondary border border-border-subtle rounded-tl-sm"
                  }`}
                >
                  <Text
                    className={`text-sm leading-5 ${
                      isUser ? "text-white font-medium" : "text-content-primary"
                    }`}
                  >
                    {msg.text}
                  </Text>

                  {/* Insight Card if present */}
                  {msg.insightCard && (
                    <View className="mt-3 pt-3 border-t border-border-subtle bg-surface-primary rounded-xl p-3 border border-border-subtle">
                      <Text className="text-xs font-bold text-content-primary mb-2">
                        {msg.insightCard.title}
                      </Text>
                      <View className="space-y-2 mb-2">
                        {msg.insightCard.metrics.map((m) => (
                          <View
                            key={m.label}
                            className="flex-row items-center justify-between"
                          >
                            <Text className="text-xs text-content-secondary">
                              {m.label}
                            </Text>
                            <View className="flex-row items-center space-x-1">
                              <Text className="text-xs font-bold text-content-primary">
                                {m.value}
                              </Text>
                              {m.change && (
                                <Text className="text-[10px] text-feedback-success font-semibold">
                                  {m.change}
                                </Text>
                              )}
                            </View>
                          </View>
                        ))}
                      </View>
                      {msg.insightCard.actionLabel && (
                        <Pressable className="mt-1 pt-2 border-t border-border-subtle items-center">
                          <Text className="text-xs font-bold text-brand-primary">
                            {msg.insightCard.actionLabel} →
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  )}

                  {/* Mandatory AI review disclaimer on assistant messages */}
                  {!isUser && (
                    <Text className="text-[10px] text-content-secondary mt-2 pt-1 border-t border-border-subtle/50 italic">
                      AI assisted. Always reviewed. Libros AI calculations are
                      preliminary guidance and require user confirmation.
                    </Text>
                  )}

                  <Text
                    className={`text-[9px] mt-1 text-right ${
                      isUser ? "text-white/70" : "text-content-disabled"
                    }`}
                  >
                    {msg.timestamp}
                  </Text>
                </View>
              </View>
            );
          })}

          {/* Thinking indicator */}
          {isThinking && (
            <View className="flex-row items-center space-x-2 p-3 bg-surface-secondary rounded-2xl self-start border border-border-subtle">
              <ActivityIndicator size="small" color="#7C3AED" />
              <Text className="text-xs font-medium text-content-secondary">
                Libros AI is analyzing financial records...
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Suggestion Chips */}
      <View className="px-6 py-2.5 bg-surface-primary border-t border-border-subtle">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row"
        >
          {suggestions.map((sug) => (
            <Pressable
              key={sug.id}
              onPress={() => handleSelectSuggestion(sug.prompt)}
              className="mr-2 px-3 py-1.5 rounded-full bg-surface-secondary border border-border-subtle flex-row items-center active:bg-surface-tertiary"
              accessibilityLabel={`Suggest prompt: ${sug.prompt}`}
            >
              <SvgIcon name="sparkles" size={12} color="#7C3AED" />
              <Text className="text-xs font-medium text-content-primary ml-1.5">
                {sug.prompt}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Input Bar */}
      <View className="px-6 py-3 bg-surface-primary border-t border-border-subtle">
        <View className="flex-row items-center bg-surface-secondary rounded-2xl px-4 py-2 border border-border-subtle">
          <TextInput
            className="flex-1 text-sm text-content-primary max-h-24"
            placeholder="Ask Libros AI about invoices, taxes, expenses..."
            placeholderTextColor="#9CA3AF"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
            multiline
          />
          <Pressable
            onPress={handleSend}
            disabled={!inputText.trim()}
            className={`w-9 h-9 rounded-full items-center justify-center ml-2 ${
              inputText.trim() ? "bg-brand-primary" : "bg-surface-tertiary"
            }`}
            accessibilityLabel="Send message to Libros AI"
          >
            <SvgIcon
              name="arrow-up"
              size={18}
              color={inputText.trim() ? "#FFFFFF" : "#9CA3AF"}
            />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
