const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const client = new Client({
  authStrategy: new LocalAuth()
});

// Genera el código QR para conectarse a whatsapp-web
client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
});

// Si la conexión es exitosa muestra el mensaje de conexión exitosa
client.on('ready', () => {
  console.log('Conexión exitosa nenes');
});

// Función para eliminar tildes de las palabras
const removeAccents = (str) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

// Diccionario de palabras clave, con respuestas aleatorias y secuencias de mensajes
const keywordResponses = [
  {
    keywords: ['hola', 'saludos', 'buenos dias', 'qué tal'],
    responses: ['¡Hola! ¿Cómo estás?', 'video1.mp4', '¡Hola! ¿En qué puedo ayudarte?'],
  },
  {
    keywords: ['adios', 'chao', 'nos vemos', 'hasta pronto'],
    responses: ['¡Hasta luego!', '¡Adiós! Espero verte pronto.', 'imagen1.jpg'],
  },
  {
    keywords: ['gracias', 'muchas gracias', 'te agradezco'],
    responses: ['De nada. Siempre estoy aquí para ayudarte.', 'video2.mp4', 'imagen2.png'],
  },
  // Agrega más palabras clave y sus respuestas aquí
  {
    keywords: ['clave', 'secuencia'],
    sequence: [
      ['Mensaje 1', 2000],
      ['video3.mp4', 1000],
      ['imagen3.jpg', 3000],
      ['Mensaje 4', 1500],
      ['imagen4.png', 2000],
      ['Mensaje 6', 1000],
    ],
  },
  {
    keywords: ['otraclave', 'otra secuencia'],
    sequence: [
      ['Respuesta 1', 3000],
      ['video4.mp4', 2000],
      ['imagen5.jpg', 2500],
    ],
  },
];

// Respuestas aleatorias para mensajes desconocidos
const unknownResponses = [
  'Lo siento, no he reconocido tu mensaje.',
  'No estoy seguro de cómo responder a eso.',
  '¿Podrías repetirlo?',
  'Mis disculpas, no comprendo lo que quieres decir.',
];

// Función para obtener una respuesta aleatoria de una lista
function getRandomResponse(responsesList) {
  const randomIndex = Math.floor(Math.random() * responsesList.length);
  return responsesList[randomIndex];
}

// Función para verificar si el mensaje incluye alguna de las palabras clave asociadas con una respuesta
function containsKeywords(message, keywords) {
  const normalizedMessage = removeAccents(message.toLowerCase());
  for (const keyword of keywords) {
    const normalizedKeyword = removeAccents(keyword.toLowerCase());
    if (normalizedMessage.includes(normalizedKeyword)) {
      return true;
    }
  }
  return false;
}

// Función para enviar una imagen o video a través de WhatsApp
async function sendMedia(chatId, filePath) {
  const fileContent = fs.readFileSync(filePath);
  const media = new MessageMedia(
    filePath.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg',
    fileContent
  );

  await client.sendMessage(chatId, media);
}

// Función para enviar una secuencia de mensajes con intervalos de tiempo
async function sendSequenceMessages(chatId, messages) {
  for (const [message, interval] of messages) {
    if (message.endsWith('.mp4') || message.endsWith('.jpg') || message.endsWith('.png')) {
      const filePath = path.join(__dirname, message);
      await sendMedia(chatId, filePath);
    } else {
      await new Promise(resolve => setTimeout(resolve, interval));
      client.sendMessage(chatId, message);
    }
  }
}

// Función para manejar los mensajes entrantes
async function handleIncomingMessage(message) {
  console.log(message.body);
  const lowercaseMessage = message.body.toLowerCase();

  // Verifica si el mensaje coincide con alguna palabra clave y envía una respuesta
  for (const response of keywordResponses) {
    if (containsKeywords(lowercaseMessage, response.keywords)) {
      if (response.responses) {
        // Es una respuesta aleatoria
        for (const item of response.responses) {
          if (item.endsWith('.mp4') || item.endsWith('.jpg') || item.endsWith('.png')) {
            const filePath = path.join(__dirname, item);
            await sendMedia(message.from, filePath);
          } else {
            client.sendMessage(message.from, item);
          }
        }
      } else if (response.sequence) {
        // Es una secuencia de mensajes
        await sendSequenceMessages(message.from, response.sequence);
      }
      return; // Sale del bucle para evitar que se envíen múltiples respuestas
    }
  }

  // Respuesta aleatoria para mensajes desconocidos
  const randomUnknownResponse = getRandomResponse(unknownResponses);
  client.sendMessage(message.from, randomUnknownResponse);
}

// Manejar eventos de mensajes
client.on('message', handleIncomingMessage);

// Inicializar el cliente de WhatsApp
client.initialize();
