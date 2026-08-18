import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/database/connection';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();

    const stats = db.prepare(`
      SELECT 
        AVG(credibility) as avgCredibility,
        AVG(prediction_accuracy) as avgAccuracy,
        AVG(calibration_score) as avgCalibration,
        AVG(estimated_value) as avgValue
      FROM agents
    `).get() as Record<string, number>;

    const predictionsCount = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'RESOLVED_TRUE' THEN 1 ELSE 0 END) as correct,
        SUM(CASE WHEN status = 'RESOLVED_FALSE' THEN 1 ELSE 0 END) as incorrect
      FROM predictions
    `).get() as Record<string, number>;

    return NextResponse.json({
      averageCredibility: Math.round(stats.avgCredibility || 50),
      averageAccuracy: Math.round((stats.avgAccuracy || 0.5) * 100),
      averageCalibration: Math.round(stats.avgCalibration || 100),
      averageValue: Math.round(stats.avgValue || 1000),
      totalPredictions: predictionsCount.total || 0,
      correctPredictions: predictionsCount.correct || 0,
      incorrectPredictions: predictionsCount.incorrect || 0,
    });
  } catch (error) {
    console.error('[API] Get global reputation metrics error:', error);
    return NextResponse.json({ error: 'Failed to fetch global reputation metrics' }, { status: 500 });
  }
}
