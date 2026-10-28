import type { Request, Response } from 'express';
import express from 'express';
import serverApp from '../server.ts';

// Vercel Serverless Function entry point
export default function handler(req: any, res: any) {
  return serverApp(req, res);
}
