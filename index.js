const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const P = require("pino");

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth_info");

  const sock = makeWASocket({
    auth: state,
    logger: P({ level: "silent" }),
    printQRInTerminal: false,
    browser: ["Render Bot", "Chrome", "1.0.0"]
  });

  sock.ev.on("creds.update", saveCreds);

  const phoneNumber = "93745872028";
  let pairingRequested = false;

  sock.ev.on("connection.update", async ({ connection, lastDisconnect }) => {

    if (connection === "connecting") {
      console.log("Connecting...");
    }

    if (
      !state.creds.registered &&
      !pairingRequested
    ) {
      pairingRequested = true;

      try {
        const code = await sock.requestPairingCode(phoneNumber);

        console.log("");
        console.log("================================");
        console.log("PAIRING CODE:");
        console.log(code);
        console.log("================================");
        console.log("");

      } catch (err) {
        console.error(err);
      }
    }

    if (connection === "open") {
      console.log("✅ WhatsApp Connected");
    }

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut;

      console.log("Connection closed");

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

    if (text === "سلام") {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "سلام 🌹 خوش آمدید."
      });
    }
  });
}

startBot();
