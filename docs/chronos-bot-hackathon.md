# 🤖 CHRONOS-BOT: Enjambre de Reacción Crítica para Robótica Reactiva

[cite_start]Documento de especificación técnica y estrategia de desarrollo para el **Cerebras x Google DeepMind Gemma 4 24-Hour Hackathon**[cite: 7].

* [cite_start]**Track Principal:** Track 1 - Multiverse Agents (Best Multi-Agent + Multimodal Use Case)[cite: 11, 44].
* [cite_start]**Track Secundario:** Track 2 - People's Choice (Most Impressions on Social Media)[cite: 11, 47].
* [cite_start]**Core Stack:** Google DeepMind Gemma 4 31B [cite: 7, 87] + [cite_start]Cerebras Ultra-Fast Inference API[cite: 9, 103].

---

## 🌎 1. Descripción General del Proyecto
[cite_start]**Chronos-Bot** es un sistema de multi-agentes en tiempo real diseñado para la toma de decisiones lógicas en entornos físicos o simulados (Robótica, IA Física, IoT) que requieren latencia cercana a cero[cite: 9, 46]. [cite_start]El ecosistema procesa streams visuales del entorno (imágenes en Base64) a través de la API multimodal de Cerebras[cite: 107, 109]. 

[cite_start]Gracias a la velocidad extrema de inferencia de Cerebras [cite: 9, 39][cite_start], un agente estratega activa el modo de razonamiento profundo (`reasoning_effort: "high"`) [cite: 95, 116] y un agente actuador devuelve instrucciones de movimiento estructuradas en formato JSON estricto (`strict: true`) [cite: 112] [cite_start]para ajustar el comportamiento del hardware o simulador en milisegundos, rompiendo la barrera de lag de las GPUs tradicionales[cite: 40].

### [cite_start]Requerimientos de la Demo (60 Segundos) [cite: 38]
* [cite_start]**Demostración de velocidad:** Comparativa interactiva lado a lado (Cerebras vs. Proveedor basado en GPU tradicional) para resaltar la caída drástica en la latencia de respuesta[cite: 40].
* [cite_start]**Privacidad:** Asegurar que ninguna API Key, credencial o notificación del sistema sea visible en la captura del escritorio[cite: 42].

---

## 🛠️ 2. Arquitectura de Tecnologías

* **Frontend (Entorno de Simulación):** React / Next.js (Tailwind CSS) + HTML5 Canvas para el renderizado del mapa de la grilla 2D donde se moverá el robot avatar.
* **Backend (Orquestador de Agentes):** Node.js (TypeScript) / Express o Python (FastAPI).
* [cite_start]**API de Inferencia:** `gemma-4-31b` ejecutado sobre la infraestructura de Cerebras Cloud[cite: 102, 103].
* [cite_start]**Formatos de Comunicación:** Ingesta de imágenes en cadenas de texto URI Base64 [cite: 109] [cite_start]y respuestas validadas mediante JSON Schema estructurado[cite: 112].

---

## 📅 3. Cronograma de Fases a Contrarreloj (24 Horas)

Dada la naturaleza crítica del tiempo en este hackathon (24 horas), el desarrollo se segmenta en **4 fases intensivas**. Cada fase incluye la especificación completa del **Prompt de Co-Piloto** diseñado para actuar como un ingeniero de software senior y acelerar la escritura de tu código.

### ⏱️ Fase 1: Entorno Gráfico y Captura de Pantalla (Duración: 4 Horas)
**Actividades:**
* Configurar el boilerplate en Next.js/Tailwind.
* Diseñar un Canvas HTML5 que represente una grilla lógica. El robot inicia en el punto `(0,0)` e intenta avanzar al punto `(9,9)`.
* Implementar un sistema de clic/arrastre de ratón para colocar obstáculos dinámicos en la pantalla.
* Programar una función interna en JavaScript que extraiga el estado actual del Canvas en una cadena Base64 (`canvas.toDataURL('image/png')`).

