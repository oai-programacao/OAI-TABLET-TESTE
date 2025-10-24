export class DevToolsLogger {
  private static container: HTMLDivElement;
  private static toggleButton: HTMLButtonElement;

  static init() {
    if (!this.container) {
      // 1️⃣ Cria container de logs (inicialmente escondido)
      this.container = document.createElement('div');
      Object.assign(this.container.style, {
        position: 'fixed',
        bottom: '50px',
        right: '20px',
        width: '90%',
        maxWidth: '800px',
        height: '80%',
        background: 'rgba(0,0,0,0.85)',
        color: 'white',
        fontSize: '12px',
        fontFamily: 'monospace',
        overflowY: 'auto',
        padding: '6px',
        zIndex: '9999',
        borderRadius: '8px',
        display: 'none', // inicialmente escondido
        boxShadow: '0 0 10px rgba(0,0,0,0.6)',
      });
      document.body.appendChild(this.container);

      // 2️⃣ Cria botão de engrenagem
      this.toggleButton = document.createElement('button');
      this.toggleButton.innerHTML = '⚙️'; // emoji de engrenagem, pode usar ícone SVG
      Object.assign(this.toggleButton.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        border: 'none',
        background: '#333',
        color: 'white',
        fontSize: '24px',
        cursor: 'pointer',
        zIndex: '10000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 0 8px rgba(0,0,0,0.5)',
        transition: 'transform 0.3s ease',
      });

      document.body.appendChild(this.toggleButton);

      // 3️⃣ Gira a engrenagem constantemente
      this.toggleButton.animate(
        [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }],
        {
          duration: 2000,
          iterations: Infinity,
        }
      );

      // 4️⃣ Clique abre/fecha modal
      this.toggleButton.addEventListener('click', () => {
        this.container.style.display =
          this.container.style.display === 'none' ? 'block' : 'none';
      });
    }

    // Intercepta console.log / warn / error
    (['log', 'warn', 'error'] as const).forEach(
      (method: 'log' | 'warn' | 'error') => {
        const original = console[method].bind(console);
        console[method] = (...args: any[]) => {
          original(...args);
          DevToolsLogger.addLog(method.toUpperCase(), args);
        };
      }
    );

    // Captura erros globais
    window.onerror = (message, source, lineno, colno, error) => {
      this.addLog('ERROR', [`${message} em ${source}:${lineno}:${colno}`]);
      return false;
    };
  }

  private static addLog(type: string, messages: any[]) {
    if (!this.container) return;

    const log = document.createElement('div');
    log.style.marginBottom = '2px';
    log.style.whiteSpace = 'pre-wrap';

    const color =
      type === 'ERROR' || type.includes('❌')
        ? 'red'
        : type === 'WARN'
        ? 'yellow'
        : 'lightgreen';

    log.innerText = `[${type}] ${messages
      .map((m) => {
        if (typeof m === 'object') {
          try {
            return JSON.stringify(m, null, 2);
          } catch {
            return '[Object]';
          }
        }
        return m;
      })
      .join(' ')}`;

    log.style.color = color;
    this.container.appendChild(log);
    this.container.scrollTop = this.container.scrollHeight;
  }

  static addCustomLog(message: string | string[], type: string = 'CUSTOM') {
    const messages = Array.isArray(message) ? message : [message];
    this.addLog(type, messages);
  }
}
