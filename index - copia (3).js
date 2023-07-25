const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const client = new Client({
  authStrategy: new LocalAuth()
});

// Genera el código qr para conectarse a whatsapp-web
client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
});

// Si la conexión es exitosa muestra el mensaje de conexión exitosa
client.on('ready', () => {
  console.log('Conexion exitosa nenes');
});

// Función para eliminar tildes de las palabras
const removeAccents = (str) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

// Diccionario de palabras clave y respuestas aleatorias
const keywordResponses = {
  'hola': ['¡Hola! ¿Cómo estás?', '¡Hey! ¿Qué tal?', '¡Hola! ¿En qué puedo ayudarte?'],
  'adios': ['¡Hasta luego!', '¡Adiós! Espero verte pronto.', '¡Nos vemos!'],
  'gracias': ['De nada. Siempre estoy aquí para ayudarte.', 'No hay de qué.', 'El placer es mío.'],
  // Agrega más palabras clave y sus respuestas aleatorias aquí
};

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

// Aquí sucede la magia, escucha los mensajes y aquí es donde se manipula lo que queremos que haga el bot
client.on('message', message => {
  console.log(message.body);
  // Convierte el mensaje en minúsculas para que no sea sensible a mayúsculas y minúsculas
  const lowercaseMessage = message.body.toLowerCase();

  // Verifica si el mensaje coincide con alguna palabra clave y envía una respuesta aleatoria
  for (const keyword in keywordResponses) {
    if (containsKeyword(lowercaseMessage, keyword)) {
      const randomResponse = getRandomResponse(keywordResponses[keyword]);
      client.sendMessage(message.from, randomResponse);
      return; // Sale del bucle para evitar que se envíen múltiples respuestas
    }
  }

  // Respuesta predeterminada para mensajes desconocidos
  client.sendMessage(message.from, 'Lo siento, no he reconocido tu mensaje.');
});

client.initialize();
