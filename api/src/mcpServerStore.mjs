import EventEmitter from 'node:events';
import { ToolStore } from './toolStore.mjs';

export class McpServerStore {

  /**
   * Create a new store for MCP Servers
   * @param {ToolStore} toolStore A tool store
   */
  constructor(toolStore) {
    this.toolStore = toolStore;
    this.mcpServers = [];
    this.eventEmitter = new EventEmitter();
  }

  /**
   * Add a new MCP Server
   * @param {McpServer} mcpServer The MCP Server to add
   */
  addMcpServer(mcpServer) {
    this.mcpServers.push(mcpServer);

    const self = this;
    mcpServer.onNewToolListing = (tools, oldTools) => {
      oldTools.forEach(tool => self.toolStore.removeToolByName(tool.name));
      tools.forEach(tool => self.toolStore.addTool(tool));
      self.eventEmitter.emit('mcpServerUpdated', mcpServer);
    };

    mcpServer.getTools().forEach(tool => {
      this.toolStore.addTool(tool);
    });

    this.eventEmitter.emit('mcpServerAdded', mcpServer);
  }

  /**
   * Remove an MCP Server
   * @param {string} mcpServerName The name of the MCP Server to remove
   */
  async removeMcpServerByName(mcpServerName) {
    const mcpServer = this.mcpServers.find(server => server.name === mcpServerName);
    if (!mcpServer) {
      return;
    }

    await mcpServer.shutdown();
    
    this.mcpServers = this.mcpServers.filter(server => server.name !== mcpServerName);

    mcpServer.getTools().forEach(tool => {
      this.toolStore.removeToolByName(tool.name);
    });

    this.eventEmitter.emit('mcpServerRemoved', mcpServer);
  }

  /**
   * Get all MCP Servers
   * @returns {McpServer[]} The MCP Servers
   */
  getMcpServers() {
    return this.mcpServers;
  }

  onMcpServerAdded(callback) {
    this.eventEmitter.on('mcpServerAdded', callback);
  }

  onMcpServerUpdated(callback) {
    this.eventEmitter.on('mcpServerUpdated', callback);
  }

  onMcpServerRemoved(callback) {
    this.eventEmitter.on('mcpServerRemoved', callback);
  }

  getMcpServersJSON() {
    return this.mcpServers.map(server => server.toJSON());
  }

  async shutdown() {
    for (const mcpServer of this.mcpServers) {
      await mcpServer.shutdown();
    }
  }
}