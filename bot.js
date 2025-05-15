// YouCine WhatsApp Bot - Versão Melhorada
// Este código implementa um bot de WhatsApp para o serviço YouCine com experiência aprimorada

// Dependências necessárias
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const { delay } = require('@whiskeysockets/baileys');

// Configuração do logger
const logger = pino({ 
  level: 'warn' // Reduzir verbosidade
});

// Verificar e criar diretório para recursos
const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Definir caminhos para imagens
const planoImagePath = path.join(assetsDir, '/planos.jpeg');
const logoImagePath = path.join(assetsDir, '/logo.jpeg'); // Nova imagem para boas-vindas

// Configurações gerais
const CONFIG = {
  TEMPO_ESPERA_CREDENCIAIS: 15 * 60 * 1000, // 15 minutos em vez de 30 segundos
  TEMPO_LEMBRETE: 5 * 60 * 1000, // 5 minutos
  TEMPO_INATIVIDADE: 24 * 60 * 60 * 1000, // 24 horas
  NOME_ATENDIMENTO: "YouCine",
  VERSAO_BOT: "1.0.0"
};

// Definição das mensagens padrão (com melhor formatação e mais informação)
const mensagens = {
  boasVindas: (nomeUsuario) => `Olá${nomeUsuario ? " " + nomeUsuario : ""}! 👋

Seja bem-vindo(a) ao *${CONFIG.NOME_ATENDIMENTO}* 🍿

Sou o assistente virtual que vai te ajudar a aproveitar ao máximo o melhor conteúdo de filmes e séries! 😊

SEMPRE QUE PRECISAR VOLTAR NESTA TELA, DIGITE MENU`
,

  inicial: `Escolha uma das opções abaixo para continuar:

*1* 📱 Ver Planos e Valores
*2* 🛠️ Suporte Técnico
*3* 🔄 Renovar Assinatura
*4* ❓ Ajuda / FAQ`,

  planos: `*📱 PLANOS ${CONFIG.NOME_ATENDIMENTO}*

*PLANO MENSAL*: R$ 19,99/mês
- Acesso a todo o catálogo
- 1 tela simultânea

*PLANO TRIMESTRAL*: R$ 54,99 (R$ 18,33/mês)
- Acesso a todo o catálogo
- 1 tela simultânea
- Suporte prioritário

*PLANO SEMESTRAL*: R$ 105,99 (R$ 17,65/mês)
- Acesso a todo o catálogo
- 1 tela simultânea
- Suporte prioritário

*PLANO ANUAL*: R$ 179,00 (R$ 14,99/mês)
- Acesso a todo o catálogo
- 1 tela simultânea
- Suporte prioritário

*Escolha o plano desejado digitando o número:*
*1* - Mensal
*2* - Trimestral
*3* - Semestral
*4* - Anual`,

  infoPagamento: `💸 *COMO REALIZAR O PAGAMENTO:*

1️⃣ Realize o pagamento via PIX:
   - *Chave*: 1198490-5876 (Celular)
   - *Nome*: Pedro Henrique Silva Evangelista
   - *Banco*: Nubank

2️⃣ Após realizar o pagamento, *envie o comprovante* para receber seu acesso.

⚠️ *IMPORTANTE*: Guarde o comprovante, ele serve como garantia da sua compra.`,

  comprovante: {
    recebido: `✅ *COMPROVANTE RECEBIDO!*
    
Obrigado! Seu comprovante foi recebido com sucesso.

Agora precisamos saber onde você utilizará nosso serviço para enviar as instruções corretas.`,

    processando: `🔄 *PROCESSANDO PAGAMENTO*
    
Estamos verificando seu pagamento. Isso geralmente leva apenas alguns minutos.

Assim que confirmado, enviaremos as instruções de acesso.`
  },

  escolhaDispositivo: `*ONDE VOCÊ VAI UTILIZAR O SERVIÇO?* 📱🖥️

Selecione o dispositivo principal:

*1* 📺 TV
*2* 📱 Celular
*3* 💻 Computador
*4* 🔥 Fire Stick
*5* 📽️ Projetor
*6* 📦 TV Box

*Digite o número* da opção desejada.`,

  escolhaModeloTV: `*QUAL O MODELO DA SUA TV?* 📺

Selecione o fabricante:

*1* 🔵 Samsung
*2* 🔴 LG
*3* 🟠 TCL
*4* 🟣 Roku
*5* 🟢 AIWA
*6* ⚪ Outra marca

*Digite o número* da opção desejada.`,

  escolhaCelular: `*QUAL O SISTEMA DO SEU CELULAR?* 📱

Selecione uma opção:

*1* 🍎 iPhone (iOS)
*2* 🤖 Android

*Digite o número* da opção desejada.`,

  aguardandoAcesso: `⏳ *AGUARDANDO ACESSO*

Estamos preparando seu usuário e senha personalizados.

*Tempo estimado*: 5-15 minutos

Você receberá uma notificação assim que suas credenciais estiverem prontas. Não é necessário enviar novas mensagens!`,
  
  credenciaisEnviadas: `✅ *CREDENCIAIS ENVIADAS!*

Suas credenciais de acesso foram enviadas com sucesso.

Para começar a usar:
1. Abra o aplicativo seguindo as instruções anteriores
2. Use o usuário e senha fornecidos
3. Aproveite o conteúdo!

Se precisar de ajuda para configurar, digite *2* para suporte técnico.`,

  lembreteCredenciais: `⏰ *LEMBRETE*

Ainda estamos processando suas credenciais. 
Tempo estimado restante: 5-10 minutos.

Agradecemos sua paciência! Você será notificado assim que estiverem prontas.`,

  suporte: `🛠️ *SUPORTE TÉCNICO*

Precisando de ajuda? Selecione uma opção:

*1* 🔑 Problemas com login
*2* 🖥️ Dificuldades de instalação
*3* 📺 Qualidade de imagem/som
*4* 📱 Erro no aplicativo
*5* 👨‍💻 Falar com atendente

*Digite o número* da opção desejada ou detalhe seu problema.`,

  renovacao: `🔄 *RENOVAÇÃO DE ASSINATURA*

Para renovar sua assinatura ${CONFIG.NOME_ATENDIMENTO}:

1. Informe o e-mail cadastrado
2. Escolha o plano de renovação
3. Realize o pagamento
4. Envie o comprovante

*Digite seu e-mail cadastrado* para iniciar o processo de renovação.`,

  ajuda: `❓ *AJUDA / PERGUNTAS FREQUENTES*

*1* 📲 Como instalar o aplicativo?
*2* 🔑 Esqueci minha senha
*3* 📺 Em quantos dispositivos posso usar?
*4* 💰 Política de reembolso
*5* 🔙 Voltar ao menu principal

*Digite o número* da sua dúvida ou escreva sua pergunta.`,

  inatividade: `⏰ *Notamos que você está há algum tempo sem interagir*

Ainda está aí? Caso precise de ajuda, estou à disposição!

*1* 📱 Ver Planos e Valores
*2* 🛠️ Suporte Técnico
*3* 🔄 Renovar Assinatura
*4* ❓ Ajuda / FAQ
*5* 🔚 Encerrar atendimento`,

  despedida: `👋 *ATENDIMENTO FINALIZADO*

Obrigado por conversar com o ${CONFIG.NOME_ATENDIMENTO}!

Esperamos que você tenha uma excelente experiência. Caso precise de ajuda, é só nos chamar novamente!

Até breve! 🍿✨`
};