> 🤖 **Prompt Completo para IA (Fase 1 - Frontend):**
> 
> **Objetivo:** Crear el entorno web de simulación interactiva con capacidad de serialización visual instantánea.
> 
> ```text
> [CONTEXTO Y ROL]
> Actúas como un Ingeniero de Software Frontend Staff con especialidad en interacciones de alto rendimiento en la Web y manejo de la API de Canvas en HTML5. Estamos construyendo "Chronos-Bot", un MVP para un hackathon de tiempo crítico basado en robótica reactiva en tiempo real.
> 
> [OBJETIVO DE DESARROLLO]
> Diseña un componente de React estructurado con TypeScript moderno y Tailwind CSS que implemente una grilla lógica de simulación interactiva.
> 
> [ESPECIFICACIONES TÉCNICAS REQUERIDAS]
> 1. Grilla Lógica: Una cuadrícula de 10x10 celdas indexadas por coordenadas bidimensionales (X, Y).
> 2. Estados de Nodos Básicos:
>    - Nodo "Robot" (Color Azul): Posición inicial dinámica (default [0,0]).
>    - Nodo "Meta" (Color Verde): Posición objetivo estática (default [9,9]).
>    - Nodo "Obstáculo" (Color Rojo): Celdas bloqueadas.
> 3. Interactividad: El usuario debe poder hacer clic y arrastrar el cursor sobre las celdas vacías del Canvas para pintar u omitir "Obstáculos" (Nodos Rojos) dinámicamente en tiempo real.
> 4. Serializador Multimodal: Implementa una función exportable y optimizada llamada captureSimulationState(). Esta función debe capturar sincrónicamente el cuadro actual del Canvas, limpiar cualquier artefacto visual ajeno, y retornar estrictamente una cadena de texto formateada en "data URI Base64" (image/png), lista para ser transmitida a una API de visión por computadora.
> 
> [CONSTRICCIONES Y CALIDAD DE CÓDIGO]
> - No utilices librerías externas pesadas de gráficos; dependemos de la API nativa de Canvas de HTML5 mediante un hook useRef para garantizar la máxima velocidad de renderizado.
> - Estrecho manejo de ciclo de vida: evita memory leaks al limpiar los event listeners del mouse en el Canvas.
> - Entrega el código modular, completamente tipado, autoexplicativo y listo para producción sin omitir secciones (prohibido colocar comentarios de marcador como "// el código va aquí").
> ```

---

### ⏱️ Fase 2: Conexión API Cerebras y Multi-Agentes (Duración: 6 Horas)
**Actividades:**
* Establecer la conexión con el SDK oficial de Cerebras utilizando las credenciales cargadas de `.env`.
* Configurar el primer flujo de agente (Perceptor): enviar la imagen Base64 para detectar visualmente las coordenadas del mapa.
* Configurar el segundo flujo (Estratega): encadenar el reporte espacial hacia la lógica de razonamiento lógico (`reasoning_effort: "high"`) de Gemma 4.

