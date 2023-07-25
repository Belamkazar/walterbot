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
const keywordResponses = {
  'hola': ['¡Hola! ¿Cómo estás?', '¡Hey! ¿Qué tal?', '¡Hola! ¿En qué puedo ayudarte?'],
  'adios': ['¡Hasta luego!', '¡Adiós! Espero verte pronto.', '¡Nos vemos!'],
  'gracias': ['De nada. Siempre estoy aquí para ayudarte.', 'No hay de qué.', 'El placer es mío.'],
  // Agrega más palabras clave y sus respuestas aleatorias aquí
  'clave': [
    ['ho1la b', 2000], // Mensaje 1 con un intervalo de 2000 ms (2 segundos) antes del siguiente mensaje
    ['hol2a bb', 1000], // Mensaje 2 con un intervalo de 1000 ms (1 segundo) antes del siguiente mensaje
    ['hol3abbb', 3000], // Mensaje 3 con un intervalo de 3000 ms (3 segundos) antes del siguiente mensaje
    ['hola4bbbb', 1500], // Mensaje 4 con un intervalo de 1500 ms (1.5 segundos) antes del siguiente mensaje
    ['holab5dbd', 2000], // Mensaje 5 con un intervalo de 2000 ms (2 segundos) antes del siguiente mensaje
    ['holaaa6ddddd', 1000], // Mensaje 6 con un intervalo de 1000 ms (1 segundo) antes del siguiente mensaje
  ],
};

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

// Función para verificar si el mensaje incluye una palabra clave
function containsKeyword(message, keyword) {
  const normalizedMessage = removeAccents(message);
  const normalizedKeyword = removeAccents(keyword);
  return normalizedMessage.includes(normalizedKeyword);
}

// Función para enviar una secuencia de mensajes con intervalos de tiempo
async function sendSequenceMessages(chatId, messages) {
  for (const [message, interval] of messages) {
    await new Promise(resolve => setTimeout(resolve, interval));
    client.sendMessage(chatId, message);
  }
}

client.on('message', async message => {
  console.log(message.body);
  const lowercaseMessage = message.body.toLowerCase();

  // Verifica si el mensaje coincide con alguna palabra clave y envía una respuesta
  for (const keyword in keywordResponses) {
    if (containsKeyword(lowercaseMessage, keyword)) {
      const response = keywordResponses[keyword];
      if (Array.isArray(response[0])) {
        // Es una secuencia de mensajes
        sendSequenceMessages(message.from, response);
      } else {
        // Es una respuesta aleatoria
        const randomResponse = getRandomResponse(response);
        client.sendMessage(message.from, randomResponse);
      }
      return; // Sale del bucle para evitar que se envíen múltiples respuestas
    }
  }

  // Respuesta aleatoria para mensajes desconocidos
  const randomUnknownResponse = getRandomResponse(unknownResponses);
  client.sendMessage(message.from, randomUnknownResponse);
});

client.initialize();
