import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Language, Role, type Message, type ImageFile } from './types';
import { getChatResponse } from './services/geminiService';

// --- Helper Functions ---
const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
  });
  
// --- Language-specific Text ---
const welcomeMessages: Record<string, string> = {
  [Language.EN]: "Hello! I am your WADA expert. How can I help you with anti-doping rules today?",
  [Language.HI]: "नमस्ते! मैं आपका WADA विशेषज्ञ हूँ। मैं डोपिंग रोधी नियमों में आपकी मदद कैसे कर सकता हूँ?",
  [Language.ES]: "¡Hola! Soy tu experto de la AMA. ¿Cómo puedo ayudarte hoy con las reglas antidopaje?",
  [Language.FR]: "Bonjour ! Je suis votre expert de l'AMA. Comment puis-je vous aider aujourd'hui avec les règles antidopage ?",
  [Language.BN]: "নমস্কার! আমি আপনার WADA বিশেষজ্ঞ। আমি আজ আপনাকে অ্যান্টি-ডোপিং নিয়মাবলী নিয়ে কীভাবে সাহায্য করতে পারি?",
  [Language.TA]: "வணக்கம்! நான் உங்கள் WADA நிபுணர். இன்று ஊக்கமருந்து தடுப்பு விதிகளில் நான் உங்களுக்கு எப்படி உதவ முடியும்?",
  [Language.TE]: "నమస్కారం! నేను మీ WADA నిపుణుడిని. ఈ రోజు యాంటీ-డోపింగ్ నిబంధనలతో నేను మీకు ఎలా సహాయపడగలను?",
  [Language.MR]: "नमस्कार! मी तुमचा WADA तज्ञ आहे. मी आज उत्तेजक-विरोधी नियमांमध्ये तुमची कशी मदत करू शकेन?",
  [Language.GU]: "નમસ્તે! હું તમારો WADA નિષ્ણાત છું. આજે હું એન્ટી-ડોપિંગ નિયમોમાં તમારી કેવી રીતે મદદ કરી શકું?",
};

const imageErrorMessages: Record<string, string> = {
    [Language.EN]: "There was an error processing the image. Please try again.",
    [Language.HI]: "छवि को संसाधित करने में त्रुटि हुई। कृपया पुन: प्रयास करें।",
    [Language.ES]: "Hubo un error al procesar la imagen. Por favor, inténtalo de nuevo.",
    [Language.FR]: "Une erreur s'est produite lors du traitement de l'image. Veuillez réessayer.",
    [Language.BN]: "ছবিটি প্রসেস করতে একটি ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।",
    [Language.TA]: "படத்தைச் செயல்படுத்துவதில் பிழை ஏற்பட்டது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.",
    [Language.TE]: "చిత్రాన్ని ప్రాసెస్ చేయడంలో లోపం ఏర్పడింది. దయచేసి మళ్లీ ప్రయత్నించండి.",
    [Language.MR]: "प्रतिमा प्रक्रिया करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.",
    [Language.GU]: "છબી પર પ્રક્રિયા કરવામાં ભૂલ આવી. કૃપા કરીને ફરી પ્રયાસ કરો.",
};

// --- SVG Icons ---
const PaperAirplaneIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
  </svg>
);

const PaperClipIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M18.97 3.659a2.25 2.25 0 0 0-3.182 0l-10.5 10.5a.75.75 0 0 0 1.06 1.06l10.5-10.5a.75.75 0 0 1 1.06 0Zm-4.594 4.594a2.25 2.25 0 0 0-3.182 0L4.5 14.943a.75.75 0 0 0 1.06 1.06l6.694-6.694a.75.75 0 0 1 1.06 0l-3.182 3.182a2.25 2.25 0 0 0 0 3.182l3.182-3.182a.75.75 0 0 1 0 1.06l-3.182 3.182a2.25 2.25 0 0 0 3.182 0l7.778-7.778a.75.75 0 0 0-1.06-1.06L14.376 8.253Z" clipRule="evenodd" />
  </svg>
);

const XCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 0 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z" clipRule="evenodd" />
  </svg>
);

const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
    </svg>
);

