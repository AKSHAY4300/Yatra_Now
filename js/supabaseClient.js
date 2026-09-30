/**
 * Yatra Now - Supabase Cloud Database Client
 * Handles Real-Time Fleet Sync, Incident Subscriptions, and Database Queries on Supabase
 */

// Default Configuration (Users can override via localStorage or environment)
const DEFAULT_SUPABASE_URL = localStorage.getItem('yatranow_supabase_url') || 'https://xyzcompany.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = localStorage.getItem('yatranow_supabase_anon_key') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_key';

class SupabaseService {
  constructor() {
    this.url = DEFAULT_SUPABASE_URL;
    this.key = DEFAULT_SUPABASE_ANON_KEY;
    this.client = null;
    this.isConnected = false;
    this.init();
  }

  async init() {
    try {
      // Dynamically load official Supabase ESM bundle
      const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
      if (this.url && !this.url.includes('xyzcompany')) {
        this.client = createClient(this.url, this.key);
        this.isConnected = true;
        console.log('[Supabase] Connected to live database at:', this.url);
      } else {
        console.log('[Supabase] Ready for credentials. Operating in hybrid local-sync mode.');
      }
    } catch (err) {
      console.warn('[Supabase] Running in local offline mode:', err.message);
    }
  }

  setCredentials(url, key) {
    this.url = url;
    this.key = key;
    localStorage.setItem('yatranow_supabase_url', url);
    localStorage.setItem('yatranow_supabase_anon_key', key);
    return this.init();
  }

  /**
   * Fetches active buses from Supabase with stops
   */
  async getBuses() {
    if (!this.isConnected || !this.client) return null;
    try {
      const { data, error } = await this.client
        .from('buses')
        .select(`
          *,
          route_stops (*)
        `)
        .order('name');
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('[Supabase] Query fallback to local cache:', err);
      return null;
    }
  }

  /**
   * Updates live GPS telemetry on Supabase
   */
  async updateBusTelemetry(busId, lat, lng, speed, bearing) {
    if (!this.isConnected || !this.client) return null;
    try {
      const { data, error } = await this.client
        .from('buses')
        .update({
          current_lat: lat,
          current_lng: lng,
          speed: speed,
          bearing: bearing,
          updated_at: new Date().toISOString()
        })
        .eq('id', busId);
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('[Supabase] Failed to update telemetry:', err);
      return null;
    }
  }

  /**
   * Subscribes to Realtime Postgres changes for Buses
   */
  subscribeToBuses(callback) {
    if (!this.isConnected || !this.client) return null;
    return this.client
      .channel('public:buses')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'buses' }, payload => {
        console.log('[Supabase Realtime] Bus updated:', payload);
        if (callback) callback(payload);
      })
      .subscribe();
  }

  /**
   * Reports an incident ticket to Supabase
   */
  async createIncident(incident) {
    if (!this.isConnected || !this.client) return null;
    try {
      const { data, error } = await this.client
        .from('incident_reports')
        .insert([{
          bus_id: incident.busId,
          issue_type: incident.type,
          description: incident.description,
          reported_by: incident.reportedBy,
          visible_to_public: incident.visibleToPublic
        }]);
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('[Supabase] Failed to insert incident:', err);
      return null;
    }
  }
}

export const supabaseService = new SupabaseService();
