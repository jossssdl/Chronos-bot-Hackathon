# 🚀 PROPUESTAS DE MEJORA - CHRONOS-BOT

Este documento detalla las propuestas de mejora técnica de rápida implementación sugeridas para el proyecto **Chronos-Bot** en las últimas horas del **Cerebras x Google DeepMind Gemma 4 Hackathon**.

Estas implementaciones están diseñadas para elevar el impacto técnico del proyecto (Track 1) y el asombro visual de la demo (Track 2).

---

## 1. 🎤 Agente de Voz y Feedback Multimodal (Voice Agent)

### Objetivo
Hacer que la simulación sea audible. Cada vez que el enjambre tome una decisión o detecte un peligro, el sistema lo anunciará por altavoz.

### Beneficios para el Hackathon
- Añade una dimensión multimodal adicional (Texto + Imagen + Audio).
- Hace la demo mucho más interactiva y llamativa para redes sociales (Twitter/X).

### Guía de Implementación Rápida (Web Speech API)
Puedes usar la API nativa de síntesis de voz del navegador en tu componente frontend `src/app/page.tsx`:

```typescript
// Función de utilidad para sintetizar voz
const speakText = (text: string) => {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    // Detener cualquier locución previa
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-MX'; // Configuración de idioma
    utterance.rate = 1.1;     // Velocidad ligeramente acelerada
    utterance.pitch = 0.95;   // Tono cyberpunk sintético
    
    window.speechSynthesis.speak(utterance);
  }
};

// Integración en handleRunSwarm:
// Cuando el Estratega devuelve la decisión y explicación:
speakText(`Robot moviéndose al ${nextMove === 'UP' ? 'Norte' : nextMove === 'DOWN' ? 'Sur' : nextMove === 'LEFT' ? 'Oeste' : 'Este'}. Razón: ${estrategaDecision.reasoning_summary}`);
```

---

## 2. 🛡️ Control de Navegación Híbrido (Gemma 4 + Algoritmo A*)

### Objetivo
Demostrar un sistema de seguridad de nivel de producción combinando la inferencia de Inteligencia Artificial (Gemma 4) con un validador algorítmico clásico (A* o Dijkstra) de forma local.

### Beneficios para el Hackathon
- Ataca el Track 3 (Enterprise Impact) demostrando robustez y control de fallos en producción (evitando alucinaciones de la IA).
- Si Gemma 4 alucina una coordenada o sugiere moverse hacia un obstáculo, el validador local intercepta el comando y ejecuta el escape óptimo calculado por A*.

### Guía de Implementación Rápida
Puedes implementar una clase simple de búsqueda A* en TypeScript y utilizarla en la ruta `/api/swarm` para auditar la sugerencia del Estratega:

```typescript
// En route.ts:
import { calculateAStarPath } from '@/lib/astar';

// 1. Obtener la ruta óptima de forma tradicional
const optimalLocalPath = calculateAStarPath(robotPos, [9,9], obstacles);

// 2. Auditar la decisión del Estratega
if (estrategaDecision.next_move !== optimalLocalPath[0]) {
  console.warn("Divergencia: Gemma sugirió", estrategaDecision.next_move, "pero A* indica", optimalLocalPath[0]);
  // Lógica de mitigación: Elegir el camino seguro o reportar la auditoría en la UI.
}
```

---

## 3. 📹 Grabador de Pantalla Nativo (Demo Video Recorder)

### Objetivo
Permitir que los usuarios o evaluadores graben directamente su demo de 60 segundos desde la propia aplicación web y la descarguen en MP4.

### Beneficios para el Hackathon
- Facilita la generación de contenido viral para el **Track 2 (People's Choice)**.
- Elimina la necesidad de software externo de grabación (como OBS o Zoom) para los jueces.

### Guía de Implementación Rápida (MediaRecorder API)
Agrega un botón en el panel de control del frontend que grabe el elemento Canvas:

```typescript
const [recording, setRecording] = useState(false);
const mediaRecorderRef = useRef<MediaRecorder | null>(null);
const chunksRef = useRef<Blob[]>([]);

const startRecording = () => {
  const canvas = document.querySelector('canvas');
  if (!canvas) return;

  const stream = canvas.captureStream(60); // Capturar a 60 fps
  const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
  
  chunksRef.current = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunksRef.current.push(e.data);
  };

  recorder.onstop = () => {
    const blob = new Blob(chunksRef.current, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chronos-bot-demo.webm';
    a.click();
  };

  recorder.start();
  mediaRecorderRef.current = recorder;
  setRecording(true);
};

const stopRecording = () => {
  mediaRecorderRef.current?.stop();
  setRecording(false);
};
```

---

## 4. 🎛️ Modificación de Grilla Dinámica y Escala

### Objetivo
Permitir al usuario modificar el tamaño de la cuadrícula (ej. 5x5, 10x10, 15x15) y ver cómo el análisis espacial de Gemma 4 escala su entendimiento en imágenes Base64 de mayor resolución.

### Beneficios para el Hackathon
- Demuestra la adaptabilidad y el poder del enjambre ante diferentes topologías físicas del terreno.
- Permite a los jueces estresar el sistema y validar su resistencia a fallos.
