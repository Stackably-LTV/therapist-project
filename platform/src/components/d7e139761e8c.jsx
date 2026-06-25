"use client";
import * as React from "react";
import { cn } from "@/components/98e56006aa84";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/2318256b5648";
const MessageContext = React.createContext(undefined);
function useMessage() {
    const context = React.useContext(MessageContext);
    if (!context) {
        throw new Error("Message components must be used within <Message />");
    }
    return context;
}
function Message({ from, className, children, ...props }) {
    return (<MessageContext.Provider value={{ from }}>
      <div data-slot="message" data-from={from} className={cn("flex gap-3 w-full", from === "user" ? "flex-row-reverse" : "flex-row", className)} {...props}>
        {children}
      </div>
    </MessageContext.Provider>);
}
function MessageAvatar({ src, name, fallback, role }) {
    const { from } = useMessage();
    const initials = fallback || name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "?";
    const getAvatarGradient = () => {
        if (from === "user") {
            return "bg-gradient-to-br from-blue-500 to-cyan-600 text-white";
        }
        if (role === "therapist") {
            return "bg-gradient-to-br from-purple-500 to-pink-600 text-white";
        }
        return "bg-gradient-to-br from-blue-500 to-cyan-600 text-white";
    };
    return (<Avatar data-slot="message-avatar" className="h-10 w-10 flex-shrink-0 ring-2 ring-white shadow-sm">
      {src && <AvatarImage src={src} alt={name || 'User'}/>}
      <AvatarFallback className={cn("text-sm font-bold", getAvatarGradient())}>
        {initials}
      </AvatarFallback>
    </Avatar>);
}
function MessageContent({ className, children, timestamp, ...props }) {
    const { from } = useMessage();
    return (<div data-slot="message-content-wrapper" className="flex flex-col gap-1 max-w-[75%]">
      <div data-slot="message-content" className={cn("rounded-2xl px-4 py-2.5 text-sm leading-relaxed", from === "user"
            ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-br-sm"
            : "bg-gray-100 text-gray-900 rounded-bl-sm", className)} {...props}>
        {children}
      </div>
      {timestamp && (<span className={cn("text-xs text-gray-500 px-1", from === "user" ? "text-right" : "text-left")}>
          {timestamp}
        </span>)}
    </div>);
}
export { Message, MessageAvatar, MessageContent };