// Instruções para cada dispositivo/modelo (com melhor formatação)
const instrucoes = {
  computador: `💻 *INSTALAÇÃO PARA COMPUTADOR*

*PASSO 1*: Baixe o aplicativo
🔗 Link: https://bit.ly/youcine-pc

*PASSO 2*: Configure o aplicativo
1. Reinicie o aplicativo antes de logar
2. Abra o IPTV Smarters Pro
3. Em "Any Name": Digite seu nome
4. Em "Username": Digite seu usuário (enviado em seguida)
5. Em "Password": Digite sua senha (enviada em seguida)
6. Em "URL/HOST": Digite http://pepita.top

*PASSO 3*: Aproveite o conteúdo!
🎬 Navegue pelas categorias para encontrar filmes e séries

${mensagens.aguardandoAcesso}`,

  fireStick: `🔥 *INSTALAÇÃO PARA FIRE STICK*

*PASSO 1*: Baixe o aplicativo Downloader
1. Acesse a loja de aplicativos
2. Busque e instale o app "Downloader"

*PASSO 2*: Instale o YouCine
1. Abra o Downloader
2. Digite o código *5380780* e clique em GO
3. Siga as instruções para instalar o YouCine

*PASSO 3*: Configure o aplicativo
🎬 Tutorial em vídeo: https://youtu.be/r-25pahPN5E

${mensagens.aguardandoAcesso}`,

  projetor: `📽️ *INSTALAÇÃO PARA PROJETOR*

*PASSO 1*: Baixe o aplicativo Downloader
1. Acesse a Google Play ou PlayStore
2. Busque e instale o app "Downloader"

*PASSO 2*: Instale o YouCine
1. Abra o Downloader
2. Digite o código *5380780* e clique em GO
3. Aguarde o download e instalação

*PASSO 3*: Configure o aplicativo
🎬 Tutorial em vídeo: https://youtu.be/r-25pahPN5E

${mensagens.aguardandoAcesso}`,

  tvBox: `📦 *INSTALAÇÃO PARA TV BOX*

*PASSO 1*: Baixe o aplicativo Downloader
1. Acesse a Google Play ou PlayStore
2. Busque e instale o app "Downloader"

*PASSO 2*: Instale o YouCine
1. Abra o Downloader
2. Digite o código *5380780* e clique em GO
3. Aguarde o download e instalação

*PASSO 3*: Configure o aplicativo
🎬 Tutorial em vídeo: https://youtu.be/r-25pahPN5E

${mensagens.aguardandoAcesso}`,

  tv: {
    samsung: `📺 *INSTALAÇÃO PARA TV SAMSUNG*

*PASSO 1*: Instale o aplicativo IPTV Smarters Pro
🎬 Tutorial em vídeo: 
https://youtu.be/pTh34dlgDac?si=pbul4C7W5jI3TWfP
https://youtu.be/WBZwBhXaJx0?si=Hhh7iU4fmIdDWEBR

*PASSO 2*: Configure o aplicativo
1. Reinicie a TV antes de logar
2. Abra o IPTV Smarters Pro
3. Em "Any Name": Digite seu nome
4. Em "Username": Digite seu usuário (enviado em seguida)
5. Em "Password": Digite sua senha (enviada em seguida)
6. Em "URL/HOST": Digite http://pepita.top

*SOLUÇÃO DE PROBLEMAS*:
Se não conseguir logar, altere a DNS da TV:
🎬 Tutorial: https://youtu.be/qlSRNVQgkIU?si=M20NuJepS5NZ-SmJ

${mensagens.aguardandoAcesso}`,

    lg: `📺 *INSTALAÇÃO PARA TV LG*

*PASSO 1*: Instale o aplicativo IPTV Smarters Pro
1. Acesse a loja de aplicativos da sua TV
2. Busque e instale "IPTV Smarters Pro"

*PASSO 2*: Configure o aplicativo
1. Abra o IPTV Smarters Pro
2. Em "Any Name": Digite seu nome
3. Em "Username": Digite seu usuário (enviado em seguida)
4. Em "Password": Digite sua senha (enviada em seguida)
5. Em "URL/HOST": Digite http://pepita.top

${mensagens.aguardandoAcesso}`,

    tcl: `📺 *INSTALAÇÃO PARA TV TCL*

*PASSO 1*: Baixe o aplicativo Downloader
1. Acesse a Google Play ou PlayStore na sua TV
2. Busque e instale o app "Downloader"

*PASSO 2*: Instale o YouCine
1. Abra o Downloader
2. Digite o código *5380780* e clique em GO
3. Aguarde o download e instalação

*PASSO 3*: Configure o aplicativo
🎬 Tutorial em vídeo: https://youtu.be/r-25pahPN5E

${mensagens.aguardandoAcesso}`,

    roku: `📺 *INSTALAÇÃO PARA TV ROKU*

*PASSO 1*: Instale o aplicativo UniTV
1. Acesse a loja de aplicativos da sua TV Roku
2. Busque e instale "UniTV"

*PASSO 2*: Configure o aplicativo
1. Abra o aplicativo UniTV
2. Clique em "Logar"
3. Digite seu usuário (enviado em seguida)
4. Digite sua senha (enviada em seguida)

${mensagens.aguardandoAcesso}`,

    aiwa: `📺 *INSTALAÇÃO PARA TV AIWA*

*PASSO 1*: Baixe o aplicativo Downloader
1. Acesse a Google Play ou PlayStore na sua TV
2. Busque e instale o app "Downloader"

*PASSO 2*: Instale o YouCine
1. Abra o Downloader
2. Digite o código *5380780* e clique em GO
3. Aguarde o download e instalação

*PASSO 3*: Configure o aplicativo
🎬 Tutorial em vídeo: https://youtu.be/r-25pahPN5E

${mensagens.aguardandoAcesso}`,

    outra: `📺 *INSTALAÇÃO PARA OUTRAS TVs*

Obrigado por informar o modelo da sua TV. Para oferecer as melhores instruções:

*Por favor, confirme o modelo exato da sua TV*
(Ex: Philips Android TV, Sony Bravia, etc.)

Nossa equipe técnica preparará instruções específicas para o seu modelo.

${mensagens.aguardandoAcesso}`
  },

  celular: {
    iphone: `📱 *INSTALAÇÃO PARA IPHONE*

*PASSO 1*: Baixe o aplicativo 
🔗 Link: https://bit.ly/youcine-iphone

*PASSO 2*: Configure o aplicativo
1. Reinicie o aplicativo antes de logar
2. Abra o aplicativo e vá em "Xtrem Codes"
3. Em "Any Name": Digite seu nome
4. Em "Username": Digite seu usuário (enviado em seguida)
5. Em "Password": Digite sua senha (enviada em seguida)
6. Em "URL/HOST": Digite http://pepita.top
7. Clique em "Add User"
8. Se aparecer outra tela, clique em "Skip"

*SUPORTE ADICIONAL*:
Se precisar de ajuda durante a instalação, digite *2* para acessar o suporte técnico.

${mensagens.aguardandoAcesso}`,

    android: `📱 *INSTALAÇÃO PARA ANDROID*

*PASSO 1*: Baixe o aplicativo YouCine
🔗 Link: https://bit.ly/baixar-youcine

*PASSO 2*: Configure o aplicativo
1. Abra o aplicativo YouCine
2. Insira seu usuário (enviado em seguida)
3. Insira sua senha (enviada em seguida)
4. Clique em "Entrar"

*SUPORTE ADICIONAL*:
Se precisar de ajuda durante a instalação, digite *2* para acessar o suporte técnico.

${mensagens.aguardandoAcesso}`
  },
  
  faq: {
    instalacao: `📲 *COMO INSTALAR O APLICATIVO*

As instruções de instalação variam conforme o dispositivo. Para instruções específicas:

1. Volte ao menu principal (digite *4* e depois *5*)
2. Selecione a opção *1* (Ver Planos e Valores)
3. Após enviar o comprovante, escolha seu dispositivo
4. Siga as instruções detalhadas

*Precisa de mais ajuda?* Digite *2* para suporte técnico.`,
    
    senha: `🔑 *ESQUECI MINHA SENHA*

Para recuperar sua senha:

1. Informe o usuário usado no cadastro
2. Aguarde a verificação da sua conta
3. Enviaremos uma nova senha para acesso

*Digite seu usuário cadastrado* para iniciarmos o processo.`,
    
    dispositivos: `📺 *QUANTIDADE DE DISPOSITIVOS*

O número de dispositivos simultâneos varia de acordo com seu plano:

• *Plano Mensal*: 1 tela simultânea
• *Plano Trimestral*: 2 telas simultâneas
• *Plano Anual*: 3 telas simultâneas

Você pode instalar em quantos dispositivos quiser, mas só poderá assistir no número permitido simultaneamente.`,
    
    reembolso: `💰 *POLÍTICA DE REEMBOLSO*

Oferecemos garantia de satisfação de 7 dias:

• Reembolso integral em até 7 dias após a compra
• É necessário informar o motivo da insatisfação
• O reembolso será realizado na mesma forma de pagamento

Para solicitar reembolso, envie:
1. Data da compra
2. Comprovante de pagamento
3. Motivo da solicitação

*Precisa solicitar reembolso?* Digite *2* para suporte técnico.`
  }
};

