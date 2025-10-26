import { useState, useEffect } from "react";
import { createProxyUrl, maskStorageUrlsInText } from "../../utils/urlMasking";

interface ChatAreaProps {
  selectedAssistant: string;
  onToggleDetails: () => void;
  onToggleSidebar: () => void;
}

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

export default function ChatArea({ selectedAssistant, onToggleDetails, onToggleSidebar }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const assistantData = {
    "Personal Assistant": {
      name: "Personal Assistant",
      description: "active • Always here to help.",
      avatar: "https://api.builder.io/api/v1/image/assets/TEMP/67bd34c904bea0de4f9e4c9c66814ba3425c5a06?width=64",
      isOnline: true,
      greeting: "Hi! I'm your Personal Assistant. I'm here to help you with any tasks or questions you might have. How can I assist you today?"
    },
    "SMM Assistant": {
      name: "SMM Assistant",
      description: "active • Trend. Post. Analyze.",
      avatar: "https://api.builder.io/api/v1/image/assets/TEMP/5de94726d88f958a1bdd5755183ee631960b155f?width=64",
      isOnline: true,
      greeting: "Hi! I'm your SMM Assistant. I'm here to help you create engaging social media content, analyze trends, and grow your online presence. What can I help you with today?"
    },
    "Content Strategist": {
      name: "Content Strategist",
      description: "active • Plan. Write. Repurpose.",
      avatar: "https://api.builder.io/api/v1/image/assets/TEMP/fae0953bfe5842c25b1a321c667188d167c18abb?width=64",
      isOnline: true,
      greeting: "Hi! I'm your Content Strategist. I specialize in planning, writing, and repurposing content to maximize your reach and engagement. What content project can I help you with?"
    },
    "Lead Generator": {
      name: "Lead Generator",
      description: "active • Find leads fast.",
      avatar: "https://api.builder.io/api/v1/image/assets/TEMP/1c1a9e476685a48c996662d5e993f34fffc24ec0?width=64",
      isOnline: true,
      greeting: "Hi! I'm your Lead Generator. I'm here to help you find and qualify potential leads quickly and efficiently. Ready to boost your sales pipeline?"
    },
    "CRM Updater": {
      name: "CRM Updater",
      description: "active • Keep data clean.",
      avatar: "https://api.builder.io/api/v1/image/assets/TEMP/aba5f5c2e7b9e818f550225ff47becc0bcd708e2?width=64",
      isOnline: true,
      greeting: "Hi! I'm your CRM Updater. I help keep your customer data clean, organized, and up-to-date. What CRM tasks can I assist you with today?"
    },
    "Recruiter Assistant": {
      name: "Recruiter Assistant",
      description: "active • Hire with ease.",
      avatar: "https://api.builder.io/api/v1/image/assets/TEMP/ffe6304047504c08d7faccb66297228d39227080?width=64",
      isOnline: true,
      greeting: "Hi! I'm your Recruiter Assistant. I'm here to help streamline your hiring process and find the best candidates. What recruiting challenge can I help you solve?"
    },
    "Onboarding Coach": {
      name: "Onboarding Coach",
      description: "active • Smooth onboarding all the way.",
      avatar: "https://api.builder.io/api/v1/image/assets/TEMP/46c75834fbbcdebb1b62ffbf7635f3f0a5191324?width=64",
      isOnline: true,
      greeting: "Hi! I'm your Onboarding Coach. I specialize in creating smooth onboarding experiences for new team members. How can I help improve your onboarding process?"
    }
  }[selectedAssistant] || {
    name: selectedAssistant,
    description: "active • Ready to help.",
    avatar: "https://api.builder.io/api/v1/image/assets/TEMP/5de94726d88f958a1bdd5755183ee631960b155f?width=64",
    isOnline: true,
    greeting: `Hi! I'm your ${selectedAssistant}. How can I help you today?`
  };

  const currentTime = "2:30 PM";

  // Clear messages when switching assistants
  useEffect(() => {
    setMessages([]);
  }, [selectedAssistant]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputMessage("");

    // Simulate assistant response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: assistantData?.greeting || `Hi! I'm your ${selectedAssistant}. How can I help you today?`,
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-4 border-b border-border-light">
        {/* Sidebar toggle */}
        <button onClick={onToggleSidebar} className="text-squidgy-primary hover:bg-gray-100 p-1 rounded transition-colors" title="Toggle Sidebar">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7.5 2.5V17.5M4.16667 2.5H15.8333C16.7538 2.5 17.5 3.24619 17.5 4.16667V15.8333C17.5 16.7538 16.7538 17.5 15.8333 17.5H4.16667C3.24619 17.5 2.5 16.7538 2.5 15.8333V4.16667C2.5 3.24619 3.24619 2.5 4.16667 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        
        {/* Assistant info */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <img 
              src={assistantData?.avatar ? createProxyUrl(assistantData.avatar, 'avatar') : assistantData?.avatar} 
              alt={assistantData?.name}
              className="w-10 h-10 rounded-full"
            />
            {assistantData?.isOnline && (
              <div className="absolute -bottom-0 -right-0 w-2.5 h-2.5 bg-text-success rounded-full border border-white" />
            )}
          </div>
          <div>
            <h1 className="text-base font-semibold text-black leading-6">{assistantData?.name}</h1>
            <p className="text-xs text-text-secondary leading-4">
              <span className="text-text-success">active </span>
              <span>• Trend. Post. Analyze.</span>
            </p>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="ml-auto flex items-center gap-4 pr-5">
          <button className="text-squidgy-primary">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11.5265 13.807C11.6986 13.886 11.8925 13.9041 12.0762 13.8582C12.26 13.8123 12.4226 13.7052 12.5373 13.5545L12.8332 13.167C12.9884 12.96 13.1897 12.792 13.4211 12.6763C13.6526 12.5606 13.9078 12.5003 14.1665 12.5003H16.6665C17.1085 12.5003 17.5325 12.6759 17.845 12.9885C18.1576 13.301 18.3332 13.725 18.3332 14.167V16.667C18.3332 17.109 18.1576 17.5329 17.845 17.8455C17.5325 18.1581 17.1085 18.3337 16.6665 18.3337C12.6883 18.3337 8.87295 16.7533 6.0599 13.9403C3.24686 11.1272 1.6665 7.31191 1.6665 3.33366C1.6665 2.89163 1.8421 2.46771 2.15466 2.15515C2.46722 1.84259 2.89114 1.66699 3.33317 1.66699H5.83317C6.2752 1.66699 6.69912 1.84259 7.01168 2.15515C7.32424 2.46771 7.49984 2.89163 7.49984 3.33366V5.83366C7.49984 6.0924 7.4396 6.34759 7.32388 6.57901C7.20817 6.81044 7.04016 7.01175 6.83317 7.16699L6.44317 7.45949C6.29018 7.57631 6.18235 7.74248 6.138 7.92978C6.09364 8.11709 6.11549 8.31397 6.19984 8.48699C7.33874 10.8002 9.21186 12.671 11.5265 13.807Z" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className="text-squidgy-primary">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13.3335 10.8334L17.686 13.7351C17.7487 13.7768 17.8216 13.8008 17.8969 13.8044C17.9722 13.808 18.0471 13.7911 18.1135 13.7555C18.1799 13.7199 18.2355 13.667 18.2742 13.6024C18.313 13.5377 18.3335 13.4638 18.3335 13.3884V6.55839C18.3335 6.48508 18.3142 6.41306 18.2775 6.3496C18.2408 6.28614 18.188 6.23349 18.1244 6.19697C18.0608 6.16045 17.9887 6.14136 17.9154 6.1416C17.8421 6.14185 17.7702 6.16144 17.7068 6.19839L13.3335 8.75006" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M11.6665 5H3.33317C2.4127 5 1.6665 5.74619 1.6665 6.66667V13.3333C1.6665 14.2538 2.4127 15 3.33317 15H11.6665C12.587 15 13.3332 14.2538 13.3332 13.3333V6.66667C13.3332 5.74619 12.587 5 11.6665 5Z" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className="text-squidgy-primary" onClick={onToggleDetails}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#clip0_info)">
                <path d="M9.99984 13.3337V10.0003M9.99984 6.66699H10.0082M18.3332 10.0003C18.3332 14.6027 14.6022 18.3337 9.99984 18.3337C5.39746 18.3337 1.6665 14.6027 1.6665 10.0003C1.6665 5.39795 5.39746 1.66699 9.99984 1.66699C14.6022 1.66699 18.3332 5.39795 18.3332 10.0003Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </g>
              <defs>
                <clipPath id="clip0_info">
                  <rect width="20" height="20" fill="white"/>
                </clipPath>
              </defs>
            </svg>
          </button>
        </div>
      </div>
      
      {/* Chat Messages */}
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex items-start gap-3 max-w-4xl">
            <img 
              src={assistantData?.avatar ? createProxyUrl(assistantData.avatar, 'avatar') : assistantData?.avatar}
              alt={assistantData?.name}
              className="w-8 h-8 rounded-full flex-shrink-0"
            />
            <div className="flex flex-col gap-1 min-w-0 max-w-2xl">
              <div className="bg-bg-message rounded-lg p-3">
                <p className="text-sm text-black leading-5">
                  {assistantData?.greeting}
                </p>
              </div>
              <span className="text-xs text-text-secondary text-right">{currentTime}</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex items-start gap-3 max-w-4xl ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                {message.sender === 'assistant' && (
                  <img 
                    src={assistantData?.avatar ? createProxyUrl(assistantData.avatar, 'avatar') : assistantData?.avatar}
                    alt={assistantData?.name}
                    className="w-8 h-8 rounded-full flex-shrink-0"
                  />
                )}
                <div className="flex flex-col gap-1 min-w-0 max-w-2xl">
                  <div className={`rounded-lg p-3 ${message.sender === 'user' ? 'bg-squidgy-primary text-white ml-auto' : 'bg-bg-message'}`}>
                    <p className="text-sm leading-5">
                      {message.content}
                    </p>
                  </div>
                  <span className={`text-xs text-text-secondary ${message.sender === 'user' ? 'text-left' : 'text-right'}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Input Area */}
      <div className="border-t border-border-light px-4 py-4 flex flex-col gap-3">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Message SMM Assistant..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-4 text-base border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-squidgy-primary focus:border-transparent"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {/* Attachment button */}
              <button className="p-2 rounded-lg bg-squidgy-primary/10 text-squidgy-primary">
                <svg width="18" height="18" viewBox="0 0 18 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13.5 12.4287C13.5 13.7287 13.0437 14.835 12.1313 15.7475C11.2188 16.66 10.1125 17.1162 8.8125 17.1162C7.5125 17.1162 6.40625 16.66 5.49375 15.7475C4.58125 14.835 4.125 13.7287 4.125 12.4287V5.49121C4.125 4.55371 4.45312 3.75684 5.10938 3.10059C5.76562 2.44434 6.5625 2.11621 7.5 2.11621C8.4375 2.11621 9.23438 2.44434 9.89062 3.10059C10.5469 3.75684 10.875 4.55371 10.875 5.49121V12.0537C10.875 12.6287 10.675 13.1162 10.275 13.5162C9.875 13.9162 9.3875 14.1162 8.8125 14.1162C8.2375 14.1162 7.75 13.9162 7.35 13.5162C6.95 13.1162 6.75 12.6287 6.75 12.0537V5.11621H8.25V12.0537C8.25 12.2162 8.30312 12.3506 8.40938 12.4568C8.51562 12.5631 8.65 12.6162 8.8125 12.6162C8.975 12.6162 9.10938 12.5631 9.21562 12.4568C9.32188 12.3506 9.375 12.2162 9.375 12.0537V5.49121C9.3625 4.96621 9.17813 4.52246 8.82188 4.15996C8.46563 3.79746 8.025 3.61621 7.5 3.61621C6.975 3.61621 6.53125 3.79746 6.16875 4.15996C5.80625 4.52246 5.625 4.96621 5.625 5.49121V12.4287C5.6125 13.3162 5.91875 14.0693 6.54375 14.6881C7.16875 15.3068 7.925 15.6162 8.8125 15.6162C9.6875 15.6162 10.4313 15.3068 11.0438 14.6881C11.6563 14.0693 11.975 13.3162 12 12.4287V5.11621H13.5V12.4287Z" fill="currentColor"/>
                </svg>
              </button>
              
              {/* Mic button */}
              <button className="p-2 rounded-lg bg-squidgy-primary/10 text-squidgy-primary">
                <svg width="18" height="18" viewBox="0 0 18 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g clipPath="url(#clip0_mic)">
                    <path d="M14.25 8.11621V9.61621C14.25 11.0086 13.6969 12.344 12.7123 13.3285C11.7277 14.3131 10.3924 14.8662 9 14.8662M9 14.8662C7.60761 14.8662 6.27226 14.3131 5.28769 13.3285C4.30312 12.344 3.75 11.0086 3.75 9.61621V8.11621M9 14.8662V17.8662M6 17.8662H12M9 1.36621C8.40326 1.36621 7.83097 1.60326 7.40901 2.02522C6.98705 2.44718 6.75 3.01947 6.75 3.61621V9.61621C6.75 10.2129 6.98705 10.7852 7.40901 11.2072C7.83097 11.6292 8.40326 11.8662 9 11.8662C9.59674 11.8662 10.169 11.6292 10.591 11.2072C11.0129 10.7852 11.25 10.2129 11.25 9.61621V3.61621C11.25 3.01947 11.0129 2.44718 10.591 2.02522C10.169 1.60326 9.59674 1.36621 9 1.36621Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </g>
                  <defs>
                    <clipPath id="clip0_mic">
                      <rect width="18" height="18" fill="white" transform="translate(0 0.616211)"/>
                    </clipPath>
                  </defs>
                </svg>
              </button>
              
              {/* Send button */}
              <button onClick={handleSendMessage} className="p-2 rounded-lg bg-squidgy-gradient text-white">
                <svg width="18" height="17" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g clipPath="url(#clip0_send)">
                    <path d="M16.5 1.5332L8.25 9.32487M16.5 1.5332L11.25 15.6999L8.25 9.32487M16.5 1.5332L1.5 6.49154L8.25 9.32487" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </g>
                  <defs>
                    <clipPath id="clip0_send">
                      <rect width="18" height="17" fill="white" transform="translate(0 0.116211)"/>
                    </clipPath>
                  </defs>
                </svg>
              </button>
            </div>
          </div>
          
          {/* Quick action buttons */}
          <div className="flex items-start gap-2 flex-wrap">
            <button className="px-4 py-1.5 rounded-full bg-bg-message text-black text-sm">
              Create Instagram post ideas
            </button>
            <button className="px-4 py-1.5 rounded-full bg-bg-message text-black text-sm">
              Analyze competitor content
            </button>
            <button className="px-4 py-1.5 rounded-full bg-bg-message text-black text-sm">
              Write engaging captions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
