const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const P = require("pino");

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");

  const sock = makeWASocket({
    auth: state,
    logger: P({ level: "silent" }),
    printQRInTerminal: false
  });

  sock.ev.on("creds.update", saveCreds);

  // شماره واتساپ (بدون +)
  const phoneNumber = "93745872028";

  if (!sock.authState.creds.registered) {
    try {
      const code = await sock.requestPairingCode(phoneNumber);
      console.log("\n==============================");
      console.log("PAIRING CODE:");
      console.log(code);
      console.log("==============================\n");
    } catch (err) {
      console.log(err);
    }
  }

  sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "open") {
      console.log("✅ WhatsApp Connected");
    }

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut;

      if (shouldReconnect) {
        startBot();
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];

    if (!msg.message || msg.key.fromMe) return;

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";

    if (text.toLowerCase() === "سلام") {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "سلام 🌹 خوش آمدید."
      });
    }
  });
}

startBot();