// Mapa para rastrear estado do usuário e sessões
const estadoUsuarios = new Map();

// Timers para lembretes e timeouts
const timersUsuarios = new Map();

// Função para recuperar o nome do usuário (quando disponível)
async function obterNomeUsuario(sock, jid) {
  try {
    // Tentar obter informações do perfil
    const userInfo = await sock.profilePictureUrl(jid, 'image');
    const contactInfo = await sock.getBusinessProfile(jid);
    
    // Verificar se temos o nome no perfil
    if (contactInfo && contactInfo.name) {
      return contactInfo.name.split(' ')[0]; // Retornar apenas o primeiro nome
    }
    
    // Alternativa: usar o nome do JID (sem o @s.whatsapp.net)
    return jid.split('@')[0];
  } catch (err) {
    console.log(`Não foi possível obter nome do usuário ${jid}`);
    return ""; // Retornar string vazia se não conseguir o nome
  }
}

// Função para configurar timers de lembrete
function configurarTimersUsuario(jid) {
  // Limpar timers existentes para este usuário
  if (timersUsuarios.has(jid)) {
    const timers = timersUsuarios.get(jid);
    clearTimeout(timers.lembrete);
    clearTimeout(timers.timeout);
    clearTimeout(timers.inatividade);
  }
  
  // Configurar novos timers
  const timers = {
    lembrete: setTimeout(async () => {
      const estadoAtual = estadoUsuarios.get(jid);
      if (estadoAtual && estadoAtual.etapa === 'enviando_acesso') {
        await enviarMensagem(sock, jid, mensagens.lembreteCredenciais);
      }
    }, CONFIG.TEMPO_LEMBRETE),
    
    timeout: setTimeout(async () => {
      const estadoAtual = estadoUsuarios.get(jid);
      if (estadoAtual && estadoAtual.etapa === 'enviando_acesso') {
        await enviarMensagem(sock, jid, mensagens.credenciaisEnviadas);
        estadoUsuarios.set(jid, { etapa: 'inicial' });
      }
    }, CONFIG.TEMPO_ESPERA_CREDENCIAIS),
    
    inatividade: setTimeout(async () => {
      await enviarMensagem(sock, jid, mensagens.inatividade);
    }, CONFIG.TEMPO_INATIVIDADE)
  };
  
  timersUsuarios.set(jid, timers);
}

