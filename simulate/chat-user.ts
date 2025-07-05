import * as readline from 'readline';
import { ChatAPI } from './api-client';

// Colores para la consola (simple implementación sin dependencias)
const colors = {
  red: (text: string) => `\x1b[31m${text}\x1b[0m`,
  green: (text: string) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text: string) => `\x1b[33m${text}\x1b[0m`,
  blue: (text: string) => `\x1b[34m${text}\x1b[0m`,
  magenta: (text: string) => `\x1b[35m${text}\x1b[0m`,
  cyan: (text: string) => `\x1b[36m${text}\x1b[0m`,
  white: (text: string) => `\x1b[37m${text}\x1b[0m`,
  gray: (text: string) => `\x1b[90m${text}\x1b[0m`,
  reset: '\x1b[0m'
};

// Configuraciones predefinidas de usuarios para testing
const USERS = {
  1: { email: 'test@example.com', password: '123456', name: 'TestUser' },
  2: { email: 'maria@example.com', password: '123456', name: 'Maria' },
  3: { email: 'fixed@example.com', password: '123456', name: 'FixedUser' }
};

class ChatSimulator {
  private api: ChatAPI;
  private rl: readline.Interface;
  private currentUser: any;
  private chatPartner: any;
  private chatPartnerId: string = '';
  private displayedMessageIds: Set<string> = new Set();
  private pollingInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor() {
    this.api = new ChatAPI();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: colors.green('> ')
    });

    // Manejar Ctrl+C
    this.rl.on('SIGINT', () => {
      this.exit();
    });
  }

  private clearScreen() {
    console.clear();
  }

  private formatTimestamp(timestamp: string): string {
    try {
      const date = new Date(timestamp);
      // Verificar que la fecha sea válida
      if (isNaN(date.getTime())) {
        return 'Invalid time';
      }
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      return 'Invalid time';
    }
  }

  private displayHeader() {
    console.log(colors.cyan('════════════════════════════════════════'));
    console.log(colors.cyan('           CHAT SIMULATOR'));
    console.log(colors.cyan('════════════════════════════════════════'));
    
    if (this.currentUser && this.chatPartner) {
      console.log(colors.yellow(`👤 Logged as: ${this.currentUser.username}`));
      console.log(colors.yellow(`💬 Chatting with: ${this.chatPartner.username}`));
      console.log(colors.gray('Commands: /help, /refresh, /exit'));
      console.log(colors.cyan('═══════════════════════════════════════\n'));
    }
  }

  private displayMessage(message: any, isOwn: boolean = false) {
    // Verificar que el timestamp sea válido
    const timestamp = message.messageDate ? this.formatTimestamp(message.messageDate) : 'Unknown time';
    
    // Usar fromUserData si está disponible, si no usar "Unknown"
    const username = message.fromUserData?.username || 'Unknown';
    
    if (isOwn) {
      console.log(colors.blue(`[${timestamp}] You: ${message.message}`));
    } else {
      console.log(colors.green(`[${timestamp}] ${username}: ${message.message}`));
    }
  }

  private displayHelp() {
    console.log(colors.yellow('\n📋 Available Commands:'));
    console.log(colors.white('  /help     - Show this help'));
    console.log(colors.white('  /refresh  - Refresh messages manually'));
    console.log(colors.white('  /clear    - Clear screen and show full history'));
    console.log(colors.white('  /exit     - Exit the chat'));
    console.log(colors.gray('  Just type a message and press Enter to send\n'));
  }

  async selectUser(): Promise<void> {
    console.log(colors.cyan('🚀 Welcome to Chat Simulator!\n'));
    console.log(colors.yellow('Available users for testing:'));
    
    Object.entries(USERS).forEach(([id, user]) => {
      console.log(colors.white(`  ${id}. ${user.name} (${user.email})`));
    });

    const userId = await this.askQuestion(colors.green('\nSelect user (1-3): '));
    
    if (!USERS[userId as unknown as keyof typeof USERS]) {
      console.log(colors.red('❌ Invalid user selection'));
      await this.selectUser();
      return;
    }

    const selectedUser = USERS[userId as unknown as keyof typeof USERS];
    
    try {
      console.log(colors.yellow(`\n🔐 Logging in as ${selectedUser.name}...`));
      const loginResult = await this.api.login(selectedUser.email, selectedUser.password);
      
      this.currentUser = loginResult.user;
      console.log(colors.green(`✅ Successfully logged in as ${this.currentUser.username}!`));
      
      await this.selectChatPartner();
      
    } catch (error: any) {
      console.log(colors.red(`❌ Login failed: ${error.message}`));
      console.log(colors.yellow('Please make sure the backend server is running on localhost:3000'));
      process.exit(1);
    }
  }

  async selectChatPartner(): Promise<void> {
    console.log(colors.yellow('\nWho do you want to chat with?'));
    
    const availablePartners = Object.entries(USERS).filter(([id, user]) => 
      user.email !== this.currentUser.email
    );

    availablePartners.forEach(([id, user]) => {
      console.log(colors.white(`  ${id}. ${user.name} (${user.email})`));
    });

    const partnerId = await this.askQuestion(colors.green('\nSelect chat partner: '));
    
    const selectedPartner = USERS[partnerId as unknown as keyof typeof USERS];
    if (!selectedPartner || selectedPartner.email === this.currentUser.email) {
      console.log(colors.red('❌ Invalid partner selection or same as current user'));
      await this.selectChatPartner();
      return;
    }

    try {
      // Obtener el ID real del usuario desde la base de datos
      console.log(colors.yellow(`🔍 Looking up user ${selectedPartner.name}...`));
      const partnerData = await this.api.getUserByEmail(selectedPartner.email);
      
      this.chatPartnerId = partnerData.id;
      this.chatPartner = { 
        id: partnerData.id,
        username: partnerData.username, 
        email: partnerData.email 
      };
      
      console.log(colors.green(`✅ Chat partner set: ${this.chatPartner.username} (ID: ${this.chatPartnerId})`));
      
      await this.startChat();
    } catch (error: any) {
      console.log(colors.red(`❌ Failed to find chat partner: ${error.message}`));
      await this.selectChatPartner();
    }
  }

  async startChat(): Promise<void> {
    this.isRunning = true;
    this.clearScreen();
    this.displayHeader();

    // Cargar mensajes existentes
    await this.refreshMessages();

    // Iniciar polling para nuevos mensajes
    this.startPolling();

    // Configurar input del usuario
    this.rl.on('line', async (input: string) => {
      const message = input.trim();
      
      if (message.startsWith('/')) {
        await this.handleCommand(message);
      } else if (message.length > 0) {
        await this.sendMessage(message);
      }
      
      if (this.isRunning) {
        this.rl.prompt();
      }
    });

    console.log(colors.green('💬 Chat started! Type a message or /help for commands.'));
    this.rl.prompt();
  }

  async handleCommand(command: string): Promise<void> {
    switch (command.toLowerCase()) {
      case '/help':
        this.displayHelp();
        break;
      case '/refresh':
        await this.refreshMessages();
        break;
      case '/clear':
        await this.clearAndShowHistory();
        break;
      case '/exit':
        this.exit();
        break;
      default:
        console.log(colors.red(`❌ Unknown command: ${command}. Type /help for available commands.`));
    }
  }

  async sendMessage(message: string): Promise<void> {
    try {
      const sentMessage = await this.api.sendMessage(this.chatPartnerId, message);
      console.log(colors.blue(`[${this.formatTimestamp(new Date().toISOString())}] You: ${message}`));
      // Marcar este mensaje como ya mostrado
      this.displayedMessageIds.add(sentMessage.id);
    } catch (error: any) {
      console.log(colors.red(`❌ Failed to send message: ${error.message}`));
    }
  }

  async refreshMessages(): Promise<void> {
    try {
      const conversation = await this.api.getConversation(this.chatPartnerId, 50);
      
      // Ordenar mensajes por fecha
      const sortedMessages = conversation.messages.sort((a, b) => 
        new Date(a.messageDate).getTime() - new Date(b.messageDate).getTime()
      );
      
      // Solo mostrar mensajes que no hemos mostrado antes
      const newMessages = sortedMessages.filter(message => 
        !this.displayedMessageIds.has(message.id)
      );
      
      newMessages.forEach(message => {
        const isOwn = message.fromUser === this.api.currentUserId;
        this.displayMessage(message, isOwn);
        // Marcar como mostrado
        this.displayedMessageIds.add(message.id);
      });
      
    } catch (error: any) {
      console.log(colors.red(`❌ Failed to refresh messages: ${error.message}`));
    }
  }

  async clearAndShowHistory(): Promise<void> {
    try {
      this.clearScreen();
      this.displayHeader();
      
      // Limpiar mensajes mostrados y volver a cargar todo
      this.displayedMessageIds.clear();
      
      const conversation = await this.api.getConversation(this.chatPartnerId, 50);
      
      // Ordenar mensajes por fecha
      const sortedMessages = conversation.messages.sort((a, b) => 
        new Date(a.messageDate).getTime() - new Date(b.messageDate).getTime()
      );
      
      console.log(colors.gray('--- Chat History ---'));
      
      sortedMessages.forEach(message => {
        const isOwn = message.fromUser === this.api.currentUserId;
        this.displayMessage(message, isOwn);
        this.displayedMessageIds.add(message.id);
      });
      
      console.log(colors.gray('--- End of History ---\n'));
      
    } catch (error: any) {
      console.log(colors.red(`❌ Failed to load history: ${error.message}`));
    }
  }

  private startPolling(): void {
    this.pollingInterval = setInterval(async () => {
      if (this.isRunning) {
        await this.refreshMessages();
      }
    }, 2000); // Revisar nuevos mensajes cada 2 segundos
  }

  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  private askQuestion(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(question, resolve);
    });
  }

  private exit(): void {
    this.isRunning = false;
    this.stopPolling();
    console.log(colors.yellow('\n👋 Thanks for using Chat Simulator!'));
    this.rl.close();
    process.exit(0);
  }
}

// Función principal
async function main() {
  const simulator = new ChatSimulator();
  
  try {
    await simulator.selectUser();
  } catch (error) {
    console.log(colors.red(`❌ Unexpected error: ${error}`));
    process.exit(1);
  }
}

// Verificar si se está ejecutando directamente
if (require.main === module) {
  main();
}
