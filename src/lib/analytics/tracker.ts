import { getDb, generateId, toJson } from '../database/connection';
import type { AnalyticsEvent, DataEvent } from '../types';

export function trackEvent(
  eventName: AnalyticsEvent,
  userId?: string | null,
  metadata: Record<string, any> = {}
): void {
  try {
    const db = getDb();
    const id = generateId();
    const now = new Date().toISOString();

    // 1. Log to legacy analytics_events for backward compatibility
    db.prepare(`
      INSERT INTO analytics_events (id, event_name, user_id, metadata, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, eventName, userId ?? null, toJson(metadata), now);

    console.log(`[Analytics] Tracked event "${eventName}" for user ${userId ?? 'anonymous'}`);

    // 2. Also log as a structured DataEvent in the new append-only data_events store
    const actorType = eventName.startsWith('mind_') || eventName.startsWith('debate_') || eventName.startsWith('prediction_') ? 'AI' : 'USER';
    
    logDataEvent({
      eventType: eventName,
      actorType,
      actorId: userId ?? null,
      anonymousActorId: metadata.sessionId || null,
      entityType: metadata.entityType || null,
      entityId: metadata.entityId || null,
      sessionId: metadata.sessionId || null,
      requestId: metadata.requestId || null,
      metadata,
      source: 'SYSTEM',
      version: '1.0',
      schemaVersion: '1.0',
    });

  } catch (err) {
    console.error('[Analytics] Failed to track event:', err);
  }
}

export function logDataEvent(event: Omit<DataEvent, 'id' | 'eventId' | 'createdAt'>): void {
  try {
    const db = getDb();
    const id = generateId();
    const eventId = generateId();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO data_events (
        id, event_id, event_type, actor_type, actor_id, anonymous_actor_id,
        entity_type, entity_id, session_id, request_id, metadata, source,
        version, schema_version, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      eventId,
      event.eventType,
      event.actorType,
      event.actorId,
      event.anonymousActorId,
      event.entityType,
      event.entityId,
      event.sessionId,
      event.requestId,
      toJson(event.metadata || {}),
      event.source || 'SYSTEM',
      event.version || '1.0',
      event.schemaVersion || '1.0',
      now
    );

    console.log(`[DataIntelligence] Logged event "${event.eventType}"`);
  } catch (err) {
    console.error('[DataIntelligence] Failed to log event:', err);
  }
}