// Função para registrar atividade do usuário (reseta o timer de inatividade)
function registrarAtividade(jid) {
  if (timersUsuarios.has(jid)) {
    const timers = timersUsuarios.get(jid);
    clearTimeout(timers.inatividade);
    
    timers.inatividade = setTimeout(async () => {
      await enviarMensagem(sock, jid, mensagens.inatividade);
    }, CONFIG.TEMPO_INATIVIDADE);
    
    timersUsuarios.set(jid, timers);
  }
}

// Função para enviar mensagem simples
async function enviarMensagem(sock, jid, texto) {
  try {
    await sock.sendMessage(jid, { text: texto });
    console.log(`✅ Mensagem enviada para ${jid}`);
  } catch (err) {
    console.error(`❌ Erro ao enviar mensagem para ${jid}:`, err);
  }
}

// Função para enviar mensagem com botões de resposta rápida
async function enviarMensagemBotoes(sock, jid, texto, opcoes) {
  try {
    const templateButtons = opcoes.map((opcao, index) => {
      return { index: index + 1, quickReplyButton: { displayText: opcao } };
    });
    
    await sock.sendMessage(jid, {
      text: texto,
      footer: `${CONFIG.NOME_ATENDIMENTO} - Assistente Virtual`,
      templateButtons: templateButtons
    });
    console.log(`✅ Mensagem com botões enviada para ${jid}`);
  } catch (err) {
    // Fallback para mensagem simples caso os botões não funcionem
    console.warn(`⚠️ Não foi possível enviar botões para ${jid}:`, err);
    await enviarMensagem(sock, jid, texto);
  }
}

// Função para enviar imagem com legenda
async function enviarImagem(sock, jid, imagemPath, legenda) {
  try {
    if (fs.existsSync(imagemPath)) {
      await sock.sendMessage(jid, {
        image: fs.readFileSync(imagemPath),
        caption: legenda
      });
      console.log(`✅ Imagem enviada para ${jid}`);
      return true;
    } else {
      console.warn(`⚠️ Imagem não encontrada: ${imagemPath}`);
      return false;
    }
  } catch (err) {
    console.error(`❌ Erro ao enviar imagem para ${jid}:`, err);
    return false;
  }
}

