import { NextRequest, NextResponse } from 'next/server';
import Cerebras from '@cerebras/cerebras_cloud_sdk';

// Initialize the official Cerebras SDK client
const client = new Cerebras({
  apiKey: process.env.CEREBRAS_API_KEY || '',
});

export async function POST(req: NextRequest) {
  try {
    const { image, history, robotPos } = await req.json();

    if (!image) {
      return NextResponse.json({ error: 'Falta la imagen del mapa en formato Base64' }, { status: 400 });
    }

    if (!process.env.CEREBRAS_API_KEY) {
      return NextResponse.json({ error: 'CEREBRAS_API_KEY no está configurada en el servidor' }, { status: 500 });
    }

    const currentRobotCoords = robotPos ? `[${robotPos[0]}, ${robotPos[1]}]` : '[0, 0]';

    // --- AGENTE 1: PERCEPTOR (VISIÓN MULTIMODAL) ---
    const startPerceptor = performance.now();
    
    const perceptorResponse = await client.chat.completions.create({
      model: 'gemma-4-31b',
      messages: [
        {
          role: 'system',
          content: `Eres el sistema visual de un robot autónomo. Analiza la imagen matricial adjunta (que representa un lienzo de simulación de una grilla de 10x10).
La posición exacta actual del robot en la grilla es ${currentRobotCoords}.
Identifica las coordenadas (X, Y) exactas (indexadas de 0 a 9) de:
1. El Robot (que se encuentra exactamente en ${currentRobotCoords}).
2. La Meta (indicada por el cuadro verde neón, típicamente en [9,9]).
3. Cada bloque de Obstáculo (indicado por los cuadros rojos).

Genera un reporte conciso y resumido en formato textual plano con las coordenadas detectadas para alimentar al agente estratega.`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: image, // Base64 data URI
              },
            },
          ],
        },
      ],
      // reasoning_effort is disabled (none) for fast perception
      ...({ reasoning_effort: 'none' } as any),
    });

    const endPerceptor = performance.now();
    const perceptorLatency = Math.round(endPerceptor - startPerceptor);
    const perceptorReport = (perceptorResponse as any).choices?.[0]?.message?.content || 'No se pudo generar el reporte del perceptor.';
    const perceptorTimeInfo = (perceptorResponse as any).time_info || null;
    const perceptorUsage = perceptorResponse.usage || null;

    // --- AGENTE 2: ESTRATEGA (PENSAMIENTO LÓGICO / PENSAMIENTO PROFUNDO) ---
    const startEstratega = performance.now();
    
    // Prepare history description
    const historyText = history && history.length > 0 
      ? `Historial de últimos movimientos ejecutados por el robot: ${JSON.stringify(history)}`
      : 'El robot no ha realizado movimientos previos aún.';

    const estrategaResponse = await client.chat.completions.create({
      model: 'gemma-4-31b',
      messages: [
        {
          role: 'system',
          content: `Eres el cerebro analítico de un robot autónomo de rescate.
Tu tarea es analizar el reporte de mapa provisto por el agente perceptor y el historial de movimientos anteriores del robot.
La posición actual e indiscutible del robot es ${currentRobotCoords}.
Basándote en estos datos, calcula analíticamente la trayectoria más rápida y segura para que el robot avance hacia la meta [9,9] evadiendo los obstáculos detectados.

Debes elegir exactamente una dirección de movimiento inmediato para el robot ("UP", "DOWN", "LEFT" o "RIGHT"), predecir las próximas 3 coordenadas [x, y] de tu trayectoria planificada para optimizar el render, y proveer una explicación corta de máximo 15 palabras de tu decisión.
Minimiza pasos, evita bucles infinitos y no atravieses obstáculos rojos.`,
        },
        {
          role: 'user',
          content: `Posición actual del robot: ${currentRobotCoords}
${historyText}

Reporte de posición y amenazas provisto por el perceptor:
${perceptorReport}`,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'movement_decision',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              next_move: {
                type: 'string',
                enum: ['UP', 'DOWN', 'LEFT', 'RIGHT'],
              },
              path_coordinates: {
                type: 'array',
                items: {
                  type: 'array',
                  items: { type: 'integer' },
                },
                description: 'Lista de las próximas 3 coordenadas predichas [x, y] para optimizar el render',
              },
              reasoning_summary: {
                type: 'string',
                description: 'Explicación ejecutiva de máximo 15 palabras de por qué se eligió ese vector.',
              },
            },
            required: ['next_move', 'path_coordinates', 'reasoning_summary'],
            additionalProperties: false,
          },
        },
      },
      // reasoning_effort is disabled (none) for blazingly fast response
      ...({ reasoning_effort: 'none' } as any),
    });

    const endEstratega = performance.now();
    const estrategaLatency = Math.round(endEstratega - startEstratega);
    const estrategaRawContent = (estrategaResponse as any).choices?.[0]?.message?.content || '{}';
    
    let estrategaDecision = {
      next_move: '',
      path_coordinates: [] as [number, number][],
      reasoning_summary: 'Fallo al parsear decisión estructurada.',
    };

    try {
      estrategaDecision = JSON.parse(estrategaRawContent);
    } catch (parseErr) {
      console.error('Error parsing estratega structured output:', parseErr);
    }

    const estrategaTimeInfo = (estrategaResponse as any).time_info || null;
    const estrategaUsage = estrategaResponse.usage || null;

    // --- CONSOLIDACIÓN DE RESPUESTA ---
    return NextResponse.json({
      perceptorReport,
      estrategaDecision,
      metrics: {
        perceptor: {
          latency: perceptorLatency,
          usage: perceptorUsage,
          timeInfo: perceptorTimeInfo,
        },
        estratega: {
          latency: estrategaLatency,
          usage: estrategaUsage,
          timeInfo: estrategaTimeInfo,
        },
        totalLatency: perceptorLatency + estrategaLatency,
      }
    });

  } catch (error: any) {
    console.error('Error in api/swarm route:', error);
    return NextResponse.json(
      { 
        error: 'Error interno en la ejecución del enjambre de agentes', 
        details: error.message || String(error)
      }, 
      { status: 500 }
    );
  }
}
