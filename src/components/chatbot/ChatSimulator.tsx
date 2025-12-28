"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
    Send, 
    Bot, 
    User, 
    Sparkles,
    Trash2,
    MessageSquare,
    ArrowLeft
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
    id: string
    role: 'bot' | 'user'
    content: string
    timestamp: Date
}

export default function ChatbotSimulator() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'bot',
            content: '¡Hola! Soy el asistente virtual de MidCar. ¿En qué puedo ayudarte hoy?',
            timestamp: new Date()
        }
    ])
    const [input, setInput] = useState("")
    const [isTyping, setIsTyping] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, isTyping])

    const handleSend = async () => {
        if (!input.trim()) return

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMessage])
        setInput("")
        setIsTyping(true)

        // Simulate bot response
        setTimeout(() => {
            const botResponse: Message = {
                id: (Date.now() + 1).toString(),
                role: 'bot',
                content: getBotResponse(userMessage.content),
                timestamp: new Date()
            }
            setMessages(prev => [...prev, botResponse])
            setIsTyping(false)
        }, 1500)
    }

    const getBotResponse = (text: string): string => {
        const lowerText = text.toLowerCase()
        if (lowerText.includes('precio') || lowerText.includes('cuanto cuesta')) {
            return "Nuestros precios varían según el modelo. ¿De qué vehículo te gustaría conocer el precio? Puedo darte detalles sobre el BMW Serie 3 o el Audi A4 que tenemos en stock."
        }
        if (lowerText.includes('financiacion') || lowerText.includes('financiar')) {
            return "Ofrecemos financiación flexible hasta 96 meses con o sin entrada. ¿Te gustaría que un comercial te llame para hacer un estudio personalizado?"
        }
        if (lowerText.includes('garantia')) {
            return "Todos nuestros vehículos incluyen 12 meses de garantía premium europea, ampliable hasta 36 meses."
        }
        if (lowerText.includes('hola') || lowerText.includes('buenas')) {
            return "¡Hola! ¿Cómo puedo ayudarte con la búsqueda de tu próximo coche?"
        }
        return "Entiendo. He pasado tu consulta a nuestro equipo comercial. ¿Podrías facilitarme un número de teléfono para que contacten contigo?"
    }

    return (
        <Card className="card-luxury flex flex-col h-[600px] border-white/[0.06] overflow-hidden">
            <CardHeader className="border-b border-white/[0.06] bg-white/[0.02] py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Avatar className="h-8 w-8 border border-primary/20">
                                <AvatarFallback className="bg-primary/10 text-primary">
                                    <Bot className="h-4 w-4" />
                                </AvatarFallback>
                            </Avatar>
                            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-black" />
                        </div>
                        <div>
                            <CardTitle className="text-sm font-medium">MidCar AI Assistant</CardTitle>
                            <p className="text-[10px] text-green-500 font-medium uppercase tracking-wider">En línea ahora</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setMessages([messages[0]])} className="h-8 w-8 text-white/20 hover:text-white/40">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 overflow-hidden bg-black/20">
                <ScrollArea className="h-full p-4">
                    <div className="space-y-4">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={cn(
                                    "flex gap-3 max-w-[85%]",
                                    message.role === 'user' ? "ml-auto flex-row-reverse" : ""
                                )}
                            >
                                <Avatar className={cn(
                                    "h-7 w-7 mt-1 shrink-0",
                                    message.role === 'bot' ? "border border-primary/20" : "border border-white/10"
                                )}>
                                    <AvatarFallback className={cn(
                                        "text-[10px]",
                                        message.role === 'bot' ? "bg-primary/10 text-primary" : "bg-white/5 text-white/60"
                                    )}>
                                        {message.role === 'bot' ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="space-y-1">
                                    <div className={cn(
                                        "p-3 rounded-2xl text-sm",
                                        message.role === 'bot' 
                                            ? "bg-white/[0.04] text-white/80 rounded-tl-none border border-white/[0.05]" 
                                            : "bg-primary text-white rounded-tr-none shadow-lg shadow-primary/20"
                                    )}>
                                        {message.content}
                                    </div>
                                    <p className={cn(
                                        "text-[9px] text-white/20 px-1",
                                        message.role === 'user' ? "text-right" : ""
                                    )}>
                                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex gap-3 max-w-[85%]">
                                <Avatar className="h-7 w-7 border border-primary/20">
                                    <AvatarFallback className="bg-primary/10 text-primary">
                                        <Bot className="h-3.5 w-3.5" />
                                    </AvatarFallback>
                                </Avatar>
                                <div className="bg-white/[0.04] p-3 rounded-2xl rounded-tl-none border border-white/[0.05] flex gap-1">
                                    <span className="w-1.5 h-1.5 bg-white/20 rounded-full animate-bounce" />
                                    <span className="w-1.5 h-1.5 bg-white/20 rounded-full animate-bounce [animation-delay:0.2s]" />
                                    <span className="w-1.5 h-1.5 bg-white/20 rounded-full animate-bounce [animation-delay:0.4s]" />
                                </div>
                            </div>
                        )}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>
            </CardContent>

            <div className="p-4 border-t border-white/[0.06] bg-white/[0.02]">
                <form
                    onSubmit={(e) => {
                        e.preventDefault()
                        handleSend()
                    }}
                    className="flex gap-2"
                >
                    <div className="relative flex-1">
                        <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-primary/40" />
                        <Input
                            placeholder="Escribe un mensaje..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="bg-black/40 border-white/[0.06] pl-9 h-10 text-xs focus-visible:ring-primary/30"
                        />
                    </div>
                    <Button type="submit" size="icon" disabled={!input.trim() || isTyping} className="h-10 w-10 shrink-0 shadow-lg shadow-primary/20">
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
                <p className="text-[9px] text-center text-white/20 mt-3 uppercase tracking-[0.2em]">
                    Impulsado por MidCar Intelligence AI
                </p>
            </div>
        </Card>
    )
}