// Função para processar mensagens recebidas (versão melhorada)
async function processarMensagem(sock, msg) {
  try {
    // Verificar se é mensagem válida
    if (!msg || !msg.key || !msg.key.remoteJid) return;
    
    // Verificar se é mensagem de chat individual
    const from = msg.key.remoteJid;
    if (!from || !from.endsWith('@s.whatsapp.net')) return;
    
    // Verificar se é mensagem própria (enviada pelo bot)
    if (msg.key.fromMe) return;
    
    // Extrair texto da mensagem
    let texto = '';
    let temImagem = false;
    
    if (msg.message?.conversation) {
      texto = msg.message.conversation;
    } else if (msg.message?.extendedTextMessage?.text) {
      texto = msg.message.extendedTextMessage.text;
    } else if (msg.message?.imageMessage) {
      texto = msg.message.imageMessage.caption || '';
      temImagem = true;
    } else if (msg.message?.buttonsResponseMessage) {
      texto = msg.message.buttonsResponseMessage.selectedDisplayText;
    } else {
      // Outro tipo de mensagem (não processável)
      return;
    }
    
    // Normalizar texto
    const textoNormalizado = texto.toLowerCase().trim();
    console.log(`📩 Mensagem recebida de ${from}: ${textoNormalizado}`);
    
    // Registrar atividade do usuário
    registrarAtividade(from);
    
    // Recuperar estado atual do usuário
    const estadoAtual = estadoUsuarios.get(from) || { etapa: 'inicial' };
    
    // Se for um novo usuário, enviar mensagem de boas-vindas
    if (!estadoUsuarios.has(from)) {
      const nomeUsuario = await obterNomeUsuario(sock, from);
      await enviarMensagem(sock, from, mensagens.boasVindas(nomeUsuario));
      
      // Enviar logo se existir
      if (fs.existsSync(logoImagePath)) {
        await enviarImagem(sock, from, logoImagePath, `${CONFIG.NOME_ATENDIMENTO} - Assistente Virtual`);
        await delay(1000);
      }
      
      await enviarMensagem(sock, from, mensagens.inicial);
      estadoUsuarios.set(from, { etapa: 'inicial' });
      configurarTimersUsuario(from);
      return;
    }
    
    // Comandos globais (funcionam em qualquer etapa)
    if (textoNormalizado === 'menu' || textoNormalizado === 'voltar' || textoNormalizado === 'início' || textoNormalizado === 'inicio') {
      await enviarMensagem(sock, from, mensagens.inicial);
      estadoUsuarios.set(from, { etapa: 'inicial' });
      return;
    }
    
    if (textoNormalizado === 'ajuda' || textoNormalizado === 'help') {
      await enviarMensagem(sock, from, mensagens.ajuda);
      estadoUsuarios.set(from, { etapa: 'ajuda' });
      return;
    }
    
    // Lógica de processamento por estado
    console.log(`Estado atual de ${from}: ${estadoAtual.etapa}`);
    
    switch (estadoAtual.etapa) {
      case 'inicial':
        // Menu inicial
        if (textoNormalizado === '1' || textoNormalizado.includes('plano') || textoNormalizado.includes('valor')) {
          // Enviar informações sobre planos
          const imagemEnviada = await enviarImagem(sock, from, planoImagePath, '💸 Planos YouCine');
          
          // Se a imagem não existe ou falhou, apenas enviar texto
          if (!imagemEnviada) {
            await delay(500);
            await enviarMensagem(sock, from, mensagens.planos);
          }
          
          await delay(1000);
          await enviarMensagem(sock, from, mensagens.infoPagamento);
          estadoUsuarios.set(from, { etapa: 'aguardando_comprovante' });
        } else if (textoNormalizado === '2' || textoNormalizado.includes('suporte')) {
          // Suporte técnico
          await enviarMensagem(sock, from, mensagens.suporte);
          estadoUsuarios.set(from, { etapa: 'suporte' });
        } 
        else if (textoNormalizado === '3' || textoNormalizado.includes('renov')) {
          // Renovação de assinatura
          await enviarMensagem(sock, from, mensagens.renovacao);
          estadoUsuarios.set(from, { etapa: 'renovacao_email' });
        } 
        else if (textoNormalizado === '4' || textoNormalizado.includes('ajuda') || textoNormalizado.includes('faq')) {
          // Menu de ajuda
          await enviarMensagem(sock, from, mensagens.ajuda);
          estadoUsuarios.set(from, { etapa: 'ajuda' });
        }
        else if (textoNormalizado === '5' || textoNormalizado.includes('encerr')) {
          // Encerrar atendimento
          await enviarMensagem(sock, from, mensagens.despedida);
          estadoUsuarios.delete(from);
          
          // Limpar timers
          if (timersUsuarios.has(from)) {
            const timers = timersUsuarios.get(from);
            clearTimeout(timers.lembrete);
            clearTimeout(timers.timeout);
            clearTimeout(timers.inatividade);
            timersUsuarios.delete(from);
          }
        }
        else {
          // Mensagem não reconhecida, enviar menu novamente
          await enviarMensagem(sock, from, "Desculpe, não entendi sua solicitação. Por favor, escolha uma das opções abaixo:");
          await enviarMensagem(sock, from, mensagens.inicial);
        }
        break;
        
      case 'aguardando_comprovante':
        // Recebimento de comprovante ou seleção de plano
        if (textoNormalizado === '1' || textoNormalizado.includes('mensal')) {
          await enviarMensagem(sock, from, "✅ *PLANO MENSAL SELECIONADO*\n\nValor: R$ 35,00\nAcesso: 1 tela simultânea\n\n" + mensagens.infoPagamento);
          estadoUsuarios.set(from, { etapa: 'aguardando_comprovante', plano: 'mensal' });
        }
        else if (textoNormalizado === '2' || textoNormalizado.includes('trimestral')) {
          await enviarMensagem(sock, from, "✅ *PLANO TRIMESTRAL SELECIONADO*\n\nValor: R$ 90,00\nAcesso: 2 telas simultâneas\nEconomia: 15%\n\n" + mensagens.infoPagamento);
          estadoUsuarios.set(from, { etapa: 'aguardando_comprovante', plano: 'trimestral' });
        }
        else if (textoNormalizado === '3' || textoNormalizado.includes('anual')) {
          await enviarMensagem(sock, from, "✅ *PLANO ANUAL SELECIONADO*\n\nValor: R$ 300,00\nAcesso: 3 telas simultâneas\nEconomia: 28%\n\n" + mensagens.infoPagamento);
          estadoUsuarios.set(from, { etapa: 'aguardando_comprovante', plano: 'anual' });
        }
        else if (temImagem || textoNormalizado.includes('comprovante') || textoNormalizado.includes('paguei')) {
          // Recebeu comprovante de pagamento
          await enviarMensagem(sock, from, mensagens.comprovante.recebido);
          await delay(1000);
          await enviarMensagem(sock, from, mensagens.escolhaDispositivo);
          estadoUsuarios.set(from, { 
            ...estadoAtual,
            etapa: 'escolha_dispositivo',
            comprovante_recebido: true
          });
        }
        else {
          await enviarMensagem(sock, from, "Por favor, envie o comprovante de pagamento para prosseguir ou escolha um plano digitando o número correspondente (1, 2 ou 3).");
        }
        break;
        
      case 'escolha_dispositivo':
        // Escolha do dispositivo
        if (textoNormalizado === '1' || textoNormalizado.includes('tv')) {
          await enviarMensagem(sock, from, mensagens.escolhaModeloTV);
          estadoUsuarios.set(from, { ...estadoAtual, etapa: 'escolha_modelo_tv', dispositivo: 'tv' });
        }
        else if (textoNormalizado === '2' || textoNormalizado.includes('celular')) {
          await enviarMensagem(sock, from, mensagens.escolhaCelular);
          estadoUsuarios.set(from, { ...estadoAtual, etapa: 'escolha_celular', dispositivo: 'celular' });
        }
        else if (textoNormalizado === '3' || textoNormalizado.includes('computador') || textoNormalizado.includes('pc')) {
          await enviarMensagem(sock, from, instrucoes.computador);
          estadoUsuarios.set(from, { ...estadoAtual, etapa: 'enviando_acesso', dispositivo: 'computador' });
          configurarTimersUsuario(from);
        }
        else if (textoNormalizado === '4' || textoNormalizado.includes('fire')) {
          await enviarMensagem(sock, from, instrucoes.fireStick);
          estadoUsuarios.set(from, { ...estadoAtual, etapa: 'enviando_acesso', dispositivo: 'firestick' });
          configurarTimersUsuario(from);
        }
        else if (textoNormalizado === '5' || textoNormalizado.includes('projetor')) {
          await enviarMensagem(sock, from, instrucoes.projetor);
          estadoUsuarios.set(from, { ...estadoAtual, etapa: 'enviando_acesso', dispositivo: 'projetor' });
          configurarTimersUsuario(from);
        }
        else if (textoNormalizado === '6' || textoNormalizado.includes('box')) {
          await enviarMensagem(sock, from, instrucoes.tvBox);
          estadoUsuarios.set(from, { ...estadoAtual, etapa: 'enviando_acesso', dispositivo: 'tvbox' });
          configurarTimersUsuario(from);
        }
        else {
          await enviarMensagem(sock, from, "Por favor, escolha uma opção válida (1-6) para continuar:");
          await enviarMensagem(sock, from, mensagens.escolhaDispositivo);
        }
        break;
        
      case 'escolha_modelo_tv':
        // Escolha do modelo da TV
        if (textoNormalizado === '1' || textoNormalizado.includes('samsung')) {
          await enviarMensagem(sock, from, instrucoes.tv.samsung);
          estadoUsuarios.set(from, { ...estadoAtual, etapa: 'enviando_acesso', modelo_tv: 'samsung' });
          configurarTimersUsuario(from);
        }
        else if (textoNormalizado === '2' || textoNormalizado.includes('lg')) {
          await enviarMensagem(sock, from, instrucoes.tv.lg);
          estadoUsuarios.set(from, { ...estadoAtual, etapa: 'enviando_acesso', modelo_tv: 'lg' });
          configurarTimersUsuario(from);
        }
        else if (textoNormalizado === '3' || textoNormalizado.includes('tcl')) {
          await enviarMensagem(sock, from, instrucoes.tv.tcl);
          estadoUsuarios.set(from, { ...estadoAtual, etapa: 'enviando_acesso', modelo_tv: 'tcl' });
          configurarTimersUsuario(from);
        }
        else if (textoNormalizado === '4' || textoNormalizado.includes('roku')) {
          await enviarMensagem(sock, from, instrucoes.tv.roku);
          estadoUsuarios.set(from, { ...estadoAtual, etapa: 'enviando_acesso', modelo_tv: 'roku' });
          configurarTimersUsuario(from);
        }
        else if (textoNormalizado === '5' || textoNormalizado.includes('aiwa')) {
          await enviarMensagem(sock, from, instrucoes.tv.aiwa);
          estadoUsuarios.set(from, { ...estadoAtual, etapa: 'enviando_acesso', modelo_tv: 'aiwa' });
          configurarTimersUsuario(from);
        }
        else if (textoNormalizado === '6' || textoNormalizado.includes('outra')) {
          await enviarMensagem(sock, from, instrucoes.tv.outra);
          estadoUsuarios.set(from, { ...estadoAtual, etapa: 'modelo_tv_outro' });
        }
        else {
          await enviarMensagem(sock, from, "Por favor, escolha uma opção válida (1-6) para continuar:");
          await enviarMensagem(sock, from, mensagens.escolhaModeloTV);
        }
        break;
        
      case 'modelo_tv_outro':
        // TV de outro modelo
        await enviarMensagem(sock, from, `Obrigado! Anotamos que sua TV é do modelo: ${texto}\n\n${mensagens.aguardandoAcesso}`);
        estadoUsuarios.set(from, { ...estadoAtual, etapa: 'enviando_acesso', modelo_tv_outro: texto });
        configurarTimersUsuario(from);
        break;
        
      case 'escolha_celular':
        // Escolha do tipo de celular
        if (textoNormalizado === '1' || textoNormalizado.includes('iphone') || textoNormalizado.includes('ios')) {
          await enviarMensagem(sock, from, instrucoes.celular.iphone);
          estadoUsuarios.set(from, { ...estadoAtual, etapa: 'enviando_acesso', celular: 'iphone' });
          configurarTimersUsuario(from);
        }
        else if (textoNormalizado === '2' || textoNormalizado.includes('android')) {
          await enviarMensagem(sock, from, instrucoes.celular.android);
          estadoUsuarios.set(from, { ...estadoAtual, etapa: 'enviando_acesso', celular: 'android' });
          configurarTimersUsuario(from);
        }
        else {
          await enviarMensagem(sock, from, "Por favor, escolha uma opção válida (1-2) para continuar:");
          await enviarMensagem(sock, from, mensagens.escolhaCelular);
        }
        break;
        
      case 'enviando_acesso':
        // Usuário está aguardando credenciais
        if (textoNormalizado.includes('já receb') || textoNormalizado.includes('ja receb') || textoNormalizado.includes('chegou')) {
          await enviarMensagem(sock, from, "Suas credenciais ainda estão sendo processadas. Por favor, aguarde mais alguns minutos.");
        } else {
          await enviarMensagem(sock, from, "Estamos preparando suas credenciais. Assim que estiverem prontas, você receberá automaticamente. Obrigado pela paciência!");
        }
        break;
        
      case 'suporte':
        // Menu de suporte
        if (textoNormalizado === '1' || textoNormalizado.includes('login') || textoNormalizado.includes('senha')) {
          await enviarMensagem(sock, from, "🔑 *PROBLEMAS COM LOGIN*\n\nPor favor, nos informe:\n\n1. Qual dispositivo você está tentando usar?\n2. Qual erro aparece na tela?\n3. Qual o seu usuário de acesso?\n\nUm técnico analisará seu caso em breve.");
          estadoUsuarios.set(from, { ...estadoAtual, etapa: 'suporte_login' });
        }
        else if (textoNormalizado === '2' || textoNormalizado.includes('instala')) {
          await enviarMensagem(sock, from, "🖥️ *DIFICULDADES DE INSTALAÇÃO*\n\nPor favor, nos informe:\n\n1. Qual dispositivo você está tentando instalar?\n2. Em qual etapa do processo você está tendo dificuldade?\n3. Aparece alguma mensagem de erro?\n\nUm técnico analisará seu caso em breve.");
          estadoUsuarios.set(from, { ...estadoAtual, etapa: 'suporte_instalacao' });
        }
        else if (textoNormalizado === '3' || textoNormalizado.includes('qualidade') || textoNormalizado.includes('imagem') || textoNormalizado.includes('som')) {
          await enviarMensagem(sock, from, "📺 *QUALIDADE DE IMAGEM/SOM*\n\nPor favor, nos informe:\n\n1. Qual dispositivo você está usando?\n2. O problema é na imagem, no som ou em ambos?\n3. O problema ocorre em todos os conteúdos ou apenas em alguns específicos?\n\nUm técnico analisará seu caso em breve.");
          estadoUsuarios.set(from, { ...estadoAtual, etapa: 'suporte_qualidade' });
        }
        else if (textoNormalizado === '4' || textoNormalizado.includes('erro') || textoNormalizado.includes('app')) {
          await enviarMensagem(sock, from, "📱 *ERRO NO APLICATIVO*\n\nPor favor, nos informe:\n\n1. Qual dispositivo você está usando?\n2. Qual mensagem de erro aparece?\n3. Em qual momento o erro ocorre?\n\nSe possível, envie uma captura de tela do erro para melhor análise.");
          estadoUsuarios.set(from, { ...estadoAtual, etapa: 'suporte_erro' });
        }
        else if (textoNormalizado === '5' || textoNormalizado.includes('atendente') || textoNormalizado.includes('humano')) {
          await enviarMensagem(sock, from, "👨‍💻 *ATENDIMENTO HUMANO*\n\nSua solicitação foi registrada. Um de nossos atendentes entrará em contato com você em breve.\n\nHorário de atendimento: Segunda a sexta, das 9h às 18h.\n\nAgradecemos sua paciência!");
          estadoUsuarios.set(from, { ...estadoAtual, etapa: 'aguardando_atendente' });
        }
        else if (textoNormalizado === '0' || textoNormalizado.includes('voltar')) {
          await enviarMensagem(sock, from, mensagens.inicial);
          estadoUsuarios.set(from, { etapa: 'inicial' });
        }
        else {
          // Tratar como descrição de problema
          await enviarMensagem(sock, from, "✅ *PROBLEMA REGISTRADO*\n\nSua solicitação foi registrada com sucesso. Um técnico analisará seu caso e retornará em breve.\n\nDeseja reportar mais algum detalhe sobre o problema?");
          estadoUsuarios.set(from, { ...estadoAtual, etapa: 'suporte_detalhe', problema: texto });
        }
        break;
        
      case 'suporte_login':
      case 'suporte_instalacao':
      case 'suporte_qualidade':
      case 'suporte_erro':
      case 'suporte_detalhe':
        // Registrar detalhes do problema
        await enviarMensagem(sock, from, "✅ *INFORMAÇÕES REGISTRADAS*\n\nObrigado pelos detalhes adicionais. Sua solicitação foi encaminhada para nossa equipe técnica.\n\nUm especialista entrará em contato em breve para resolver seu problema.\n\nDeseja retornar ao menu principal? Digite *menu*");
        estadoUsuarios.set(from, { ...estadoAtual, etapa: 'aguardando_atendente', detalhes: texto });
        break;
        
      case 'aguardando_atendente':
        // Usuário aguardando atendente
        await enviarMensagem(sock, from, "Sua solicitação já está na fila de atendimento. Um atendente entrará em contato o mais breve possível.\n\nDeseja retornar ao menu principal? Digite *menu*");
        break;
        
      case 'renovacao_email':
        // Recebendo email para renovação
        if (textoNormalizado.includes('@')) {
          await enviarMensagem(sock, from, `✅ *EMAIL CONFIRMADO*\n\nEmail: ${texto}\n\nAgora, escolha o plano para renovação:\n\n*1* - Mensal (R$ 35,00)\n*2* - Trimestral (R$ 90,00)\n*3* - Anual (R$ 300,00)`);
          estadoUsuarios.set(from, { ...estadoAtual, etapa: 'renovacao_plano', email: texto });
        } else {
          await enviarMensagem(sock, from, "⚠️ O email informado parece inválido. Por favor, digite um email válido para prosseguir com a renovação.");
        }
        break;
        
      case 'renovacao_plano':
        // Escolha do plano para renovação
        if (textoNormalizado === '1' || textoNormalizado.includes('mensal')) {
          await enviarMensagem(sock, from, "✅ *PLANO MENSAL SELECIONADO*\n\nValor: R$ 35,00\nAcesso: 1 tela simultânea\n\n" + mensagens.infoPagamento);
          estadoUsuarios.set(from, { ...estadoAtual, etapa: 'renovacao_pagamento', plano: 'mensal' });
        }
        else if (textoNormalizado === '2' || textoNormalizado.includes('trimestral')) {
          await enviarMensagem(sock, from, "✅ *PLANO TRIMESTRAL SELECIONADO*\n\nValor: R$ 90,00\nAcesso: 2 telas simultâneas\nEconomia: 15%\n\n" + mensagens.infoPagamento);
          estadoUsuarios.set(from, { ...estadoAtual, etapa: 'renovacao_pagamento', plano: 'trimestral' });
        }
        else if (textoNormalizado === '3' || textoNormalizado.includes('anual')) {
          await enviarMensagem(sock, from, "✅ *PLANO ANUAL SELECIONADO*\n\nValor: R$ 300,00\nAcesso: 3 telas simultâneas\nEconomia: 28%\n\n" + mensagens.infoPagamento);
          estadoUsuarios.set(from, { ...estadoAtual, etapa: 'renovacao_pagamento', plano: 'anual' });
        }
        else {
          await enviarMensagem(sock, from, "Por favor, escolha uma opção válida (1-3) para continuar:");
          await enviarMensagem(sock, from, "Escolha o plano para renovação:\n\n*1* - Mensal (R$ 35,00)\n*2* - Trimestral (R$ 90,00)\n*3* - Anual (R$ 300,00)");
        }
        break;
        
      case 'renovacao_pagamento':
        // Recebimento do comprovante de renovação
        if (temImagem || textoNormalizado.includes('comprovante') || textoNormalizado.includes('paguei')) {
          await enviarMensagem(sock, from, mensagens.comprovante.recebido);
          await delay(1000);
          await enviarMensagem(sock, from, mensagens.comprovante.processando);
          await delay(2000);
          await enviarMensagem(sock, from, "✅ *RENOVAÇÃO CONFIRMADA*\n\nSua assinatura foi renovada com sucesso!\n\nDetalhes:\n- Email: " + estadoAtual.email + "\n- Plano: " + estadoAtual.plano + "\n\nSua assinatura já está ativa. Aproveite o serviço!");
          estadoUsuarios.set(from, { etapa: 'inicial' });
        } else {
          await enviarMensagem(sock, from, "Por favor, envie o comprovante de pagamento para concluir sua renovação.");
        }
        break;
        
      case 'ajuda':
        // Menu de FAQ/Ajuda
        if (textoNormalizado === '1' || textoNormalizado.includes('instalar')) {
          await enviarMensagem(sock, from, instrucoes.faq.instalacao);
        }
        else if (textoNormalizado === '2' || textoNormalizado.includes('esqueci')) {
          await enviarMensagem(sock, from, instrucoes.faq.senha);
          estadoUsuarios.set(from, { ...estadoAtual, etapa: 'ajuda_senha' });
        }
        else if (textoNormalizado === '3' || textoNormalizado.includes('quantos') || textoNormalizado.includes('dispositivos')) {
          await enviarMensagem(sock, from, instrucoes.faq.dispositivos);
        }
        else if (textoNormalizado === '4' || textoNormalizado.includes('reembolso')) {
          await enviarMensagem(sock, from, instrucoes.faq.reembolso);
        }
        else if (textoNormalizado === '5' || textoNormalizado.includes('voltar')) {
          await enviarMensagem(sock, from, mensagens.inicial);
          estadoUsuarios.set(from, { etapa: 'inicial' });
        }
        else {
          // Tentar interpretar a pergunta
          if (textoNormalizado.includes('instala') || textoNormalizado.includes('baixar')) {
            await enviarMensagem(sock, from, instrucoes.faq.instalacao);
          }
          else if (textoNormalizado.includes('senha') || textoNormalizado.includes('esqueci') || textoNormalizado.includes('login')) {
            await enviarMensagem(sock, from, instrucoes.faq.senha);
            estadoUsuarios.set(from, { ...estadoAtual, etapa: 'ajuda_senha' });
          }
          else if (textoNormalizado.includes('dispositivo') || textoNormalizado.includes('tela') || textoNormalizado.includes('simultane')) {
            await enviarMensagem(sock, from, instrucoes.faq.dispositivos);
          }
          else if (textoNormalizado.includes('reembolso') || textoNormalizado.includes('devolu') || textoNormalizado.includes('dinheiro')) {
            await enviarMensagem(sock, from, instrucoes.faq.reembolso);
          }
          else {
            await enviarMensagem(sock, from, "Não consegui identificar sua dúvida. Por favor, escolha uma das opções numéricas ou tente formular sua pergunta de outra forma.");
            await enviarMensagem(sock, from, mensagens.ajuda);
          }
        }
        break;
        
      case 'ajuda_senha':
        // Recebendo email para recuperação de senha
        if (textoNormalizado.includes('@')) {
          await enviarMensagem(sock, from, `✅ *SOLICITAÇÃO REGISTRADA*\n\nRecebemos sua solicitação de recuperação de senha para o email: ${texto}\n\nEm breve, enviaremos suas novas credenciais. Verifique também sua caixa de spam.\n\nDeseja retornar ao menu principal? Digite *menu*`);
          estadoUsuarios.set(from, { etapa: 'inicial' });
        } else {
          await enviarMensagem(sock, from, "⚠️ O email informado parece inválido. Por favor, digite um email válido para recuperar sua senha.");
        }
        break;
        
      default:
        // Estado desconhecido, resetar para o menu inicial
        await enviarMensagem(sock, from, "Desculpe, ocorreu um erro no atendimento. Vamos recomeçar.");
        await enviarMensagem(sock, from, mensagens.inicial);
        estadoUsuarios.set(from, { etapa: 'inicial' });
    }
  } catch (error) {
    console.error("❌ Erro ao processar mensagem:", error);
    try {
      await enviarMensagem(sock, from, "Desculpe, ocorreu um erro no sistema. Por favor, tente novamente mais tarde ou entre em contato pelo nosso email de suporte.");
    } catch (e) {
      console.error("❌ Erro ao enviar mensagem de erro:", e);
    }
  }
}

