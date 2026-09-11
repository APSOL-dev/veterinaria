import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Wifi, 
  WifiOff, 
  QrCode, 
  LogOut, 
  Search, 
  Send, 
  Mic, 
  Square, 
  Paperclip, 
  Image as ImageIcon, 
  FileText, 
  Check, 
  CheckCheck, 
  Clock, 
  User, 
  RefreshCw, 
  Play, 
  Pause, 
  X, 
  ChevronDown, 
  Sparkles, 
  Filter, 
  Phone, 
  Download, 
  AlertTriangle,
  MessageSquare,
  Volume2,
  FileCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

import { evolutionService } from '../services/evolutionService';
import { formatChatTimestamp, extractMessageContent } from '../utils/chatFormat';
import { findClientForPhone, normalizePhoneForMatching } from '../utils/phoneMatcher';

// Plantillas predefinidas de mensajes para veterinaria
const PREDEFINED_TEMPLATES = [
  {
    title: '💉 Recordatorio de Vacuna',
    text: 'Hola! Te escribimos de VetSoft para recordarte que tu mascota tiene pendiente su vacunación este mes. Por favor contáctanos para coordinar un turno.'
  },
  {
    title: '📅 Confirmación de Turno',
    text: 'Hola! Confirmamos tu turno en VetSoft para el día de hoy. Te esperamos a la hora programada.'
  },
  {
    title: '🐾 Aviso de Retiro / Alta',
    text: 'Hola! Te avisamos que tu mascota ya finalizó su atención/estética y está lista para ser retirada en la clínica.'
  },
  {
    title: '📋 Consulta de Control',
    text: 'Hola! ¿Cómo se encuentra tu mascota tras la consulta médica de los últimos días? Quedamos a disposición por cualquier duda.'
  }
];

// Datos de demostración cuando la API no está configurada o no devuelve chats
const DEMO_CHATS = [
  {
    id: '5493425123456@s.whatsapp.net',
    remoteJid: '5493425123456@s.whatsapp.net',
    pushName: 'Carlos Gómez',
    profilePicUrl: null,
    unreadCount: 2,
    lastMessage: {
      key: { remoteJid: '5493425123456@s.whatsapp.net', fromMe: false },
      message: { conversation: 'Hola Dr., quería consultar por la vacuna de Firulais para esta semana.' },
      messageTimestamp: Math.floor(Date.now() / 1000) - 300
    }
  },
  {
    id: '5493425987654@s.whatsapp.net',
    remoteJid: '5493425987654@s.whatsapp.net',
    pushName: 'María Fernández',
    profilePicUrl: null,
    unreadCount: 0,
    lastMessage: {
      key: { remoteJid: '5493425987654@s.whatsapp.net', fromMe: true },
      message: { conversation: 'Perfecto María, el turno para el baño de Lola quedó agendado a las 16hs.' },
      messageTimestamp: Math.floor(Date.now() / 1000) - 7200
    }
  }
];

/**
 * @param {{ patientsList?: any[], onOpenPatientProfile?: (client: any) => void }} props
 */
