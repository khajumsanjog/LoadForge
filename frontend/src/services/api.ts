import { useState, useEffect } from 'react';
import { TestConfig, TestRun, ComparisonResult, MetricSnapshot } from '../types';

const API_BASE = '/api';

export const api = {
  async getConfigs(): Promise<TestConfig[]> {
    const res = await fetch(`${API_BASE}/configs`);
    return res.json();
  },

  async saveConfig(config: Partial<TestConfig>): Promise<TestConfig> {
    const res = await fetch(`${API_BASE}/configs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return res.json();
  },

  async startTest(config: TestConfig): Promise<TestRun> {
    const res = await fetch(`${API_BASE}/tests/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || 'Failed to start load test');
    }
    return res.json();
  },

  async stopTest(): Promise<{ status: string }> {
    const res = await fetch(`${API_BASE}/tests/stop`, { method: 'POST' });
    return res.json();
  },

  async getActiveTest(): Promise<{ active: boolean; run?: TestRun }> {
    const res = await fetch(`${API_BASE}/tests/active`);
    return res.json();
  },

  async getRuns(): Promise<TestRun[]> {
    const res = await fetch(`${API_BASE}/runs`);
    return res.json();
  },

  async getRun(id: string): Promise<TestRun> {
    const res = await fetch(`${API_BASE}/runs/${id}`);
    return res.json();
  },

  async deleteRun(id: string): Promise<void> {
    await fetch(`${API_BASE}/runs/${id}`, { method: 'DELETE' });
  },

  async compareRuns(baselineId: string, targetId: string): Promise<ComparisonResult> {
    const res = await fetch(`${API_BASE}/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ baselineId, targetId }),
    });
    return res.json();
  },

  async importCURL(curlCmd: string): Promise<TestConfig> {
    const res = await fetch(`${API_BASE}/import/curl`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: curlCmd,
    });
    return res.json();
  },

  async importPostman(jsonContent: string): Promise<TestConfig> {
    const res = await fetch(`${API_BASE}/import/postman`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: jsonContent,
    });
    return res.json();
  },

  async importOpenAPI(jsonContent: string): Promise<TestConfig> {
    const res = await fetch(`${API_BASE}/import/openapi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: jsonContent,
    });
    return res.json();
  },
};

export function useLoadForgeWebSocket() {
  const [snapshot, setSnapshot] = useState<MetricSnapshot | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    let socket: WebSocket | null = null;
    let timer: any = null;

    const connect = () => {
      try {
        socket = new WebSocket(wsUrl);
        socket.onopen = () => setIsConnected(true);
        socket.onmessage = (event) => {
          try {
            const data: MetricSnapshot = JSON.parse(event.data);
            setSnapshot(data);
          } catch (e) {
            console.error('WS parse error:', e);
          }
        };
        socket.onclose = () => {
          setIsConnected(false);
          timer = setTimeout(connect, 2000);
        };
        socket.onerror = () => setIsConnected(false);
      } catch (e) {
        timer = setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      if (socket) socket.close();
      if (timer) clearTimeout(timer);
    };
  }, []);

  return { snapshot, isConnected };
}