// Função principal
async function iniciar() {
  // Garantir que as pastas de sessão existam
  const authFolder = './auth_info_baileys';
  if (!fs.existsSync(authFolder)) {
    fs.mkdirSync(authFolder, { recursive: true });
  }
  
  // Carregar estado de autenticação
  const { state, saveCreds } = await useMultiFileAuthState(authFolder);
  
  // Criar socket de conexão
  const sock = makeWASocket({
    logger,
    printQRInTerminal: true,
    auth: state,
    browser: ['YouCine Bot', 'Chrome', '10.0'],
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 60000,
    messageSendRetryCountMax: 3
  });
  
  // Listener para atualizações de credenciais
  sock.ev.on('creds.update', saveCreds);
  
  // Listener para conexão
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut);
      console.log('❌ Conexão fechada devido a:', lastDisconnect?.error, 'Reconectando:', shouldReconnect);
      
      if (shouldReconnect) {
        setTimeout(iniciar, 5000);
      } else {
        console.log('🚫 Desconectado permanentemente, não tentando reconectar.');
      }
    } else if (connection === 'open') {
      console.log('✅ Conexão aberta! Bot YouCine pronto para uso.');
      
      // Verificar e enviar relatório diário
      const dataAtual = new Date().toLocaleDateString('pt-BR');
      console.log(`📊 Bot iniciado em ${dataAtual}`);
      
      // Estatísticas
      console.log(`📊 Usuários ativos: ${estadoUsuarios.size}`);
    }
    
    // Se o QR code mudar, exibir o novo QR
    if (qr) {
      console.log('🔄 Novo QR Code recebido:', qr);
    }
  });
  
  // Listener para mensagens
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type === 'notify') {
      for (const msg of messages) {
        if (!msg.key.fromMe) {
          await processarMensagem(sock, msg);
        }
      }
    }
  });
}

// Iniciar o bot
console.log(`🚀 Iniciando Bot ${CONFIG.NOME_ATENDIMENTO} v${CONFIG.VERSAO_BOT}...`);
iniciar().catch(err => console.error('❌ Erro fatal:', err));

// Manipulação de interrupções do processo
process.on('SIGINT', () => {
  console.log('👋 Bot encerrado pelo usuário.');
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Erro não tratado:', err);
});