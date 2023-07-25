const qrcode = require('qrcode-terminal');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const client = new Client({
  authStrategy: new LocalAuth()
});
const fs = require('fs');
const axios = require('axios');

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
    responses: ['¡Hola! ¿Cómo estás?', '¡Hey! ¿Qué tal?', '¡Hola! ¿En qué puedo ayudarte?'],
  },
  {
    keywords: ['adios', 'chao', 'nos vemos', 'hasta pronto'],
    responses: ['¡Hasta luego!', '¡Adiós! Espero verte pronto.', '¡Nos vemos!'],
  },
  // Agrega más palabras clave y sus respuestas aquí
  {
    keywords: ['clave', 'secuencia'],
    sequence: [
      ['Mensaje 1', 2000],
      ['Mensaje 2', 1000],
      ['Mensaje 3', 3000],
      ['Mensaje 4', 1500],
      ['Mensaje 5', 2000],
      ['Mensaje 6', 1000],
    ],
  },
  {
    keywords: ['otraclave', 'otra secuencia'],
    sequence: [
      ['Respuesta 1', 3000],
      ['Respuesta 2', 2000],
      ['Respuesta 3', 2500],
    ],
  },
  // Agregar nueva palabra clave para enviar una imagen
  {
    keywords: ['enviar imagen'],
    sendImage: 'imagen1.jpg', // Cambiar 'ruta_de_la_imagen.jpg' por la ruta de la imagen que desees enviar
  },

  // Agregar nueva palabra clave para enviar un video
  {
    keywords: ['enviar video'],
    sendVideo: 'video1.mp4', // Cambiar 'ruta_del_video.mp4' por la ruta del video que desees enviar
  },

  // Agregar nueva palabra clave para enviar un media y usarlo como logo
  {
    keywords: ['logo'],
    sendMedia: 'https://imgur.com/gallery/Ztv2mZm', // Cambiar el enlace por el enlace de tu imagen o video
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

// Función para enviar una secuencia de mensajes con intervalos de tiempo
async function sendSequenceMessages(chatId, messages) {
  for (const [message, interval] of messages) {
    await new Promise(resolve => setTimeout(resolve, interval));
    client.sendMessage(chatId, message);
  }
}

// Función para manejar los mensajes entrantes
async function handleIncomingMessage(message) {
  console.log(message.body);
  const lowercaseMessage = message.body.toLowerCase();

  // Verifica si el mensaje contiene una imagen o un video adjunto
  const hasMedia = message.hasMedia;
  const mediaType = message.type;
  if (hasMedia && (mediaType === 'image' || mediaType === 'video')) {
    // Responder con un mensaje apropiado para imágenes y videos
    const mediaResponse = `Has enviado un ${mediaType === 'image' ? 'imagen' : 'video'}. Gracias por compartirlo.`;
    client.sendMessage(message.from, mediaResponse);
    return;
  }

  // Verifica si el mensaje coincide con alguna palabra clave y envía una respuesta
  for (const response of keywordResponses) {
    if (containsKeywords(lowercaseMessage, response.keywords)) {
      if (response.responses) {
        // Es una respuesta aleatoria
        const randomResponse = getRandomResponse(response.responses);
        client.sendMessage(message.from, randomResponse);
      } else if (response.sequence) {
        // Es una secuencia de mensajes
        await sendSequenceMessages(message.from, response.sequence);
      } else if (response.sendMedia) {
        // Es una solicitud para enviar un media como logo
        try {
          const mediaURL = response.sendMedia;
          const mediaBuffer = await downloadMedia(mediaURL);
          const media = new MessageMedia(mediaType, mediaBuffer);
          client.sendMessage(message.from, media, { sendMediaAsSticker: true });
        } catch (error) {
          client.sendMessage(message.from, 'No se pudo descargar el media.');
        }
      } else if (response.sendImage) {
        // Es una solicitud para enviar una imagen
        const imagePath = response.sendImage;
        if (fs.existsSync(imagePath)) {
          const media = MessageMedia.fromFilePath(imagePath);
          client.sendMessage(message.from, media);
        } else {
          client.sendMessage(message.from, 'No se encontró la imagen.');
        }
      } else if (response.sendVideo) {
        // Es una solicitud para enviar un video
        const videoPath = response.sendVideo;
        if (fs.existsSync(videoPath)) {
          const media = MessageMedia.fromFilePath(videoPath);
          client.sendMessage(message.from, media);
        } else {
          client.sendMessage(message.from, 'No se encontró el video.');
        }
      }
      return; // Sale del bucle para evitar que se envíen múltiples respuestas
    }
  }

  // Respuesta aleatoria para mensajes desconocidos
  const randomUnknownResponse = getRandomResponse(unknownResponses);
  client.sendMessage(message.from, randomUnknownResponse);
}

// Función para descargar el media desde la URL
async function downloadMedia(mediaURL) {
  const response = await axios.get(mediaURL, { responseType: 'arraybuffer' });
  return response.data;
}

// Manejar eventos de mensajes
client.on('message', handleIncomingMessage);

// Inicializar el cliente de WhatsApp
client.initialize();