> 🤖 **Prompt Completo para IA (Fase 2 - Multi-Agentes Core):**
> 
> **Objetivo:** Escribir el orquestador backend con agentes lógicos secuenciales explotando la velocidad de Cerebras.
> 
> ```text
> [CONTEXTO Y ROL]
> Actúas como un Arquitecto de Soluciones de Inteligencia Artificial Senior. Tu fuerte es la integración de sistemas de inferencia distribuidos y el diseño de patrones multi-agente secuenciales. Vas a escribir el orquestador core para el proyecto "Chronos-Bot" usando el SDK oficial de Cerebras, apuntando a los servidores de Cerebras Cloud.
> 
> [OBJETIVO DE DESARROLLO]
> Escribe un módulo en Node.js (TypeScript) que exponga una función asíncrona encargada de procesar una trama de simulación mediante dos agentes lógicos secuenciales que explotan el modelo 'gemma-4-31b'.
> 
> [LÓGICA DEL ENJAMBRE DE AGENTES]
> 1. Agente Perceptor (Multimodal):
>    - Configuración: Inferencia multimodal pura. 'reasoning_effort' desactivado ("none").
>    - Entrada: Recibe el string Base64 generado por el frontend.
>    - Prompt de Sistema: "Eres el sistema visual del robot. Examina la imagen matricial adjunta en Base64. Identifica las coordenadas (X, Y) exactas del Robot, de la Meta y de cada bloque de Obstáculo rojo. Genera un reporte resumido en formato textual plano con las coordenadas exactas de las amenazas."
> 2. Agente Estratega (Razonamiento Complejo):
>    - Configuración: Entrada de texto puro. Requiere activar explícitamente el modo de pensamiento profundo de Gemma 4 enviando el parámetro reasoning_effort: "high" en el cuerpo de la petición.
>    - Entrada: Recibe el reporte de texto del Agente Perceptor y el historial de últimos movimientos realizados por el robot (pasado como parámetro).
>    - Prompt de Sistema: "Eres el cerebro analítico de un robot autónomo de rescate. Basándote en el mapa de coordenadas provisto por el perceptor y el historial de movimientos anteriores, calcula analíticamente la trayectoria más rápida y segura para que el robot avance hacia la meta [9,9] evadiendo los obstáculos, minimizando pasos y evitando bucles infinitos."
> 
> [CONSTRICCIONES TÉCNICAS]
> - Utiliza la autenticación estándar de la API de Cerebras importando el cliente oficial de '@cerebras/cerebras_cloud_sdk'.
> - Captura métricas detalladas: extrae del objeto de retorno de la API de Cerebras los datos de consumo de tokens y el objeto nativo de telemetría time_info para auditorías de latencia.
> - Maneja excepciones específicas de red, payloads corruptos en el Base64 y caídas de rate-limits retornando códigos de error legibles.
> ```

---

### ⏱️ Fase 3: Salidas Estructuradas y Control en Tiempo Real (Duración: 5 Horas)
**Actividades:**
* Diseñar un JSON Schema que limite estrictamente las respuestas válidas que la simulación pueda procesar (dirección, coordenadas de ruta y justificación).
* Configurar el formato estructurado con la bandera `strict: true` en la API de Cerebras.
* Conectar la respuesta JSON con la UI para mover al robot y pintar el trazado predictivo en el Canvas.

> 🤖 **Prompt Completo para IA (Fase 3 - Salidas Estructuradas):**
> 
> **Objetivo:** Forzar a Gemma 4 a retornar respuestas estructuradas parseables bajo JSON Schema.
> 
> ```text
> [CONTEXTO Y ROL]
> Actúas como un Ingeniero de Backend Staff y Experto en Seguridad de Datos. Tu enfoque es garantizar la predictibilidad absoluta de las interfaces de programación (APIs). Necesitamos asegurar que las decisiones de ruta tomadas por el agente de pensamiento estratégico se traduzcan en comandos puros que el motor de renderizado HTML5 pueda digerir de inmediato de manera síncrona.
> 
> [OBJETIVO DE DESARROLLO]
> Diseña una función en TypeScript que envíe la decisión táctica al modelo 'gemma-4-31b' en Cerebras, forzando la respuesta mediante "Structured Outputs" utilizando la bandera estricta (strict: true).
> 
> [ESPECIFICACIONES DEL JSON SCHEMA]
> El modelo debe responder obligatoriamente estructurado bajo el siguiente esquema JSON estricto:
> {
>   "type": "object",
>   "properties": {
>     "next_move": {
>       "type": "string",
>       "enum": ["UP", "DOWN", "LEFT", "RIGHT"]
>     },
>     "path_coordinates": {
>       "type": "array",
>       "items": {
>         "type": "array",
>         "items": { "type": "integer" },
>         "minItems": 2,
>         "maxItems": 2
>       },
>       "description": "Lista de las próximas 3 coordenadas predichas [x, y] para optimizar el render"
>     },
>     "reasoning_summary": {
>       "type": "string",
>       "description": "Explicación ejecutiva de máximo 15 palabras de por qué se eligió ese vector."
>     }
>   },
>   "required": ["next_move", "path_coordinates", "reasoning_summary"],
>   "additionalProperties": false
> }
> 
> [CONSTRICCIONES]
> - El prompt debe estar optimizado para evitar preámbulos conversacionales ("Aquí tienes tu JSON:"). El uso de strict: true garantiza esto a nivel API, por lo que tu código debe reflejar exactamente cómo pasar el esquema dentro del parámetro response_format en la llamada del cliente de Cerebras.
> - Retorna la implementación completa lista para ser consumida como un controlador de Route Handler de Next.js.
> ```

