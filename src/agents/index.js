// Minimal stub for legacy agents to keep build working without altering components
export const agentSDK = {
  async createConversation() {
    return { id: 'stub-conversation' };
  },
  async addMessage() {
    return { ok: true };
  },
  async getConversation() {
    return { messages: [] };
  }
};