// --- Child Components ---
const ChatMessage: React.FC<{ message: Message }> = ({ message }) => {
  const isModel = message.role === Role.MODEL;
  return (
    <div className={`flex items-start gap-3 my-4 ${isModel ? '' : 'flex-row-reverse'}`}>
      <div className={`p-1.5 rounded-full ${isModel ? 'bg-indigo-500' : 'bg-green-500'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white">
          {isModel ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 6.75v10.5a2.25 2.25 0 0 0 2.25 2.25Z" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          )}
        </svg>
      </div>
      <div className={`p-4 rounded-lg max-w-lg ${isModel ? 'bg-gray-700 text-gray-200' : 'bg-green-600 text-white'}`}>
        {message.imagePreview && (
          <img src={message.imagePreview} alt="upload preview" className="rounded-md mb-2 max-h-48" />
        )}
        <p className="whitespace-pre-wrap">{message.text}</p>
      </div>
    </div>
  );
};

const ChatInput: React.FC<{ onSendMessage: (text: string, image: ImageFile | null) => void; isLoading: boolean }> = ({ onSendMessage, isLoading }) => {
  const [text, setText] = useState('');
  const [image, setImage] = useState<ImageFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if ((!text.trim() && !image) || isLoading) return;
    onSendMessage(text, image);
    setText('');
    setImage(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage({ file, preview: URL.createObjectURL(file) });
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="p-4 bg-gray-800 border-t border-gray-700">
      {image && (
        <div className="relative inline-block mb-2">
          <img src={image.preview} alt="preview" className="h-24 w-24 object-cover rounded-lg" />
          <button
            onClick={() => setImage(null)}
            className="absolute -top-2 -right-2 bg-gray-800 rounded-full text-white hover:text-red-500"
            aria-label="Remove image"
          >
            <XCircleIcon className="w-7 h-7" />
          </button>
        </div>
      )}
      <div className="relative flex items-center">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type your message or upload an image..."
          className="w-full bg-gray-700 text-white rounded-lg p-3 pr-24 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
          rows={1}
          disabled={isLoading}
        />
        <div className="absolute right-2 flex items-center">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-white"
            aria-label="Attach image"
          >
            <PaperClipIcon className="w-6 h-6" />
          </button>
          <button
            onClick={handleSend}
            disabled={isLoading || (!text.trim() && !image)}
            className="p-2 text-gray-400 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:text-white"
            aria-label="Send message"
          >
            <PaperAirplaneIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

const LanguageSelector: React.FC<{ language: Language; setLanguage: (lang: Language) => void }> = ({ language, setLanguage }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleSelect = (lang: Language) => {
        setLanguage(lang);
        setIsOpen(false);
    };

    return (
        <div ref={dropdownRef} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-32 px-3 py-2 text-sm font-medium text-white bg-gray-700 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500"
            >
                <span>{language}</span>
                <ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute right-0 w-48 mt-2 origin-top-right bg-gray-700 divide-y divide-gray-600 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                    <div className="py-1">
                        {Object.values(Language).map((lang) => (
                            <button
                                key={lang}
                                onClick={() => handleSelect(lang)}
                                className={`w-full text-left px-4 py-2 text-sm ${language === lang ? 'bg-indigo-500 text-white' : 'text-gray-300 hover:bg-gray-600 hover:text-white'}`}
                            >
                                {lang}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};


// --- Main App Component ---
export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [language, setLanguage] = useState<Language>(Language.EN);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  useEffect(() => {
    const welcomeText = welcomeMessages[language];
    setMessages([{ id: 'init', role: Role.MODEL, text: welcomeText }]);
  }, [language]);


  const handleSendMessage = useCallback(async (text: string, imageFile: ImageFile | null) => {
    setIsLoading(true);
    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      text,
      imagePreview: imageFile?.preview,
    };
    setMessages(prev => [...prev, userMessage]);

    let imagePayload: { mimeType: string; data: string } | null = null;
    if (imageFile) {
      try {
        const base64Data = await fileToBase64(imageFile.file);
        imagePayload = { mimeType: imageFile.file.type, data: base64Data };
      } catch (error) {
        console.error("Error converting file to base64", error);
        const errorText = imageErrorMessages[language];
        setMessages(prev => [...prev, { id: 'error', role: Role.MODEL, text: errorText }]);
        setIsLoading(false);
        return;
      }
    }

    const responseText = await getChatResponse(text, imagePayload, language);
    
    const modelMessage: Message = {
      id: `${Date.now()}-model`,
      role: Role.MODEL,
      text: responseText,
    };
    
    setMessages(prev => [...prev, modelMessage]);
    setIsLoading(false);
  }, [language]);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white font-sans">
      <header className="p-4 bg-gray-800 border-b border-gray-700 shadow-lg flex justify-between items-center">
        <h1 className="text-xl font-bold text-indigo-400">WADA Expert Chatbot</h1>
        <LanguageSelector language={language} setLanguage={setLanguage} />
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {isLoading && (
            <div className="flex items-start gap-3 my-4">
              <div className="p-1.5 rounded-full bg-indigo-500 animate-pulse">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 6.75v10.5a2.25 2.25 0 0 0 2.25 2.25Z" />
                 </svg>
              </div>
              <div className="p-4 rounded-lg bg-gray-700">
                <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </main>

      <footer className="max-w-4xl mx-auto w-full">
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </footer>
    </div>
  );
}