---

### ⏱️ Fase 4: Comparativa de Latencia y Grabación de Demo (Duración: 5 Horas)
**Actividades:**
* Lanzar dos llamadas de inferencia en paralelo en el frontend para comparar Cerebras (rápido) contra una GPU Cloud convencional (lento).
* Extraer y renderizar métricas del objeto nativo `time_info` en la interfaz (TTFT y tokens/segundo).
* Diseñar las tarjetas comparativas lado a lado con estéticas oscuras cyberpunk y brillo neón para la grabación del video demo de 60 segundos.

> 🤖 **Prompt Completo para IA (Fase 4 - Telemetría y UX):**
> 
> **Objetivo:** Desarrollar el dashboard de métricas comparativas side-by-side de alta fidelidad.
> 
> ```text
> [CONTEXTO Y ROL]
> Actúas como un Diseñador de Interfaces Senior y Desarrollador Especialista en Visualización de Datos Financieros y de Sistemas Operativos en Tiempo Real. Tu objetivo es crear la UI que ganará el track de impacto social (People's Choice), provocando un efecto inmediato de asombro por velocidad.
> 
> [OBJETIVO DE DESARROLLO]
> Desarrollar un componente de telemetría comparativa en React, TypeScript y Tailwind CSS. El dashboard debe contrastar en tiempo real dos flujos de ejecución concurrentes:
> 1. Canal de Inferencia Cerebras (Powered por Gemma 4 31B).
> 2. Canal de Inferencia Basado en GPU Tradicional / Proveedor Secundario Cloud.
> 
> [REQUERIMIENTOS DE LA INTERFAZ VISUAL]
> - El componente recibirá de forma dinámica dos objetos con métricas: Latencia total (ms), TTFT (Time To First Token en milisegundos), y Rendimiento (Tokens por segundo).
> - Layout: Diseño lado a lado (Side-by-Side Cards) con estéticas oscuras cyberpunk (slate-900 / zinc-950).
> - Animaciones e Indicadores de Estado: 
>   - La tarjeta de Cerebras debe incluir una insignia parpadeante en verde neón (emerald-500) con el texto "REAL-TIME SPEEDS". Cuando la latencia de Cerebras sea menor a 300ms, aplica un efecto de brillo perimetral (pulse shadow).
>   - La tarjeta de la GPU Competidora debe mostrar un loader o indicador ámbar que refleje visualmente la espera ("LAGGING / BUFFERING") debido a los cuellos de botella de memoria tradicionales.
> - Incluye un indicador matemático autocalculado central gigante que diga: "Cerebras es [X] veces más rápido que las arquitecturas GPU estándar", donde X se calcula dinámicamente dividiendo las métricas de rendimiento recibidas.
> 
> [RESTRICCIONES]
> - El código debe ser altamente responsivo, ultra-estilizado y optimizado para lucir impecable en grabaciones de video en alta definición a 60 fps (escalas de texto grandes, fuentes monoespaciadas para los números numéricos y alto contraste).
> ```

---


## 🗂️ 4. Formato de Entrega Final para Discord y Twitter [cite: 16, 21]

Al concluir el desarrollo, las directrices oficiales dictan que debemos estructurar el post de entrega de la siguiente manera exacta en los canales públicos `#g4hackathon-multiverse-agents` y `#g4hackathon-people-choice`[cite: 19, 20, 25]:

```text
• Project Name: Chronos-Bot
• Team Members: @TuUsuarioDiscord, @MiembrosDeTuEquipo
• Project Description: Chronos-Bot es un enjambre de agentes lógicos diseñado para la toma de decisiones en robótica reactiva e IA física en tiempo real. Utilizando la inferencia multimodal ultra-rápida de Gemma 4 en Cerebras, el sistema procesa imágenes consecutivas del entorno para evadir obstáculos dinámicos con latencia cercana a cero, calculando rutas óptimas a la velocidad del pensamiento.
• GitHub Repository: [Enlace a tu repositorio público]
• Demo Video: (Adjuntar archivo de video de 60 segundos de forma nativa)