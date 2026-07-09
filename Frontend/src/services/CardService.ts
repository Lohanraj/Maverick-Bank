const API = 'https://localhost:7174/api/Cards';

const getHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const CardService = {
  getMyCards: async (): Promise<any[]> => {
    const res = await fetch(`${API}/mycards`, {
      method: 'GET',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to load cards');
    return res.json();
  },

  applyCard: async (accountId: number, cardType: string, pin: string): Promise<any> => {
    const res = await fetch(`${API}/apply`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ accountId, cardType, pin })
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || 'Failed to apply for card');
    }
    return res.json();
  },

  toggleBlock: async (cardId: number): Promise<any> => {
    const res = await fetch(`${API}/toggleblock/${cardId}`, {
      method: 'PUT',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to toggle block status');
    return res.json();
  },

  updateLimits: async (cardId: number, dailyAtmLimit: number, dailyOnlineLimit: number): Promise<any> => {
    const res = await fetch(`${API}/limits/${cardId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ dailyAtmLimit, dailyOnlineLimit })
    });
    if (!res.ok) throw new Error('Failed to update card limits');
    return res.json();
  },

  updatePin: async (cardId: number, oldPin: string, newPin: string): Promise<any> => {
    const res = await fetch(`${API}/pin/${cardId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ oldPin, newPin })
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || 'Failed to update PIN');
    }
    return res.json();
  }
};
