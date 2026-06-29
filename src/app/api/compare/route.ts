import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // 1. Wait for 1600ms to simulate the queue, scheduling, and slow execution on standard GPU architectures
    await new Promise((resolve) => setTimeout(resolve, 1600));

    // 2. Generate typical low-performance metrics for a standard cloud GPU instance (representing 15-23 seconds of latency)
    const latency = Math.round(15000 + Math.random() * 8000); // 15000ms - 23000ms
    const ttft = Math.round(1200 + Math.random() * 800);     // 1200ms - 2000ms
    const tokensPerSecond = Math.round(15 + Math.random() * 10); // 15 - 25 t/s

    return NextResponse.json({
      metrics: {
        latency,
        ttft,
        tokensPerSecond,
      }
    });

  } catch (error: any) {
    console.error('Error in api/compare route:', error);
    return NextResponse.json(
      { 
        error: 'Error interno en la ejecución de comparación de GPU', 
        details: error.message || String(error)
      }, 
      { status: 500 }
    );
  }
}
