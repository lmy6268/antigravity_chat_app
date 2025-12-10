import { NextResponse } from 'next/server';
import os from 'os';

export async function GET() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        return NextResponse.json({ host: net.address });
      }
    }
  }
  return NextResponse.json({ host: 'localhost' });
}
