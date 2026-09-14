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
  AlertCircle,
  MoreVertical,
  Settings,
  Smartphone
} from 'lucide-react';

import { evolutionService } from '../services/evolutionService';
import { formatChatTimestamp, extractMessageContent, resolveChatDisplayName, extractPhoneFromChat, getChatAvatarUrl } from '../utils/chatFormat';
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

// Estilo de fondo característico de WhatsApp Web (Fondo de garabatos/papel tapiz)
const WHATSAPP_WALLPAPER_STYLE = {
  backgroundColor: '#efeae2',
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%2000000' fill-opacity='0.045'%3E%3Cpath d='M20 25a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm45 50a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm40-35a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM35 95a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm50 15a5 5 0 1 0 0-10 5 5 0 0 0 0 10z'/%3E%3Cpath d='M10 65a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm70-40a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-15 65a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'/%3E%3C/g%3E%3C/svg%3E")`,
};

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

  // Lightbox para imágenes, avatares y caché de multimedia (imágenes, notas de voz, pdfs)
  const [lightboxImage, setLightboxImage] = useState(null);
  const [avatarErrors, setAvatarErrors] = useState({});
  const [mediaCache, setMediaCache] = useState({});

  const handleAvatarError = useCallback((id) => {
    if (!id) return;
    setAvatarErrors(prev => ({ ...prev, [id]: true }));
  }, []);

  const loadMediaForMessage = useCallback(async (msg) => {
    const msgId = typeof msg === 'string' ? msg : (msg?.key?.id || msg?.id);
    if (!msgId) return;

    setMediaCache(prev => {
      if (prev[msgId]?.loading || prev[msgId]?.base64) return prev;
      return { ...prev, [msgId]: { loading: true } };
    });

    const msgObj = typeof msg === 'object' ? msg : messages.find(m => (m.key?.id || m.id) === msgId);
    const isAudioMsg = !!(msgObj?.message?.audioMessage || msgObj?.messageType === 'audioMessage');
    const isDocMsg = !!(msgObj?.message?.documentMessage || msgObj?.messageType === 'documentMessage');
    const isImageMsg = !!(msgObj?.message?.imageMessage || msgObj?.messageType === 'imageMessage');

    const defaultMime = isAudioMsg ? 'audio/ogg' : (isDocMsg ? 'application/pdf' : 'image/jpeg');

    try {
      const inlineBase64 = msgObj?.message?.imageMessage?.base64 ||
        msgObj?.message?.audioMessage?.base64 ||
        msgObj?.message?.documentMessage?.base64;

      if (inlineBase64) {
        const formatted = inlineBase64.startsWith('data:') ? inlineBase64 : `data:${defaultMime};base64,${inlineBase64}`;
        setMediaCache(prev => ({
          ...prev,
          [msgId]: { base64: formatted, mimetype: defaultMime, loading: false, error: false }
        }));
        return;
      }

      const res = await evolutionService.getBase64FromMediaMessage(msgObj || msgId);
      let rawB64 = res?.base64 || res?.media || res?.base64Data || '';
      const mime = (res?.mimetype && res.mimetype !== 'application/octet-stream') ? res.mimetype : defaultMime;

      let finalBase64 = rawB64;
      if (finalBase64 && !finalBase64.startsWith('data:')) {
        finalBase64 = `data:${mime};base64,${finalBase64}`;
      }

      if (!finalBase64 && isImageMsg && msgObj?.message?.imageMessage?.jpegThumbnail) {
        finalBase64 = `data:image/jpeg;base64,${msgObj.message.imageMessage.jpegThumbnail}`;
      }

      setMediaCache(prev => ({
        ...prev,
        [msgId]: { base64: finalBase64, mimetype: mime, loading: false, error: !finalBase64 }
      }));
    } catch (err) {
      console.warn('Error cargando multimedia para mensaje:', msgId, err);
      let fallbackB64 = '';
      if (isImageMsg && msgObj?.message?.imageMessage?.jpegThumbnail) {
        fallbackB64 = `data:image/jpeg;base64,${msgObj.message.imageMessage.jpegThumbnail}`;
      }
      setMediaCache(prev => ({
        ...prev,
        [msgId]: { base64: fallbackB64, mimetype: defaultMime, loading: false, error: !fallbackB64 }
      }));
    }
  }, [messages]);

  useEffect(() => {
    messages.forEach(msg => {
      const isMedia = !!(
        msg.message?.imageMessage || 
        msg.message?.audioMessage || 
        msg.message?.documentMessage ||
        msg.messageType === 'imageMessage' || 
        msg.messageType === 'audioMessage' ||
        msg.messageType === 'documentMessage'
      );
      const msgId = msg.key?.id || msg.id;
      if (isMedia && msgId && !mediaCache[msgId]) {
        loadMediaForMessage(msg);
      }
    });
  }, [messages, loadMediaForMessage, mediaCache]);

  // Ref para auto-scroll del chat
  const messagesEndRef = useRef(null);

  // 1. Verificar Estado de Conexión
  const checkConnection = useCallback(async () => {
    if (!config.apiUrl || !config.apiKey) {
      setConnectionState('close');
      return;
    }
    setIsLoadingState(true);
    try {
      const state = await evolutionService.getConnectionState();
      setConnectionState(state);
      if (state !== 'open') {
        setChats([]);
        setSelectedChat(null);
        setMessages([]);
      }
    } catch (err) {
      console.warn('Error verificando estado de conexión:', err);
      setConnectionState('close');
      setChats([]);
      setSelectedChat(null);
      setMessages([]);
    } finally {
      setIsLoadingState(false);
    }
  }, [config.apiUrl, config.apiKey]);

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 15000);
    return () => clearInterval(interval);
  }, [checkConnection]);

  // 2. Cargar Chats Reales de la API únicamente cuando la conexión está abierta
  const loadChats = useCallback(async () => {
    if (connectionState !== 'open' || !config.apiUrl || !config.apiKey || !config.instance) {
      setChats([]);
      setSelectedChat(null);
      setMessages([]);
      return;
    }
    setIsLoadingChats(true);
    try {
      const response = await evolutionService.fetchChats();
      const chatList = Array.isArray(response) ? response : (response?.chats || response?.data || []);
      setChats(chatList);
    } catch (err) {
      console.warn('No se pudieron obtener chats de Evolution API:', err);
      setChats([]);
    } finally {
      setIsLoadingChats(false);
    }
  }, [config.apiUrl, config.apiKey, config.instance, connectionState]);

  useEffect(() => {
    loadChats();
  }, [loadChats, connectionState]);

  // 3. Cargar Mensajes del Chat Seleccionado
  const loadMessagesForChat = useCallback(async (remoteJid) => {
    if (!remoteJid || connectionState !== 'open' || !config.apiUrl || !config.apiKey || !config.instance) {
      setMessages([]);
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
  }, [config.apiUrl, config.apiKey, config.instance, connectionState]);

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

  // 4. Generar / Obtener Código QR y Cuenta Regresiva
  const handleGenerateQr = useCallback(async (openModal = false) => {
    if (openModal) {
      setShowQrModal(true);
    }
    setIsLoadingQr(true);
    try {
      const qrData = await evolutionService.getQrCode();
      if (qrData?.base64) {
        setQrBase64(qrData.base64);
        setQrCountdown(30);
      } else {
        console.warn('Evolution API no devolvió una imagen base64:', qrData);
        // Si no hay base64, verificar si la conexión se completó
        checkConnection();
      }
    } catch (err) {
      console.error('Error generando QR desde Evolution API:', err);
    } finally {
      setIsLoadingQr(false);
    }
  }, [checkConnection]);

  // Cancelar generación / proceso de QR
  const handleCancelQr = () => {
    setQrBase64('');
    setQrCountdown(0);
    setIsLoadingQr(false);
    setShowQrModal(false);
  };

  // Reintento / temporizador de refresco cuando hay un QR cargado o en el modal
  useEffect(() => {
    let timer;
    if ((qrBase64 || showQrModal) && qrCountdown > 0) {
      timer = setInterval(() => setQrCountdown(prev => prev - 1), 1000);
    } else if ((qrBase64 || showQrModal) && qrCountdown === 0) {
      handleGenerateQr(showQrModal);
    }
    return () => clearInterval(timer);
  }, [qrBase64, showQrModal, qrCountdown, handleGenerateQr]);

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
        await evolutionService.sendTextMessage(remoteJid, textToSend);
        loadMessagesForChat(remoteJid);
      }
    } catch (err) {
      console.error('Error enviando mensaje:', err);
      const msg = typeof err?.message === 'string' ? err.message : (typeof err === 'string' ? err : JSON.stringify(err?.message || err));
      alert('Error enviando mensaje: ' + msg);
    } finally {
      setIsSending(false);
    }
  };

  // 7. Grabación de Nota de Voz
  const startRecording = async () => {
    if (!navigator?.mediaDevices?.getUserMedia) {
      alert('El acceso al micrófono no está disponible en este navegador o requiere conexión segura (HTTPS).');
      return;
    }

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
            try {
              setIsSending(true);
              if (config.apiUrl && config.apiKey) {
                await evolutionService.sendAudioMessage(remoteJid, base64Audio);
                loadMessagesForChat(remoteJid);
              }
            } catch (err) {
              console.error('Error enviando nota de voz:', err);
              alert('Error enviando nota de voz: ' + err.message);
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
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        alert('Permiso de micrófono denegado. Habilita el acceso al micrófono en la barra de dirección de tu navegador.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        alert('No se detectó ningún micrófono conectado al equipo.');
      } else {
        alert('No se pudo acceder al micrófono: ' + (err.message || 'Error de hardware o permisos.'));
      }
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
          await evolutionService.sendMediaMessage(remoteJid, base64Media, mediatype, file.name, file.name);
          loadMessagesForChat(remoteJid);
        }
      } catch (err) {
        console.error('Error enviando archivo:', err);
        const msg = typeof err?.message === 'string' ? err.message : (typeof err === 'string' ? err : JSON.stringify(err?.message || err));
        alert('Error al enviar archivo: ' + msg);
      } finally {
        setIsSending(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
  };

  // 9. Filtrado de Chats y Match con Clientes VETSOFT
  const processedChats = useMemo(() => {
    return chats.map(chat => {
      const cleanPhone = extractPhoneFromChat(chat);
      const clientMatch = cleanPhone ? findClientForPhone(cleanPhone, patientsList) : null;
      const displayName = resolveChatDisplayName(chat, patientsList);
      
      return {
        ...chat,
        rawNum: cleanPhone || (chat.remoteJid || chat.id || '').split('@')[0],
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
            <p className="text-xs text-slate-500 font-medium">Integración WhatsApp Web</p>
          </div>
        </div>

        {/* Indicador de Estado e Interacciones */}
        <div className="flex items-center gap-3">
          {/* Badge de Estado */}
          <div className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 border transition-all ${
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
                <span>Estado de conexión: Conectado</span>
              </>
            ) : connectionState === 'connecting' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Estado de conexión: Conectando...</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <WifiOff className="w-3.5 h-3.5" />
                <span>Estado de conexión: Desconectado</span>
              </>
            )}
          </div>

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
              <strong>Modo Demostración Activo:</strong> Faltan configurar las credenciales del servidor de mensajería para enviar mensajes reales.
            </span>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MAIN WORKSPACE: PANTALLA DE VINCULACIÓN O CHAT INTERFACE               */}
      {/* --------------------------------------------------------------------- */}
      <div className="flex-1 flex overflow-hidden">
        {connectionState !== 'open' ? (
          /* PANTALLA DE VINCULACIÓN AMPLIADA (SIN INTERFAZ DE CHAT LATERAL) */
          <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 bg-slate-100/70 overflow-y-auto">
            <div className="bg-white rounded-[2.5rem] p-8 md:p-12 max-w-4xl md:max-w-5xl w-full shadow-2xl border border-slate-200/80 text-left my-auto">
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
                <div className="p-4 bg-emerald-100 text-emerald-700 rounded-3xl shrink-0">
                  <QrCode className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900">Vincular WhatsApp con VetSoft</h2>
                  <p className="text-sm text-slate-500 font-medium">Sincroniza tu cuenta de WhatsApp para gestionar las conversaciones con tutores</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
                {/* Columna Izquierda: Instructivo en Español Ampliado */}
                <div className="md:col-span-7 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold text-slate-800 mb-6 tracking-tight">
                      Para usar WhatsApp en VetSoft:
                    </h3>

                    <ol className="space-y-5 text-sm md:text-base text-slate-700 font-normal leading-relaxed">
                      <li className="flex items-start gap-3">
                        <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">1</span>
                        <span className="pt-0.5">Abre <strong className="font-semibold text-slate-900">WhatsApp</strong> en tu teléfono</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">2</span>
                        <span className="pt-0.5">
                          Toca <strong className="font-semibold text-slate-900">Menú</strong> <MoreVertical className="w-4 h-4 inline text-slate-500 mx-0.5" /> o <strong className="font-semibold text-slate-900">Ajustes</strong> <Settings className="w-4 h-4 inline text-slate-500 mx-0.5" /> y selecciona <strong className="font-semibold text-slate-900">Dispositivos vinculados</strong>
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">3</span>
                        <span className="pt-0.5">Apunta tu teléfono a esta pantalla para capturar el código</span>
                      </li>
                    </ol>
                  </div>

                  {/* BOTÓN Generar QR Y Cancelar ABAJO DEL INSTRUCTIVO */}
                  <div className="mt-8 flex flex-col items-start gap-3.5">
                    <button
                      onClick={() => handleGenerateQr(false)}
                      disabled={isLoadingQr}
                      className="w-full sm:w-72 md:w-80 py-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-2xl text-sm md:text-base font-bold transition-all cursor-pointer flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-100 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-5 h-5 ${isLoadingQr ? 'animate-spin' : ''}`} />
                      <span>{qrBase64 ? 'Regenerar Código QR' : 'Generar QR'}</span>
                    </button>

                    {(qrBase64 || isLoadingQr) && (
                      <button
                        onClick={handleCancelQr}
                        className="w-full sm:w-72 md:w-80 py-4 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-2xl text-sm md:text-base font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 border border-slate-300 shadow-xs animate-in fade-in"
                      >
                        <X className="w-5 h-5 text-slate-500" />
                        <span>Cancelar</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Columna Derecha: Código QR Ampliado */}
                <div className="md:col-span-5 flex flex-col items-center justify-center">
                  <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-6 shadow-xl flex flex-col items-center justify-center min-h-[300px] w-full max-w-[300px]">
                    {isLoadingQr ? (
                      <div className="flex flex-col items-center gap-3 text-sm text-slate-500 p-6 text-center">
                        <RefreshCw className="w-10 h-10 animate-spin text-emerald-600" />
                        <span className="font-semibold">Obteniendo código QR de WhatsApp...</span>
                      </div>
                    ) : qrBase64 ? (
                      <div className="flex flex-col items-center">
                        <img
                          src={qrBase64.startsWith('data:') ? qrBase64 : `data:image/png;base64,${qrBase64}`}
                          alt="Código QR de WhatsApp"
                          className="w-56 h-56 md:w-60 md:h-60 rounded-2xl object-contain border border-slate-100 p-1 shadow-xs"
                        />
                        <div className="mt-4 flex items-center gap-2 text-xs md:text-sm text-slate-600 font-medium">
                          <Clock className="w-4 h-4 text-emerald-600" />
                          <span>Actualiza en:</span>
                          <span className="font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg">
                            {qrCountdown}s
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4 text-slate-400 p-6 text-center">
                        <div className="p-4 bg-slate-50 text-slate-400 rounded-3xl border border-slate-200">
                          <QrCode className="w-14 h-14" />
                        </div>
                        <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed">
                          Haz clic en el botón <strong className="text-emerald-600 font-semibold">"Generar QR"</strong> para solicitar el código de conexión.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* INTERFAZ COMPLETA DE CHAT CUANDO CONEXIÓN === 'open' */
          <>
            {/* PANEL LATERAL IZQUIERDO: LISTA DE CHATS */}
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
                    const avatarUrl = getChatAvatarUrl(chat);
                    const chatId = chat.id || chat.remoteJid;
                    const hasAvatar = avatarUrl && !avatarErrors[chatId];

                    return (
                      <div
                        key={chatId}
                        onClick={() => setSelectedChat(chat)}
                        className={`p-3.5 flex items-center gap-3 cursor-pointer transition-colors relative ${
                          isSelected
                            ? 'bg-emerald-50/80 border-l-4 border-emerald-600'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs shrink-0 shadow-xs overflow-hidden border border-slate-200 relative">
                          {hasAvatar ? (
                            <img
                              src={avatarUrl}
                              alt={chat.displayName}
                              onError={() => handleAvatarError(chatId)}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            initials
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs text-slate-800 truncate">
                              {chat.displayName}
                            </span>
                            <span className="text-[10px] text-slate-400">{timeStr}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {lastMsgContent}
                          </p>
                        </div>
                        {chat.unreadCount > 0 && (
                          <span className="w-4 h-4 bg-emerald-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </aside>

            {/* ÁREA PRINCIPAL DERECHA: CONVERSACIÓN SELECCIONADA */}
            <main className="flex-1 flex flex-col bg-[#efeae2] h-full overflow-hidden">
              {selectedChat ? (
                <>
                  {/* Header Chat Seleccionado */}
                  <header className="bg-[#f0f2f5] border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-xs z-10">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const selectedAvatarUrl = getChatAvatarUrl(selectedChat);
                        const selectedChatId = selectedChat.id || selectedChat.remoteJid;
                        const hasSelectedAvatar = selectedAvatarUrl && !avatarErrors[selectedChatId];
                        return (
                          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-slate-200 relative">
                            {hasSelectedAvatar ? (
                              <img
                                src={selectedAvatarUrl}
                                alt={selectedChat.displayName}
                                onError={() => handleAvatarError(selectedChatId)}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span>{selectedChat.displayName.substring(0, 2).toUpperCase()}</span>
                            )}
                          </div>
                        );
                      })()}
                      <div>
                        <h2 className="font-bold text-slate-800 text-xs md:text-sm">
                          {selectedChat.displayName}
                        </h2>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {selectedChat.rawNum}
                        </span>
                      </div>
                    </div>
                  </header>

                  {/* Lista de Mensajes con Fondo Característico de WhatsApp */}
                  <div 
                    className="flex-1 overflow-y-auto p-6 space-y-3"
                    style={WHATSAPP_WALLPAPER_STYLE}
                  >
                    {isLoadingMessages ? (
                      <div className="flex items-center justify-center h-full text-xs text-slate-500 gap-2 bg-white/70 backdrop-blur-xs py-3 px-6 rounded-full w-max mx-auto shadow-xs">
                        <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                        <span>Cargando mensajes...</span>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-4 text-xs text-slate-600 bg-amber-50/90 border border-amber-200/80 rounded-xl max-w-md mx-auto shadow-xs px-4">
                        No hay mensajes registrados en esta conversación.
                      </div>
                    ) : (
                      messages.map((msg, idx) => {
                        const isFromMe = msg.key?.fromMe;
                        const text = extractMessageContent(msg.message);
                        const time = formatChatTimestamp(msg.messageTimestamp);
                        const msgId = msg.key?.id || msg.id;

                        const isImage = !!(msg.message?.imageMessage || msg.messageType === 'imageMessage');
                        const isAudio = !!(msg.message?.audioMessage || msg.messageType === 'audioMessage');
                        const isDoc = !!(msg.message?.documentMessage || msg.messageType === 'documentMessage');
                        const mediaData = msgId ? mediaCache[msgId] : null;
                        const caption = msg.message?.imageMessage?.caption || msg.message?.documentMessage?.caption || '';

                        return (
                          <div
                            key={msgId || idx}
                            className={`flex flex-col ${isFromMe ? 'items-end' : 'items-start'}`}
                          >
                            <div
                              className={`max-w-[85%] md:max-w-[70%] rounded-xl px-3.5 py-2 text-xs shadow-xs relative ${
                                isFromMe
                                  ? 'bg-[#d9fdd3] text-slate-900 rounded-tr-xs border border-emerald-200/50'
                                  : 'bg-white text-slate-900 rounded-tl-xs border border-slate-200/70'
                              }`}
                            >
                              {/* RENDERIZADO DE IMAGEN */}
                              {isImage && (
                                <div className="mb-1 rounded-lg overflow-hidden max-w-xs">
                                  {mediaData?.loading ? (
                                    <div className="flex items-center gap-2 p-4 text-xs text-slate-500 bg-slate-100/80 rounded-lg animate-pulse">
                                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                                      <span>Cargando imagen...</span>
                                    </div>
                                  ) : mediaData?.base64 ? (
                                    <img
                                      src={mediaData.base64}
                                      alt="Imagen enviada"
                                      onClick={() => setLightboxImage(mediaData.base64)}
                                      className="rounded-lg max-h-72 w-full object-cover cursor-pointer hover:opacity-95 transition-opacity border border-slate-200/50 shadow-2xs"
                                    />
                                  ) : (
                                    <div className="flex items-center gap-2 p-2.5 text-xs text-slate-500 bg-slate-100 rounded-lg">
                                      <ImageIcon className="w-4 h-4 text-slate-400" />
                                      <span>📷 Imagen</span>
                                    </div>
                                  )}
                                  {caption && <p className="mt-1.5 text-xs whitespace-pre-wrap">{caption}</p>}
                                </div>
                              )}

                              {/* RENDERIZADO DE AUDIO / NOTA DE VOZ */}
                              {isAudio && (
                                <div className="my-1 min-w-[240px] max-w-xs">
                                  {mediaData?.loading ? (
                                    <div className="flex items-center gap-2 p-2.5 text-xs text-slate-500 bg-slate-100/80 rounded-lg animate-pulse">
                                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                                      <span>Cargando nota de voz...</span>
                                    </div>
                                  ) : mediaData?.base64 ? (
                                    <div className="flex flex-col gap-1">
                                      <audio 
                                        controls 
                                        controlsList="nodownload" 
                                        src={mediaData.base64} 
                                        className="w-full h-9 rounded-lg"
                                      />
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 p-2 text-xs text-slate-500 bg-slate-100 rounded-lg">
                                      <Volume2 className="w-4 h-4 text-emerald-600" />
                                      <span>🎵 Audio de voz</span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* RENDERIZADO DE DOCUMENTO */}
                              {isDoc && (
                                <div className="mb-1">
                                  {mediaData?.base64 ? (
                                    <a
                                      href={mediaData.base64}
                                      download={msg.message?.documentMessage?.fileName || 'documento.pdf'}
                                      className="flex items-center gap-2.5 p-2.5 bg-slate-100/90 hover:bg-slate-200 rounded-xl transition-colors text-slate-800 text-xs font-medium border border-slate-200/80"
                                    >
                                      <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
                                      <span className="truncate flex-1">{msg.message?.documentMessage?.fileName || 'Descargar archivo'}</span>
                                      <Download className="w-4 h-4 text-slate-500 shrink-0" />
                                    </a>
                                  ) : (
                                    <div className="flex items-center gap-2 p-2 text-xs text-slate-600 bg-slate-100 rounded-lg">
                                      <FileText className="w-4 h-4 text-slate-500" />
                                      <span>📄 {msg.message?.documentMessage?.fileName || 'Documento'}</span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* RENDERIZADO DE TEXTO REGULAR */}
                              {!isImage && !isAudio && !isDoc && (
                                <p className="whitespace-pre-wrap leading-relaxed text-[13px]">{text}</p>
                              )}

                              <div
                                className={`text-[10px] mt-1 text-right flex items-center justify-end gap-1 ${
                                  isFromMe ? 'text-slate-500' : 'text-slate-400'
                                }`}
                              >
                                <span>{time}</span>
                                {isFromMe && <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Zona de Entrada de Mensaje */}
                  <div className="p-3.5 bg-[#f0f2f5] border-t border-slate-200">
                    {/* Dropdown de Plantillas */}
                    {showTemplatesDropdown && (
                      <div className="mb-3 p-3 bg-purple-50 border border-purple-200 rounded-2xl animate-in fade-in">
                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-purple-200">
                          <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
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
                          className="p-2.5 bg-slate-200/80 hover:bg-slate-300 text-slate-700 rounded-xl transition-all cursor-pointer"
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
                          className="flex-1 bg-white border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-emerald-500/50 font-normal shadow-2xs"
                        />

                        {/* Botón Grabadora o Envío */}
                        {messageText.trim() ? (
                          <button
                            type="submit"
                            disabled={isSending}
                            className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-xs"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={startRecording}
                            className="p-2.5 bg-slate-200/80 hover:bg-rose-100 text-slate-700 hover:text-rose-600 rounded-xl transition-all cursor-pointer"
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
                /* Estado Vacío con Fondo Característico de WhatsApp */
                <div 
                  className="flex-1 flex flex-col items-center justify-center p-8 text-center"
                  style={WHATSAPP_WALLPAPER_STYLE}
                >
                  <div className="bg-white/90 backdrop-blur-sm border border-slate-200/90 rounded-3xl p-8 max-w-md shadow-xl flex flex-col items-center">
                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full mb-4 border border-emerald-200 shadow-xs">
                      <MessageSquare className="w-12 h-12" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-base mb-1.5">WhatsApp Web para VetSoft</h3>
                    <p className="text-xs text-slate-600 leading-relaxed mb-4">
                      Selecciona una conversación del panel de la izquierda para ver el historial de mensajes o chatear directamente con los tutores de tus pacientes.
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Mensajería en tiempo real</span>
                    </div>
                  </div>
                </div>
              )}
            </main>
          </>
        )}
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* MODAL: ESCANEAR CÓDIGO QR PARA CONECTAR INSTANCIA                    */}
      {/* --------------------------------------------------------------------- */}
      {showQrModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] p-8 md:p-12 max-w-4xl md:max-w-5xl w-full shadow-2xl border border-slate-100 relative text-left">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
              {/* Columna Izquierda: Instructivo en Español Ampliado */}
              <div className="md:col-span-7 flex flex-col justify-between">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-6 tracking-tight">
                    Para usar WhatsApp en VetSoft:
                  </h2>

                  <ol className="space-y-5 text-sm md:text-base text-slate-700 font-normal leading-relaxed">
                    <li className="flex items-start gap-3">
                      <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">1</span>
                      <span className="pt-0.5">Abre <strong className="font-semibold text-slate-900">WhatsApp</strong> en tu teléfono</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">2</span>
                      <span className="pt-0.5">
                        Toca <strong className="font-semibold text-slate-900">Menú</strong> <MoreVertical className="w-4 h-4 inline text-slate-500 mx-0.5" /> o <strong className="font-semibold text-slate-900">Ajustes</strong> <Settings className="w-4 h-4 inline text-slate-500 mx-0.5" /> y selecciona <strong className="font-semibold text-slate-900">Dispositivos vinculados</strong>
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">3</span>
                      <span className="pt-0.5">Apunta tu teléfono a esta pantalla para capturar el código</span>
                    </li>
                  </ol>
                </div>

                  {/* BOTÓN "Generar QR" Y Cancelar ABAJO DEL INSTRUCTIVO */}
                  <div className="mt-8 flex flex-col items-start gap-3.5">
                    <button
                      onClick={() => handleGenerateQr(true)}
                      disabled={isLoadingQr}
                      className="w-full sm:w-72 md:w-80 py-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-2xl text-sm md:text-base font-bold transition-all cursor-pointer flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-100 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-5 h-5 ${isLoadingQr ? 'animate-spin' : ''}`} />
                      <span>{qrBase64 ? 'Regenerar Código QR' : 'Generar QR'}</span>
                    </button>

                    {(qrBase64 || isLoadingQr) && (
                      <button
                        onClick={handleCancelQr}
                        className="w-full sm:w-72 md:w-80 py-4 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-2xl text-sm md:text-base font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 border border-slate-300 shadow-xs animate-in fade-in"
                      >
                        <X className="w-5 h-5 text-slate-500" />
                        <span>Cancelar</span>
                      </button>
                    )}
                  </div>
              </div>

              {/* Columna Derecha: Código QR Ampliado */}
              <div className="md:col-span-5 flex flex-col items-center justify-center">
                <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-6 shadow-xl flex flex-col items-center justify-center min-h-[300px] w-full max-w-[300px]">
                  {isLoadingQr ? (
                    <div className="flex flex-col items-center gap-3 text-sm text-slate-500 p-6 text-center">
                      <RefreshCw className="w-10 h-10 animate-spin text-emerald-600" />
                      <span className="font-semibold">Obteniendo código QR de WhatsApp...</span>
                    </div>
                  ) : qrBase64 ? (
                    <div className="flex flex-col items-center">
                      <img
                        src={qrBase64.startsWith('data:') ? qrBase64 : `data:image/png;base64,${qrBase64}`}
                        alt="Código QR de WhatsApp"
                        className="w-56 h-56 md:w-60 md:h-60 rounded-2xl object-contain border border-slate-100 p-1 shadow-xs"
                      />
                      <div className="mt-4 flex items-center gap-2 text-xs md:text-sm text-slate-600 font-medium">
                        <Clock className="w-4 h-4 text-emerald-600" />
                        <span>Actualiza en:</span>
                        <span className="font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg">
                          {qrCountdown}s
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4 text-slate-400 p-6 text-center">
                      <div className="p-4 bg-slate-50 text-slate-400 rounded-3xl border border-slate-200">
                        <QrCode className="w-14 h-14" />
                      </div>
                      <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed">
                        Haz clic en el botón <strong className="text-emerald-600 font-semibold">"Generar QR"</strong> para solicitar el código de conexión.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
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
              Se desvinculará tu cuenta de WhatsApp y deberás volver a escanear el código QR para enviar mensajes.
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
