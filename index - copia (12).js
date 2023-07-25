const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
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
    responses: ['¡Hola! ¿Cómo estás?', '¡Hey! ¿Qué tal?', '¡Hola! ¿En qué puedo ayudarte?'],
  },
  {
    keywords: ['adios', 'chao', 'nos vemos', 'hasta pronto'],
    responses: ['¡Hasta luego!', '¡Adiós! Espero verte pronto.', '¡Nos vemos!'],
  },
  {
    keywords: ['gracias', 'muchas gracias', 'te agradezco'],
    responses: ['De nada. Siempre estoy aquí para ayudarte.', 'No hay de qué.', 'El placer es mío.'],
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
  {
    keywords: ['comida', 'gastro'],
    responses: ['¡Me encanta la comida!', '¿Cuál es tu comida favorita?', 'Yo soy un bot y no puedo comer, pero me gusta la pizza virtual.'],
  },
  {
    keywords: ['hobbies', 'pasatiempos'],
    responses: ['¿Cuáles son tus hobbies?', 'Me gusta charlar contigo, ese es mi hobby principal.'],
  },
  {
    keywords: ['saludo', 'saludos'],
    responses: ['¡Hola!', '¡Buen día!', '¡Saludos!'],
  },
  {
    keywords: ['clima', 'pronóstico'],
    responses: ['El clima está soleado y cálido hoy.', 'Se espera lluvia para mañana.', 'Hoy tendremos una temperatura máxima de 25°C.'],
  },
  {
    keywords: ['despedida', 'adiós'],
    responses: ['¡Hasta luego!', 'Nos vemos pronto.', 'Que tengas un buen día.'],
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
