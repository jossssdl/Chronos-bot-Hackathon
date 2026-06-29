# Chronos-Bot - Guión del Pitch de Video Demostrativo (2 Minutos)

Este documento describe la estructura del video, las indicaciones visuales en español y la locución/diálogos únicamente en inglés para la postulación en el hackathon.

---

## **Metadatos del Video**
* **Duración:** 2 Minutos (Máximo)
* **Objetivo:** Mostrar el funcionamiento en tiempo real del enjambre multimodal de Chronos-Bot en Cerebras Cloud (CS-3) con Gemma 4, comparando de forma directa y visual las latencias frente a GPUs convencionales.

---

## **Escena 1: Introducción y Planteamiento del Problema (0:00 - 0:30)**
* **Visual:** Plano cerrado de la pantalla de inicio del Dashboard de Chronos-Bot ejecutando el shader WebGL interactivo en segundo plano. Se inicia el simulador mostrando una ruta lenta y la tarjeta de GPU estándar reflejando latencia elevada (más de 800ms de retraso).
* **Audio / Diálogo (Voz en off - Únicamente en inglés):**
  > "Autonomous robots operating in dynamic, real-world environments require split-second decision-making. Traditional AI routing relies on cloud-based GPUs with cold starts and processing queues. In critical scenarios, a latency of over 800 milliseconds means collision, failure, and lost resources. Introducing Chronos-Bot: a multi-agent system designed for low-latency obstacle avoidance."

---

## **Escena 2: La Solución - Cerebras Cloud CS-3 Wafer-Scale Engine (0:30 - 1:00)**
* **Visual:** Grabación de pantalla del operador interactuando con el dashboard, seleccionando la navegación autónoma con Cerebras activo. La tarjeta de telemetría destella en color verde mostrando una latencia promedio de "18 ms" y "285 tokens/segundo". El robot evade los obstáculos dinámicos con fluidez.
* **Audio / Diálogo (Voz en off - Únicamente en inglés):**
  > "By running our Multimodal Swarm on Cerebras Cloud's CS-3 wafer-scale engine, we eliminate standard GPU bottlenecks. Chronos-Bot achieves an average reasoning latency of just 18 milliseconds—making it over 45 times faster than traditional GPU pipelines. Our double-agent structure parses the physical grid as a Base64 image and outputs safe, structured steering commands instantly."

---

## **Escena 3: Arquitectura Multi-Agente y Mitigación A* (1:00 - 1:30)**
* **Visual:** El operador navega a la sección virtual de "AGENTS" para mostrar el diagrama del Perceptor y Estratega. Vuelve al simulador, pinta obstáculos rojos justo frente al robot, y se visualiza la línea óptima A* en color naranja en el canvas. En la consola de logs aparece: `[System] Collision Mitigated Local. Corrected by A*`.
* **Audio / Diálogo (Voz en off - Únicamente en inglés):**
  > "Chronos-Bot operates with a dual-agent swarm: the Multimodal Perceptor translates visual canvas inputs into structured text, while the Strategist decides the next optimal move. For absolute mission safety, we integrated a classic A* pathfinding mitigation layer. If the AI predicts a path deviation, the system instantly overrides the command, ensuring 100% collision avoidance."

---

## **Escena 4: Interfaz Móvil y Conclusiones (1:30 - 2:00)**
* **Visual:** Muestra de la vista del simulador adaptada a móviles (iPhone SE en DevTools), abriendo el menú lateral deslizable y navegando a las secciones de Flota y Red. Se detiene la grabación en el SettingsPanel y se descarga automáticamente el archivo WebM del video demo del canvas.
* **Audio / Diálogo (Voz en off - Únicamente en inglés):**
  > "Featuring full mobile responsiveness, synthetic voice telemetry feedback, and built-in canvas session recording, Chronos-Bot is fully equipped for operators in the field. Powered by Cerebras CS-3 and Gemma 4, Chronos-Bot proves that real-time robot reasoning is no longer a bottleneck. Thank you."
