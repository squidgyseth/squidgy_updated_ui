import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Phone, Video, Info, Send, Paperclip, Smile, Mic } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { TouchButton } from '../layout/TouchButton';
import { Input } from '../../ui/input';
import { cn } from '../../../lib/utils';

interface Message {
  id: string;
  content: string;
  timestamp: Date;
  isUser: boolean;
  type?: 'text' | 'image' | 'file';
}

interface Agent {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  isOnline: boolean;
}

interface MobileChatWindowProps {
  agent: Agent;
  messages?: Message[];
  onBack?: () => void;
  onSendMessage?: (message: string) => void;
  isTyping?: boolean;
}

// Sample messages based on the screenshot
const sampleMessages: Message[] = [
  {
    id: '1',
    content: "Hey there! I'm your Solar Sales Assistant. I'm here to help you qualify leads, generate quotes, handle objections, and close more solar deals. We've got 47 new leads today - ready to get started?",
    timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    isUser: false,
  },
];

const quickSuggestions = [
  'Qualify this lead for solar',
  'Calculate ROI for residential install',
];

export function MobileChatWindow({
  agent,
  messages = sampleMessages,
  onBack,
  onSendMessage,
  isTyping = false,
}: MobileChatWindowProps) {
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim() && onSendMessage) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (onSendMessage) {
      onSendMessage(suggestion);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-background border-b border-border">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Back button */}
          <TouchButton
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="p-2 h-8 w-8 flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </TouchButton>

          {/* Agent info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage src={agent.avatar} alt={agent.name} />
                <AvatarFallback className="bg-gradient-to-br from-red-500 to-purple-600 text-white text-sm">
                  {agent.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {agent.isOnline && (
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-background rounded-full" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">
                {agent.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                {agent.isOnline ? 'Active now' : 'Last seen recently'}
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <TouchButton variant="ghost" size="sm" className="p-2 h-8 w-8">
            <Phone className="h-4 w-4" />
          </TouchButton>
          <TouchButton variant="ghost" size="sm" className="p-2 h-8 w-8">
            <Video className="h-4 w-4" />
          </TouchButton>
          <TouchButton variant="ghost" size="sm" className="p-2 h-8 w-8">
            <Info className="h-4 w-4" />
          </TouchButton>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex gap-3',
              message.isUser ? 'justify-end' : 'justify-start'
            )}
          >
            {/* Avatar for agent messages */}
            {!message.isUser && (
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={agent.avatar} alt={agent.name} />
                <AvatarFallback className="bg-gradient-to-br from-red-500 to-purple-600 text-white text-xs">
                  {agent.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}

            {/* Message bubble */}
            <div className={cn(
              'max-w-[280px] rounded-2xl px-4 py-2',
              message.isUser
                ? 'bg-primary text-primary-foreground rounded-br-sm'
                : 'bg-muted text-foreground rounded-bl-sm'
            )}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.content}
              </p>
              <p className={cn(
                'text-xs mt-1',
                message.isUser
                  ? 'text-primary-foreground/70'
                  : 'text-muted-foreground'
              )}>
                {formatTime(message.timestamp)}
              </p>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={agent.avatar} alt={agent.name} />
              <AvatarFallback className="bg-gradient-to-br from-red-500 to-purple-600 text-white text-xs">
                {agent.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-2">
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" />
                <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce delay-100" />
                <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick suggestions */}
      {quickSuggestions.length > 0 && (
        <div className="px-4 pb-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {quickSuggestions.map((suggestion, index) => (
              <TouchButton
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleSuggestionClick(suggestion)}
                className="flex-shrink-0 text-xs h-8 px-3"
              >
                {suggestion}
              </TouchButton>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="p-4 border-t border-border bg-background">
        <div className="flex items-end gap-2">
          {/* Input field */}
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${agent.name}...`}
              className="pr-20 h-11 bg-muted/30 border-muted focus:border-primary resize-none"
            />
            
            {/* Input actions */}
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
              <TouchButton variant="ghost" size="sm" className="p-1 h-6 w-6">
                <Paperclip className="h-3 w-3" />
              </TouchButton>
              <TouchButton variant="ghost" size="sm" className="p-1 h-6 w-6">
                <Smile className="h-3 w-3" />
              </TouchButton>
            </div>
          </div>

          {/* Voice/Send button */}
          {inputValue.trim() ? (
            <TouchButton
              variant="default"
              size="sm"
              onClick={handleSend}
              className="h-11 w-11 rounded-full bg-primary hover:bg-primary/90 p-0"
            >
              <Send className="h-4 w-4" />
            </TouchButton>
          ) : (
            <TouchButton
              variant={isRecording ? "destructive" : "default"}
              size="sm"
              onClick={() => setIsRecording(!isRecording)}
              className={cn(
                "h-11 w-11 rounded-full p-0",
                isRecording 
                  ? "bg-red-500 hover:bg-red-600" 
                  : "bg-primary hover:bg-primary/90"
              )}
            >
              <Mic className={cn("h-4 w-4", isRecording && "animate-pulse")} />
            </TouchButton>
          )}
        </div>
      </div>
    </div>
  );
}