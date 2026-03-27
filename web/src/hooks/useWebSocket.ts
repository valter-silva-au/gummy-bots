import { useCallback, useEffect, useRef, useState } from 'react';

export interface WSMessage {
  type: string;
  payload?: unknown;
}

const WS_URL = 'ws://localhost:8088/ws';
const RECONNECT_BASE = 1000;
const RECONNECT_MAX = 30000;

export function useWebSocket(onMessage?: (msg: WSMessage) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptRef = useRef(0);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        setIsConnected(true);
        attemptRef.current = 0; // Reset backoff on successful connect
        ws.send(JSON.stringify({ type: 'ping' }));
      };

      ws.onmessage = (event) => {
        try {
          const msg: WSMessage = JSON.parse(event.data);
          onMessage?.(msg);
        } catch {
          // Ignore malformed messages
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;
        // Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 30s
        const delay = Math.min(RECONNECT_MAX, RECONNECT_BASE * Math.pow(2, attemptRef.current));
        attemptRef.current++;
        reconnectTimer.current = setTimeout(connect, delay);
      };

      ws.onerror = () => {
        ws.close();
      };

      wsRef.current = ws;
    } catch {
      const delay = Math.min(RECONNECT_MAX, RECONNECT_BASE * Math.pow(2, attemptRef.current));
      attemptRef.current++;
      reconnectTimer.current = setTimeout(connect, delay);
    }
  }, [onMessage]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const send = useCallback((msg: WSMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  return { isConnected, send };
}
