# ERROR_SOLUTIONS.md

Este arquivo documenta erros comuns encontrados durante o desenvolvimento e suas soluções correspondentes.

## Playwright Screenshot Errors

### Erro: Playwright browsers não instalados
**Erro:**
```
browserType.launch: Executable doesn't exist at C:\Users\...\ms-playwright\chromium_headless_shell-1181\chrome-win\headless_shell.exe
Looks like Playwright Test or Playwright was just installed or updated.
Please run the following command to download new browsers:
    npx playwright install
```

**Solução:**
```bash
npx playwright install chromium
```

### Erro: Servidor não está rodando
**Erro:**
```
page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
```

**Diagnóstico:**
1. Verificar se o servidor está rodando:
   ```bash
   curl -I http://localhost:3000
   ```
2. Verificar processos na porta 3000:
   ```bash
   netstat -an | findstr :3000
   # ou no PowerShell:
   powershell "Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue"
   ```

**Solução:**
1. Iniciar o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
2. Para screenshot com retry logic, implementar função de verificação:
   ```javascript
   const checkServer = async (retries = 30) => {
     for (let i = 0; i < retries; i++) {
       try {
         await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 5000 });
         return true;
       } catch (error) {
         if (i < retries - 1) {
           await page.waitForTimeout(2000);
         }
       }
     }
     return false;
   };
   ```

## Windows Command Line Issues

### Erro: Comando 'timeout' não encontrado
**Erro:**
```
Try 'timeout --help' for more information.
```

**Solução:** 
Usar PowerShell para delays:
```bash
powershell "Start-Sleep -Seconds 10; node script.js"
```

### Erro: Comando 'del' não funciona no bash
**Erro:**
```
/usr/bin/bash: line 1: del: command not found
```

**Solução:**
Usar `rm` ao invés de `del`:
```bash
rm arquivo.js
```

## Desenvolvimento Next.js

### Servidor não inicia automaticamente
**Problema:** Server precisa ser iniciado manualmente

**Solução:**
1. Verificar se não há conflitos de porta
2. Iniciar em background:
   ```bash
   npm run dev &
   ```
3. Para Windows, usar `start`:
   ```bash
   cmd /c "start npm run dev"
   ```

---

## Como Atualizar Este Arquivo

Sempre que encontrar um novo erro:

1. Adicione uma nova seção com o tipo de erro
2. Documente o erro exato (com stack trace se relevante)
3. Descreva os passos de diagnóstico
4. Forneça a solução completa com comandos
5. Inclua exemplos de código quando aplicável

**Formato para novos erros:**
```markdown
### Erro: [Descrição breve]
**Erro:**
```
[Stack trace ou mensagem de erro]
```

**Diagnóstico:**
1. [Passo de diagnóstico]
2. [Outro passo]

**Solução:**
[Solução detalhada com comandos]
```