export const ChatPage = ({ patientsList = /** @type {any[]} */ ([]), onOpenPatientProfile }) => {
  // Estado de configuración y conexión
  const [config, setConfig] = useState(() => evolutionService.getConfig());
  const [connectionState, setConnectionState] = useState('close'); // 'open' | 'connecting' | 'close' | 'not_found'
  const [isLoadingState, setIsLoadingState] = useState(false);
  
  // Modal de QR
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrBase64, setQrBase64] = useState('');
  const [qrCountdown, setQrCountdown] = useState(30);
  const [isLoadingQr, setIsLoadingQr] = useState(false);

  // Modal de confirmación de logout
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Chats y Conversación Seleccionada
  const [chats, setChats] = useState([]);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Filtros y Búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('todos'); // 'todos' | 'clientes' | 'no_leidos'

  // Input de Mensaje
  const [messageText, setMessageText] = useState('');
  const [showTemplatesDropdown, setShowTemplatesDropdown] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Grabadora de Nota de Voz
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  // Adjuntos de Medios
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // Lightbox para imágenes
  const [lightboxImage, setLightboxImage] = useState(null);

  // Ref para auto-scroll del chat
  const messagesEndRef = useRef(null);

  // 1. Verificar Estado de Conexión
  const checkConnection = useCallback(async () => {
    if (!config.apiUrl || !config.apiKey) return;
    setIsLoadingState(true);
    try {
      const state = await evolutionService.getConnectionState();
      setConnectionState(state);
    } catch (err) {
      console.warn('Error verificando estado de conexión:', err);
      setConnectionState('close');
    } finally {
      setIsLoadingState(false);
    }
  }, [config.apiUrl, config.apiKey]);

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 15000);
    return () => clearInterval(interval);
  }, [checkConnection]);

  // 2. Cargar Chats de la API (o Fallback Demo)
  const loadChats = useCallback(async () => {
    if (!config.apiUrl || !config.apiKey || !config.instance) {
      setChats(DEMO_CHATS);
      return;
    }
    setIsLoadingChats(true);
    try {
      const response = await evolutionService.fetchChats();
      const chatList = Array.isArray(response) ? response : (response?.chats || response?.data || []);
      if (chatList.length > 0) {
        setChats(chatList);
      } else {
        setChats(DEMO_CHATS);
      }
    } catch (err) {
      console.warn('No se pudieron obtener chats reales de Evolution API, usando lista demo:', err);
      setChats(DEMO_CHATS);
    } finally {
      setIsLoadingChats(false);
    }
  }, [config.apiUrl, config.apiKey, config.instance]);

  useEffect(() => {
    loadChats();
  }, [loadChats, connectionState]);

  // 3. Cargar Mensajes del Chat Seleccionado y Polling cada 4s
  const loadMessagesForChat = useCallback(async (remoteJid) => {
    if (!remoteJid) return;
    if (!config.apiUrl || !config.apiKey || !config.instance) {
      // Mock messages for demo chat
      setMessages([
        {
          key: { id: 'm1', fromMe: false, remoteJid },
          message: { conversation: 'Hola Dr., quería consultar por la vacuna de Firulais para esta semana.' },
          messageTimestamp: Math.floor(Date.now() / 1000) - 300,
          status: 'READ'
        },
        {
          key: { id: 'm2', fromMe: true, remoteJid },
          message: { conversation: '¡Hola! Sí, tenemos disponibilidad para el jueves por la tarde. ¿Te conviene a las 16hs?' },
          messageTimestamp: Math.floor(Date.now() / 1000) - 180,
          status: 'READ'
        }
      ]);
      return;
    }
    try {
      const res = await evolutionService.fetchMessages(remoteJid);
      const msgList = Array.isArray(res) ? res : (res?.messages?.records || res?.records || res?.data || []);
      // Ordenar cronológicamente (más antiguo primero)
      const sorted = [...msgList].sort((a, b) => (a.messageTimestamp || 0) - (b.messageTimestamp || 0));
      setMessages(sorted);
      evolutionService.markAsRead(remoteJid).catch(() => {});
    } catch (err) {
      console.warn('Error fetching messages:', err);
    }
  }, [config.apiUrl, config.apiKey, config.instance]);

  useEffect(() => {
    if (!selectedChat) return;
    setIsLoadingMessages(true);
    loadMessagesForChat(selectedChat.remoteJid || selectedChat.id).finally(() => setIsLoadingMessages(false));

    const pollInterval = setInterval(() => {
      loadMessagesForChat(selectedChat.remoteJid || selectedChat.id);
    }, 4000);

    return () => clearInterval(pollInterval);
  }, [selectedChat, loadMessagesForChat]);

  // Auto-scroll al final del chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 4. Modal QR Code y Cuenta Regresiva
  const handleOpenQrModal = async () => {
    setShowQrModal(true);
    setIsLoadingQr(true);
    try {
      const qrData = await evolutionService.getQrCode();
      setQrBase64(qrData.base64);
      setQrCountdown(30);
    } catch (err) {
      console.error('Error generando QR:', err);
    } finally {
      setIsLoadingQr(false);
    }
  };

  useEffect(() => {
    let timer;
    if (showQrModal && qrCountdown > 0) {
      timer = setInterval(() => setQrCountdown(prev => prev - 1), 1000);
    } else if (showQrModal && qrCountdown === 0) {
      handleOpenQrModal();
    }
    return () => clearInterval(timer);
  }, [showQrModal, qrCountdown]);

  // 5. Logout
  const handleLogout = async () => {
    try {
      await evolutionService.logoutInstance();
      setConnectionState('close');
      setShowLogoutModal(false);
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
  };

  // 6. Envío de Mensaje de Texto
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!messageText.trim() || !selectedChat || isSending) return;

    const textToSend = messageText.trim();
    setMessageText('');
    setIsSending(true);

    const remoteJid = selectedChat.remoteJid || selectedChat.id;
    const cleanNumber = remoteJid.replace(/\D/g, '');

    // Optimistic UI insert
    const tempMsg = {
      key: { id: 'temp-' + Date.now(), fromMe: true, remoteJid },
      message: { conversation: textToSend },
      messageTimestamp: Math.floor(Date.now() / 1000),
      status: 'PENDING'
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      if (config.apiUrl && config.apiKey) {
        await evolutionService.sendTextMessage(cleanNumber, textToSend);
        loadMessagesForChat(remoteJid);
      }
    } catch (err) {
      console.error('Error enviando mensaje:', err);
      alert('Error enviando mensaje: ' + err.message);
    } finally {
      setIsSending(false);
    }
  };

  // 7. Grabación de Nota de Voz
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/ogg; codecs=opus' });
        
        // Convert blob to Base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result.split(',')[1];
          if (selectedChat && base64Audio) {
            const remoteJid = selectedChat.remoteJid || selectedChat.id;
            const cleanNumber = remoteJid.replace(/\D/g, '');
            try {
              setIsSending(true);
              if (config.apiUrl && config.apiKey) {
                await evolutionService.sendAudioMessage(cleanNumber, base64Audio);
                loadMessagesForChat(remoteJid);
              }
            } catch (err) {
              console.error('Error enviando nota de voz:', err);
            } finally {
              setIsSending(false);
            }
          }
        };
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('No se pudo acceder al micrófono:', err);
      alert('Permiso de micrófono denegado o no disponible.');
    }
  };

  const stopRecording = (shouldSend = true) => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      if (!shouldSend) {
        mediaRecorderRef.current.ondataavailable = null;
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.stop();
      } else {
        mediaRecorderRef.current.stop();
      }
    }
  };

  // 8. Envío de Archivos / Medios
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedChat) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const base64Media = reader.result.split(',')[1];
      const remoteJid = selectedChat.remoteJid || selectedChat.id;
      const cleanNumber = remoteJid.replace(/\D/g, '');
      const isImage = file.type.startsWith('image/');
      const mediatype = isImage ? 'image' : 'document';

      try {
        setIsSending(true);
        if (config.apiUrl && config.apiKey) {
          await evolutionService.sendMediaMessage(cleanNumber, base64Media, mediatype, file.name, file.name);
          loadMessagesForChat(remoteJid);
        }
      } catch (err) {
        console.error('Error enviando archivo:', err);
        alert('Error al enviar archivo: ' + err.message);
      } finally {
        setIsSending(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
  };

  // 9. Filtrado de Chats y Match con Clientes VETSOFT
  const processedChats = useMemo(() => {
    return chats.map(chat => {
      const rawNum = (chat.remoteJid || chat.id || '').split('@')[0];
      const clientMatch = findClientForPhone(rawNum, patientsList);
      const displayName = clientMatch
        ? (clientMatch.ownerName ? `${clientMatch.ownerName} (${clientMatch.name || 'Mascota'})` : clientMatch.name)
        : (chat.pushName || chat.name || rawNum);
      
      return {
        ...chat,
        rawNum,
        displayName,
        isClient: !!clientMatch,
        clientData: clientMatch
      };
    });
  }, [chats, patientsList]);

  const filteredChats = useMemo(() => {
    return processedChats.filter(chat => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        chat.displayName.toLowerCase().includes(q) || 
        chat.rawNum.includes(q);

      if (!matchesSearch) return false;

      if (activeFilter === 'clientes') return chat.isClient;
      if (activeFilter === 'no_leidos') return (chat.unreadCount || 0) > 0;
      return true;
    });
  }, [processedChats, searchQuery, activeFilter]);

  // Formateador de segundos a mm:ss
  const formatTimeSeconds = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-100 font-sans overflow-hidden text-slate-800">
      {/* --------------------------------------------------------------------- */}
      {/* BARRA SUPERIOR - ESTADO Y CONFIGURACIÓN DE EVOLUTION API              */}
      {/* --------------------------------------------------------------------- */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-xs z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-200">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-base leading-tight">Mensajería WhatsApp</h1>
            <p className="text-xs text-slate-500 font-medium">Integración Evolution API v2 (Baileys)</p>
          </div>
        </div>

        {/* Indicador de Estado e Interacciones */}
        <div className="flex items-center gap-3">
          {/* Badge de Estado */}
          <div className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 border transition-all ${
            connectionState === 'open'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : connectionState === 'connecting'
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}>
            {connectionState === 'open' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <Wifi className="w-3.5 h-3.5" />
                <span>Conectado</span>
              </>
            ) : connectionState === 'connecting' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Conectando...</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <WifiOff className="w-3.5 h-3.5" />
                <span>Desconectado</span>
              </>
            )}
          </div>

          {/* Botón Escanear QR */}
          <button
            onClick={handleOpenQrModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs"
          >
            <QrCode className="w-4 h-4" />
            <span>Conectar / Código QR</span>
          </button>

          {/* Botón Logout */}
          {connectionState === 'open' && (
            <button
              onClick={() => setShowLogoutModal(true)}
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              title="Cerrar sesión de WhatsApp"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Alerta de credenciales ausentes si no están en .env */}
      {(!config.apiUrl || !config.apiKey) && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between text-xs text-amber-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Modo Demostración Activo:</strong> Faltan definir <code>VITE_EVOLUTION_API_URL</code> y <code>VITE_EVOLUTION_API_KEY</code> en las variables de entorno para enviar mensajes reales.
            </span>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MAIN WORKSPACE: SIDEBAR Y ÁREA DE CHAT ESTILO WHATSAPP WEB             */}
      {/* --------------------------------------------------------------------- */}
      <div className="flex-1 flex overflow-hidden">
        {/* ------------------------------------------------------------------- */}
        {/* PANEL LATERAL IZQUIERDO: LISTA DE CHATS                             */}
        {/* ------------------------------------------------------------------- */}
        <aside className="w-80 md:w-96 bg-white border-r border-slate-200 flex flex-col h-full shrink-0">
          {/* Buscador de Contactos */}
          <div className="p-3 border-b border-slate-100 flex flex-col gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o teléfono..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 border-none rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            {/* Filtros Rápidos */}
            <div className="flex items-center gap-1.5 pt-1">
              <button
                onClick={() => setActiveFilter('todos')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeFilter === 'todos'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setActiveFilter('clientes')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeFilter === 'clientes'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Clientes
              </button>
              <button
                onClick={() => setActiveFilter('no_leidos')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeFilter === 'no_leidos'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                No leídos
              </button>
            </div>
          </div>

          {/* Lista de Conversaciones */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {isLoadingChats ? (
              <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
                <span>Cargando chats de WhatsApp...</span>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No se encontraron chats que coincidan con la búsqueda.
              </div>
            ) : (
              filteredChats.map(chat => {
                const isSelected = selectedChat?.id === chat.id || selectedChat?.remoteJid === chat.remoteJid;
                const lastMsgContent = extractMessageContent(chat.lastMessage?.message);
                const timeStr = formatChatTimestamp(chat.lastMessage?.messageTimestamp);
                const initials = chat.displayName.substring(0, 2).toUpperCase();

                return (
                  <div
                    key={chat.id || chat.remoteJid}
                    onClick={() => setSelectedChat(chat)}
                    className={`p-3.5 flex items-center gap-3 cursor-pointer transition-colors relative ${
                      isSelected
                        ? 'bg-emerald-50/80 border-l-4 border-emerald-600'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      {chat.profilePicUrl ? (
                        <img src={chat.profilePicUrl} alt={chat.displayName} className="w-11 h-11 rounded-full object-cover" />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">
                          {initials}
                        </div>
                      )}
                      {chat.isClient && (
                        <span className="absolute -bottom-1 -right-1 bg-purple-600 text-white text-[9px] font-bold px-1 py-0.2 rounded-full border border-white" title="Cliente registrado VETSOFT">
                          VET
                        </span>
                      )}
                    </div>

                    {/* Info Contacto y Último Mensaje */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h3 className="font-semibold text-xs text-slate-900 truncate">
                          {chat.displayName}
                        </h3>
                        {timeStr && (
                          <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                            {timeStr}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500 truncate font-normal">
                          {lastMsgContent || 'Sin mensajes recientes'}
                        </p>
                        {chat.unreadCount > 0 && (
                          <span className="ml-2 bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* ------------------------------------------------------------------- */}
        {/* ÁREA PRINCIPAL DE CONVERSACIÓN                                      */}
        {/* ------------------------------------------------------------------- */}
        <main className="flex-1 flex flex-col bg-[#efeae2]/40 relative overflow-hidden">
          {selectedChat ? (
            <>
              {/* Header de Conversación Activa */}
              <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between z-10 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                    {selectedChat.displayName.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-sm text-slate-900">{selectedChat.displayName}</h2>
                      {selectedChat.isClient && (
                        <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-200">
                          Cliente VETSOFT
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-mono">{selectedChat.rawNum || selectedChat.remoteJid}</p>
                  </div>
                </div>

                {/* Acciones del Header */}
                <div className="flex items-center gap-2">
                  {selectedChat.isClient && onOpenPatientProfile && (
                    <button
                      onClick={() => onOpenPatientProfile(selectedChat.clientData)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl text-xs font-semibold transition-all border border-purple-200 cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Ver Ficha Médica</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Mensajes - Contenedor con Scroll */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {isLoadingMessages ? (
                  <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                    <span>Cargando historial de chat...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 italic">
                    No hay mensajes en esta conversación. Comienza enviando un mensaje abajo.
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isFromMe = msg.key?.fromMe;
                    const content = extractMessageContent(msg.message);
                    const timestamp = msg.messageTimestamp;
                    const timeFormatted = formatChatTimestamp(timestamp);

                    // Detectar tipo de medio
                    const isAudio = !!msg.message?.audioMessage;
                    const isImage = !!msg.message?.imageMessage;
                    const isDoc = !!msg.message?.documentMessage;

                    return (
                      <div
                        key={msg.key?.id || index}
                        className={`flex flex-col ${isFromMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[75%] md:max-w-[60%] rounded-2xl p-3 shadow-xs text-xs relative ${
                            isFromMe
                              ? 'bg-emerald-700 text-white rounded-tr-none'
                              : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none'
                          }`}
                        >
                          {/* Contenido de Audio */}
                          {isAudio && (
                            <div className="flex items-center gap-3 py-1">
                              <Volume2 className="w-5 h-5 text-emerald-300 shrink-0" />
                              <audio controls className="h-8 max-w-[200px] outline-none">
                                <source src={msg.message.audioMessage.url || msg.message.audioMessage.directPath} type="audio/ogg" />
                                Tu navegador no soporta el reproductor de audio.
                              </audio>
                            </div>
                          )}

                          {/* Contenido de Imagen */}
                          {isImage && (
                            <div className="mb-2">
                              <img
                                src={msg.message.imageMessage.url || msg.message.imageMessage.directPath || 'https://via.placeholder.com/300x200?text=Imagen'}
                                alt="Imagen enviada"
                                onClick={() => setLightboxImage(msg.message.imageMessage.url || msg.message.imageMessage.directPath)}
                                className="rounded-xl max-h-60 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                              />
                              {msg.message.imageMessage.caption && (
                                <p className="mt-1 font-normal">{msg.message.imageMessage.caption}</p>
                              )}
                            </div>
                          )}

                          {/* Contenido de Documento */}
                          {isDoc && (
                            <div className="flex items-center gap-2 p-2 bg-black/10 rounded-xl mb-1">
                              <FileText className="w-5 h-5 shrink-0" />
                              <span className="truncate font-semibold flex-1">
                                {msg.message.documentMessage.fileName || 'Documento PDF'}
                              </span>
                              <a
                                href={msg.message.documentMessage.url || '#'}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 hover:bg-black/20 rounded-lg transition-colors"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            </div>
                          )}

                          {/* Texto Normal */}
                          {!isAudio && !isImage && !isDoc && (
                            <p className="whitespace-pre-wrap leading-relaxed font-normal">{content}</p>
                          )}

                          {/* Hora y Estado de Entrega */}
                          <div className={`flex items-center justify-end gap-1 text-[10px] mt-1 ${isFromMe ? 'text-emerald-200' : 'text-slate-400'}`}>
                            <span>{timeFormatted}</span>
                            {isFromMe && (
                              msg.status === 'READ' ? (
                                <CheckCheck className="w-3.5 h-3.5 text-sky-300" />
                              ) : msg.status === 'PENDING' ? (
                                <Clock className="w-3 h-3 text-emerald-200" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* BARRA DE ENTRADA DE MENSAJES Y HERRAMIENTAS */}
              <div className="bg-white border-t border-slate-200 p-3 flex flex-col gap-2 z-10 shadow-md">
                {/* Menú Flotante de Plantillas */}
                {showTemplatesDropdown && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xl mb-1 space-y-2 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        Plantillas Predefinidas de VetSoft
                      </span>
                      <button onClick={() => setShowTemplatesDropdown(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                      {PREDEFINED_TEMPLATES.map((tpl, i) => (
                        <div
                          key={i}
                          onClick={() => {
                            setMessageText(tpl.text);
                            setShowTemplatesDropdown(false);
                          }}
                          className="p-2.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl cursor-pointer transition-all"
                        >
                          <div className="font-semibold text-xs text-slate-800">{tpl.title}</div>
                          <div className="text-[11px] text-slate-500 truncate mt-0.5">{tpl.text}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Zona de Grabación Activa */}
                {isRecording ? (
                  <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 flex items-center justify-between text-rose-800 animate-pulse">
                    <div className="flex items-center gap-3">
                      <Mic className="w-5 h-5 text-rose-600 animate-bounce" />
                      <span className="font-bold text-xs">Grabando nota de voz PTT...</span>
                      <span className="font-mono text-xs font-semibold bg-rose-200 px-2 py-0.5 rounded-full">
                        {formatTimeSeconds(recordingTime)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => stopRecording(false)}
                        className="px-3 py-1.5 bg-white text-rose-600 border border-rose-300 rounded-xl text-xs font-semibold hover:bg-rose-100 transition-all cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => stopRecording(true)}
                        className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Enviar Audio</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Formulario Normal de Entrada */
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    {/* Botón Plantillas */}
                    <button
                      type="button"
                      onClick={() => setShowTemplatesDropdown(prev => !prev)}
                      className="p-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl transition-all border border-purple-200 cursor-pointer"
                      title="Insertar plantilla de mensaje"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>

                    {/* Botón Adjuntos (Imagen / Archivo) */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all cursor-pointer"
                      title="Adjuntar imagen o PDF"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*,application/pdf"
                      className="hidden"
                    />

                    {/* Input de Texto */}
                    <input
                      type="text"
                      placeholder="Escribe un mensaje de WhatsApp..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-emerald-500/50 font-normal"
                    />

                    {/* Botón Grabadora o Envío */}
                    {messageText.trim() ? (
                      <button
                        type="submit"
                        disabled={isSending}
                        className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={startRecording}
                        className="p-2.5 bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-600 rounded-xl transition-all cursor-pointer"
                        title="Grabar nota de voz"
                      >
                        <Mic className="w-4 h-4" />
                      </button>
                    )}
                  </form>
                )}
              </div>
            </>
          ) : (
            /* Estado Vacío - Sin Chat Seleccionado */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full mb-3 border border-emerald-200">
                <MessageSquare className="w-10 h-10" />
              </div>
              <h3 className="font-bold text-slate-700 text-sm mb-1">Selecciona una conversación</h3>
              <p className="text-xs max-w-sm">
                Elige un contacto del menú de la izquierda para ver el historial de chat o enviar mensajes por WhatsApp.
              </p>
            </div>
          )}
        </main>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* MODAL: ESCANEAR CÓDIGO QR PARA CONECTAR INSTANCIA                    */}
      {/* --------------------------------------------------------------------- */}
      {showQrModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 text-center relative">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <QrCode className="w-6 h-6" />
            </div>

            <h2 className="font-bold text-slate-900 text-base mb-1">Conectar WhatsApp Web</h2>
            <p className="text-xs text-slate-500 mb-4">
              Escanea este código QR desde tu app de WhatsApp en el celular (Dispositivos vinculados).
            </p>

            {/* Imagen QR */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-center min-h-[220px] mb-4">
              {isLoadingQr ? (
                <div className="flex flex-col items-center gap-2 text-xs text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                  <span>Obteniendo QR de Evolution API...</span>
                </div>
              ) : qrBase64 ? (
                <img
                  src={qrBase64.startsWith('data:') ? qrBase64 : `data:image/png;base64,${qrBase64}`}
                  alt="Código QR de WhatsApp"
                  className="w-48 h-48 rounded-xl object-contain border border-slate-200 shadow-xs"
                />
              ) : (
                <div className="text-xs text-slate-400 italic">
                  No se pudo cargar el código QR. Verifica que el servidor de Evolution API esté activo.
                </div>
              )}
            </div>

            {/* Cuenta Regresiva */}
            <div className="flex items-center justify-between text-xs text-slate-500 px-2 mb-2">
              <span>El código se actualiza en:</span>
              <span className="font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                {qrCountdown}s
              </span>
            </div>

            <button
              onClick={handleOpenQrModal}
              disabled={isLoadingQr}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingQr ? 'animate-spin' : ''}`} />
              <span>Regenerar Código QR</span>
            </button>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL: CONFIRMACIÓN DE CERRAR SESIÓN                                 */}
      {/* --------------------------------------------------------------------- */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <LogOut className="w-6 h-6" />
            </div>

            <h2 className="font-bold text-slate-900 text-base mb-1">¿Cerrar sesión de WhatsApp?</h2>
            <p className="text-xs text-slate-500 mb-5">
              Se desvinculará la instancia de Evolution API y deberás volver a escanear el código QR para enviar mensajes.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox de Imagen */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <img src={lightboxImage} alt="Ampliación" className="max-w-full max-h-full rounded-2xl object-contain" />
        </div>
      )}
    </div>
  );
};
