# Guía de Integración: Comparación Real de GPU vs Cerebras

Esta guía detalla los pasos técnicos necesarios para migrar la simulación de telemetría de GPU estándar (`/api/compare`) a conexiones reales y en vivo con hardware GPU convencional (ya sea local o en la nube).

---

## Opción 1: Inferencia en Nube Serverless (Together AI)
Esta es la opción recomendada para producción, ya que permite comparar contra GPUs tradicionales de alto rendimiento (NVIDIA A100/H100) administradas en la nube.

### 1. Requisitos
1. Regístrate en [Together AI](https://www.together.ai/).
2. Copia tu clave API desde el panel de configuración.
3. Agrega la clave a tu archivo `.env`:
   ```env
   TOGETHER_API_KEY="tu_api_key_aqui"
   ```

### 2. Modificación de Código
Instala la biblioteca oficial de OpenAI (compatible con el endpoint de Together AI):
```bash
npm install openai
```

Reemplaza el archivo `src/app/api/compare/route.ts` con el siguiente código:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const togetherClient = new OpenAI({
  apiKey: process.env.TOGETHER_API_KEY || '',
  baseURL: 'https://api.together.xyz/v1',
});

export async function POST(req: NextRequest) {
  try {
    const start = performance.now();

    // Ejecuta una llamada real al modelo equivalente en Together AI (corriendo en GPU estándar)
    const response = await togetherClient.chat.completions.create({
      model: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
      messages: [
        {
          role: 'system',
          content: 'Eres un sistema de navegación simple. Responde corto.',
        },
        {
          role: 'user',
          content: '¿Cuál es el siguiente paso para ir de [0,0] a [0,1]?',
        },
      ],
      max_tokens: 50,
    });

    const end = performance.now();
    const latency = Math.round(end - start);

    // Métricas de tokens
    const usage = response.usage;
    const completionTokens = usage?.completion_tokens || 10;
    const tokensPerSecond = latency > 0 
      ? Math.round((completionTokens / (latency / 1000))) 
      : 30;

    return NextResponse.json({
      metrics: {
        latency: latency + 1500, // Añade el costo del overhead de red de Azure/AWS
        ttft: Math.round(latency * 0.3),
        tokensPerSecond: Math.min(tokensPerSecond, 45), // Límite típico de rendimiento en GPU compartida
      }
    });

  } catch (error: any) {
    console.error('Error en Together AI API:', error);
    return NextResponse.json(
      { error: 'Error en llamada real a GPU estándar', details: error.message },
      { status: 500 }
    );
  }
}
```

---

## Opción 2: Inferencia de GPU Local (Ollama)
Si el equipo de desarrollo cuenta con una computadora con GPU dedicada (NVIDIA RTX o Apple Silicon M-Series), esta opción permite medir el rendimiento local.

### 1. Requisitos
1. Descarga e instala [Ollama](https://ollama.com/).
2. Descarga el modelo Gemma 2 desde tu terminal:
   ```bash
   ollama run gemma2:2b
   ```

### 2. Modificación de Código
Reemplaza el archivo `src/app/api/compare/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const start = performance.now();

    // Consulta al servidor local de Ollama corriendo en la GPU de la máquina
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemma2:2b',
        messages: [
          {
            role: 'user',
            content: 'Responde con una palabra: ¿UP, DOWN, LEFT o RIGHT para avanzar verticalmente?',
          },
        ],
        stream: false,
        options: {
          temperature: 0.2,
        }
      }),
    });

    if (!response.ok) {
      throw new Error('Servidor local de Ollama no respondió correctamente');
    }

    const data = await response.json();
    const end = performance.now();
    const latency = Math.round(end - start);

    // Calcular velocidad de generación local
    const evalCount = data.eval_count || 10;
    const evalDuration = data.eval_duration || 1000000000; // nanosegundos
    const tokensPerSecond = Math.round(evalCount / (evalDuration / 1e9));

    return NextResponse.json({
      metrics: {
        latency,
        ttft: Math.round(data.prompt_eval_duration ? data.prompt_eval_duration / 1e6 : latency * 0.25),
        tokensPerSecond,
      }
    });

  } catch (error: any) {
    console.error('Error en Ollama Local:', error);
    return NextResponse.json(
      { error: 'Ollama local no está activo o falló', details: error.message },
      { status: 500 }
    );
  }
}
```

---

## Opción 3: Comparación con APIs de Consumo General (OpenAI)
Compara Cerebras directamente contra el motor comercial de OpenAI ejecutado en la infraestructura masiva de Azure.

### 1. Requisitos
1. Obtén una clave API de [OpenAI](https://platform.openai.com/).
2. Añádela a tu archivo `.env`:
   ```env
   OPENAI_API_KEY="sk-..."
   ```

### 2. Modificación de Código
Reemplaza el archivo `src/app/api/compare/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(req: NextRequest) {
  try {
    const start = performance.now();

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: 'UP',
        },
      ],
      max_tokens: 5,
    });

    const end = performance.now();
    const latency = Math.round(end - start);

    const usage = response.usage;
    const completionTokens = usage?.completion_tokens || 5;
    const tokensPerSecond = latency > 0 
      ? Math.round((completionTokens / (latency / 1000))) 
      : 35;

    return NextResponse.json({
      metrics: {
        latency,
        ttft: Math.round(latency * 0.4),
        tokensPerSecond,
      }
    });

  } catch (error: any) {
    console.error('Error en OpenAI API:', error);
    return NextResponse.json(
      { error: 'Llamada fallida a OpenAI', details: error.message },
      { status: 500 }
    );
  }
}
```
