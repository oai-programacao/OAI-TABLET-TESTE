export class DevToolsLogger {
  private static container: HTMLDivElement;

  static init() {
    // Cria o container se ainda não existir
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.style.position = 'fixed';
      this.container.style.bottom = '0';
      this.container.style.right = '0';
      this.container.style.width = '300px';
      this.container.style.height = '200px';
      this.container.style.background = 'rgba(0,0,0,0.8)';
      this.container.style.color = 'white';
      this.container.style.fontSize = '12px';
      this.container.style.fontFamily = 'monospace';
      this.container.style.overflowY = 'auto';
      this.container.style.padding = '4px';
      this.container.style.zIndex = '9999';
      this.container.style.borderTopLeftRadius = '8px';
      this.container.style.cursor = 'pointer';
      document.body.appendChild(this.container);

      // Permitir clicar para expandir/retrair
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
    log.innerText = `[${type}] ${messages
      .map((m) => {
        if (typeof m === 'object') return JSON.stringify(m);
        return m;
      })
      .join(' ')}`;
    this.container.appendChild(log);

    // Scroll automático para o último log
    this.container.scrollTop = this.container.scrollHeight;
  }
}
