import { Episode, CharacterRole } from './types';

export const COVER_IMAGE_URL = "https://i.ibb.co/ZzPT3FL4/Front-Carmen.png";

// Images for Scene 1 (Slideshow)
const IMG_1A = "https://i.ibb.co/vxNh4wyW/1A.png";
const IMG_1B = "https://i.ibb.co/395z7DWb/1B.png";
const IMG_1C = "https://i.ibb.co/qTWZkcG/1C.png";

// Images for Scene 2 (Slideshow)
const IMG_2A = "https://i.ibb.co/pB39ZKzm/2A.png";
const IMG_2B = "https://i.ibb.co/MDDy9Gsd/2B.png";
const IMG_2C = "https://i.ibb.co/V0pWYmBF/2C.png";

// Images for Scene 3 (Slideshow)
const IMG_3A = "https://i.ibb.co/YFvC95f5/3A.png";
const IMG_3B = "https://i.ibb.co/fb5237H/3B.png";
const IMG_3C = "https://i.ibb.co/TMvyxqZx/3C.png";

// Images for Scene 4 (Slideshow)
const IMG_4A = "https://i.ibb.co/8LYd5bMH/4A.png";
const IMG_4B = "https://i.ibb.co/RTPB906w/4B.png";
const IMG_4C = "https://i.ibb.co/LzmRV5QC/4C.png";

// Images for Scene 5 (Slideshow)
const IMG_5A = "https://i.ibb.co/w3dxZ7Q/5A.png";
const IMG_5B = "https://i.ibb.co/vxmPNQZf/5B.png";
const IMG_5C = "https://i.ibb.co/NgFvMYkR/5C.png";

// Images for Cultural Insight
const IMG_INSIGHT_1 = "https://i.ibb.co/MDDy9Gsd/2B.png"; 
const IMG_INSIGHT_2 = "https://i.ibb.co/V0pWYmBF/2C.png";
const IMG_INSIGHT_3 = "https://i.ibb.co/YBnGYx9c/Atocha1.png";
const IMG_INSIGHT_4 = "https://i.ibb.co/TBD6xxcv/Atocha2.png";

// Images for Vocabulary
const IMG_VOCAB = "https://i.ibb.co/ZzPT3FL4/Front-Carmen.png"; 

// Ambience Audio
// Replaced unreliable Google OGG files with a single MP3 source.
// TODO: Replace this URL with the direct link to your ElevenLabs file
const BACKGROUND_MUSIC = "https://assets.mixkit.co/music/preview/mixkit-acoustic-guitar-nature-sounds-ambient-2766.mp3"; 

