# YouCine WhatsApp Bot

![YouCine Logo](assets/logo.jpeg)

O YouCine WhatsApp Bot é um assistente virtual automatizado para o serviço de streaming YouCine, projetado para fornecer suporte técnico, informações sobre planos, processamento de pagamentos e orientações de instalação diretamente pelo WhatsApp.

## 📌 Recursos Principais

- **Atendimento Automatizado 24/7**
- **Processamento de Comprovantes PIX**
- **Instruções de Instalação por Dispositivo**
  - TVs (Samsung, LG, TCL, Roku, AIWA e outras)
  - Celulares (Android e iOS)
  - Computadores
  - Fire Stick
  - Projetores
  - TV Box
- **Suporte Técnico Multiárea**
- **Renovação de Assinatura**
- **FAQ Interativo**

## 🛠️ Pré-requisitos

- Node.js v16 ou superior
- NPM ou Yarn
- WhatsApp Business API ou número de telefone válido
- Conta no serviço Baileys para conexão WhatsApp

## ⚙️ Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/youcine-whatsapp-bot.git
   cd youcine-whatsapp-bot
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as imagens:
   - Coloque `planos.jpeg` e `logo.jpeg` na pasta `assets/`

4. Inicie o bot:
   ```bash
   node index.js
   ```

## 🔧 Configuração

Edite as seguintes constantes no código conforme necessário:

```javascript
const CONFIG = {
  TEMPO_ESPERA_CREDENCIAIS: 15 * 60 * 1000, // 15 minutos
  TEMPO_LEMBRETE: 5 * 60 * 1000, // 5 minutos
  TEMPO_INATIVIDADE: 24 * 60 * 60 * 1000, // 24 horas
  NOME_ATENDIMENTO: "YouCine",
  VERSAO_BOT: "1.0.0"
};
```

## 📋 Fluxo do Bot

1. **Boas-vindas** → Menu principal
2. **Planos** → Seleção → Pagamento → Dispositivo → Instruções
3. **Suporte** → Área técnica → Atendimento humano
4. **Renovação** → Email → Plano → Pagamento
5. **Ajuda** → FAQ interativo

## 📂 Estrutura de Arquivos

```
youcine-whatsapp-bot/
├── assets/
│   ├── planos.jpeg
│   └── logo.jpeg
├── auth_info_baileys/
│   └── (arquivos de autenticação gerados automaticamente)
├── index.js
├── package.json
└── README.md
```

## 📜 Licença

Este projeto é licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## ✉️ Contato

Para suporte ou dúvidas, entre em contato com o desenvolvedor.

---

**Versão:** 1.0.0  
**Última atualização:** 15/05/2023
