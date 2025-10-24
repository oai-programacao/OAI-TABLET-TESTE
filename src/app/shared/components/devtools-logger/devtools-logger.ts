export class DevToolsLogger {
  private static container: HTMLDivElement;

  static init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.style.position = 'fixed';
      this.container.style.bottom = '0';
      this.container.style.right = '0';
      this.container.style.width = '300px';
      this.container.style.height = '200px';
      this.container.style.background = 'rgba(0,0,0,0.85)';
      this.container.style.color = 'white';
      this.container.style.fontSize = '12px';
      this.container.style.fontFamily = 'monospace';
      this.container.style.overflowY = 'auto';
      this.container.style.padding = '6px';
      this.container.style.zIndex = '9999';
      this.container.style.borderTopLeftRadius = '8px';
      this.container.style.cursor = 'pointer';
      this.container.style.boxShadow = '0 0 10px rgba(0,0,0,0.6)';
      document.body.appendChild(this.container);

      // Clique para expandir/retrair
      this.container.addEventListener('click', () => {
        if (this.container.style.height === '200px') {
          this.container.style.height = '80%';
          this.container.style.width = '90%';
        } else {
          this.container.style.height = '200px';
          this.container.style.width = '300px';
        }
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

    // Auto scroll
    this.container.scrollTop = this.container.scrollHeight;
  }

  // ✅ Método público usado pelo interceptor e outros pontos da app
  static addCustomLog(message: string | string[], type: string = 'CUSTOM') {
    const messages = Array.isArray(message) ? message : [message];
    this.addLog(type, messages);
  }
}