export const EPISODE_ONE: Episode = {
  title: "La Llegada",
  story: [
    {
      id: 'scene-1',
      title: "El Vuelo",
      location: "Madrid Barajas Airport",
      ambience: BACKGROUND_MUSIC,
      images: [IMG_1A, IMG_1B, IMG_1C], 
      script: [
        {
          id: 's1-l1',
          role: CharacterRole.NARRATOR,
          spanish: "Carmen está llegando a Madrid. Un nuevo comienzo.",
          english: "Carmen is arriving in Madrid. A new beginning."
        },
        {
          id: 's1-l2',
          role: CharacterRole.CARMEN,
          spanish: "¡Hola, Madrid! Por fin estoy aquí.",
          english: "Hello, Madrid! I am finally here."
        }
      ]
    },
    {
      id: 'scene-2',
      title: "La Estación de Atocha",
      location: "Atocha Station - Interior",
      ambience: BACKGROUND_MUSIC,
      images: [IMG_2A, IMG_2B, IMG_2C], 
      script: [
        {
          id: 's2-l1',
          role: CharacterRole.NARRATOR,
          spanish: "Atocha no es solo una estación. Es un bosque dentro de la ciudad.",
          english: "Atocha is not just a station. It is a forest inside the city."
        },
        {
          id: 's2-l2',
          role: CharacterRole.CARMEN,
          spanish: "¡Es increíble! Hay palmeras y tortugas dentro de la estación.",
          english: "It’s incredible! There are palm trees and turtles inside the station."
        },
        {
          id: 's2-l3',
          role: CharacterRole.CARMEN,
          spanish: "Vale, necesito encontrar la salida.",
          english: "Okay, I need to find the exit."
        }
      ]
    },
    {
      id: 'scene-3',
      title: "Un Encuentro Inesperado",
      location: "Atocha Station - Platform",
      ambience: BACKGROUND_MUSIC,
      images: [IMG_3A, IMG_3B, IMG_3C], 
      script: [
        {
          id: 's3-l1',
          role: CharacterRole.NARRATOR,
          spanish: "Carmen busca un taxi, pero su maleta es muy pesada.",
          english: "Carmen is looking for a taxi, but her suitcase is very heavy."
        },
        {
          id: 's3-l2',
          role: CharacterRole.MATEO,
          spanish: "Perdona, ¿necesitas ayuda con esa maleta? Pesa mucho, ¿no?",
          english: "Excuse me, do you need help with that suitcase? It’s very heavy, isn't it?"
        },
        {
          id: 's3-l3',
          role: CharacterRole.CARMEN,
          spanish: "Oh, gracias. Sí, es un poco pesada. Soy Carmen.",
          english: "Oh, thank you. Yes, it’s a bit heavy. I am Carmen."
        },
        {
          id: 's3-l4',
          role: CharacterRole.MATEO,
          spanish: "Mucho gusto, Carmen. Yo soy Mateo. ¿Es tu primera vez en Madrid?",
          english: "Pleased to meet you, Carmen. I am Mateo. Is it your first time in Madrid?"
        },
        {
          id: 's3-l5',
          role: CharacterRole.CARMEN,
          spanish: "¿Dónde está la salida para el taxi?",
          english: "Where is the exit for the taxi?"
        }
      ]
    },
    {
      id: 'scene-4',
      title: "Secretos de Madrid",
      location: "Atocha Station - Exit",
      ambience: BACKGROUND_MUSIC,
      images: [IMG_4A, IMG_4B, IMG_4C],
      script: [
        {
          id: 's4-l1',
          role: CharacterRole.MATEO,
          spanish: "La salida está por allí, a la derecha.",
          english: "The exit is over there, to the right."
        },
        {
          id: 's4-l2',
          role: CharacterRole.MATEO,
          spanish: "Pero ten cuidado, Carmen. Madrid es una ciudad de sorpresas... y secretos.",
          english: "But be careful, Carmen. Madrid is a city of surprises... and secrets."
        },
        {
          id: 's4-l3',
          role: CharacterRole.CARMEN,
          spanish: "¿Secretos? ¿Qué quiere decir?",
          english: "Secrets? What does he mean?"
        },
        {
          id: 's4-l4',
          role: CharacterRole.NARRATOR,
          spanish: "La aventura de Carmen acaba de empezar.",
          english: "Carmen’s adventure has just begun."
        }
      ]
    },
    {
      id: 'scene-5',
      title: "Un Paseo por Madrid",
      location: "Calle de Atocha",
      ambience: BACKGROUND_MUSIC,
      images: [IMG_5A, IMG_5B, IMG_5C],
      script: [
          {
            id: 's5-l1',
            role: CharacterRole.NARRATOR,
            spanish: "El taxi lleva a Carmen hacia el centro de la ciudad.",
            english: "The taxi takes Carmen towards the city center."
          },
          {
            id: 's5-l2',
            role: CharacterRole.CARMEN,
            spanish: "¡Mira esa arquitectura! Es impresionante.",
            english: "Look at that architecture! It is impressive."
          },
          {
             id: 's5-l3',
             role: CharacterRole.NARRATOR,
             spanish: "Madrid brilla bajo el sol de la tarde.",
             english: "Madrid shines under the afternoon sun."
          }
      ]
  }],
  culturalInsight: {
      id: 'scene-insight',
      title: "Cultural Insight: El Invernadero",
      location: "El Invernadero de Atocha",
      ambience: BACKGROUND_MUSIC,
      images: [IMG_INSIGHT_1, IMG_INSIGHT_2, IMG_INSIGHT_3, IMG_INSIGHT_4],
      script: [
        {
          id: 's6-l1',
          role: CharacterRole.NARRATOR,
          spanish: "Esta estructura de hierro del siglo XIX no siempre fue un jardín. Originalmente, era la terminal principal de trenes.",
          english: "This 19th-century iron structure was not always a garden. Originally, it was the main train terminal."
        },
        {
          id: 's6-l2',
          role: CharacterRole.NARRATOR,
          spanish: "En 1992, el arquitecto Rafael Moneo transformó el espacio. Ahora alberga 7,000 plantas de 260 especies diferentes.",
          english: "In 1992, architect Rafael Moneo transformed the space. It now houses 7,000 plants of 260 different species."
        },
        {
           id: 's6-l3',
           role: CharacterRole.NARRATOR,
           spanish: "Durante muchos años, el estanque fue hogar de cientos de tortugas. Recientemente fueron trasladadas a un santuario para su bienestar.",
           english: "For many years, the pond was home to hundreds of turtles (terrapins). They were recently moved to a sanctuary for their well-being."
        },
        {
           id: 's6-l4',
           role: CharacterRole.NARRATOR,
           spanish: "Es un oasis tropical esperando a los viajeros, justo en el centro de la ciudad.",
           english: "It is a tropical oasis waiting for travelers, right in the center of the city."
        },
        {
          id: 's6-l5',
          role: CharacterRole.CARMEN,
          spanish: "Es un oasis urbano increíble.",
          english: "Practice: It is an incredible urban oasis."
        }
      ]
  },
  vocabulary: {
      id: 'scene-vocab',
      title: "Vocabulary Spotlight",
      location: "Review",
      ambience: "",
      images: [IMG_VOCAB],
      script: [
        {
          id: 's7-l1',
          role: CharacterRole.NARRATOR,
          spanish: "Repasemos algunas palabras clave. ¿Cómo se dice 'The Exit'?",
          english: "Let's review key words. How do you say 'The Exit'?"
        },
        {
          id: 's7-l2',
          role: CharacterRole.CARMEN,
          spanish: "La Salida",
          english: "The Exit"
        },
        {
          id: 's7-l3',
          role: CharacterRole.NARRATOR,
          spanish: "Muy bien. ¿Y cómo se dice 'The Suitcase'?",
          english: "Very good. And how do you say 'The Suitcase'?"
        },
        {
          id: 's7-l4',
          role: CharacterRole.CARMEN,
          spanish: "La Maleta",
          english: "The Suitcase"
        },
        {
          id: 's7-l5',
          role: CharacterRole.NARRATOR,
          spanish: "Finalmente, ¿cómo saludas a alguien nuevo?",
          english: "Finally, how do you greet someone new?"
        },
        {
          id: 's7-l6',
          role: CharacterRole.CARMEN,
          spanish: "Mucho gusto",
          english: "Pleased to meet you"
        }
      ]
  }
};

export const SYSTEM_INSTRUCTION_FEEDBACK = `
You are a helpful Spanish language coach named Carmen.
The user is a beginner learner playing the role of Carmen in a story.
Analyze the user's audio recording of the target Spanish phrase.
Compare it to the correct pronunciation.
Provide feedback in JSON format:
{
  "score": number, // 1-100
  "feedback": string, // A short, encouraging sentence about what they did well or need to fix.
  "tips": string // One specific tip to improve (e.g., "Roll your Rs more").
}
`;