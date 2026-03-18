import { getDB } from './db';
import { mergePreferRemoteDefined } from '../utils/mergePreferRemoteDefined';

const apiUrlFromEnv = (import.meta.env.VITE_API_URL ?? '').trim();
const API_URL = apiUrlFromEnv
  ? apiUrlFromEnv
  : import.meta.env.DEV
    ? 'http://localhost:3000/api/v1'
    : new URL('api/v1', new URL(import.meta.env.BASE_URL || '/', window.location.origin)).toString().replace(/\/$/, '');

const reviveDate = (value: unknown): Date => new Date(value as string | number | Date);

export const syncService = {
  async syncDemands() {
    const db = await getDB();
    // Fetch all to catch undefined synced status (legacy data)
    const allDemands = await db.getAll('demands');
    const unsyncedDemands = allDemands.filter(d => d.synced !== 1);
    console.log(`[Sync] Found ${unsyncedDemands.length} unsynced demands.`);

    // 1. Push local changes to server
    for (const demand of unsyncedDemands) {
      const capturedUpdatedAt = demand.updatedAt;
      try {
        const response = await fetch(`${API_URL}/demands`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(demand),
        });

        if (response.ok) {
          const currentDb = await getDB();
          const currentDemand = await currentDb.get('demands', demand.id);
          
          // Check if it hasn't changed since we started syncing
          if (currentDemand && new Date(currentDemand.updatedAt).getTime() === new Date(capturedUpdatedAt).getTime()) {
             const tx = currentDb.transaction('demands', 'readwrite');
             const store = tx.objectStore('demands');
             await store.put({ ...currentDemand, synced: 1 });
             await tx.done;
             console.log(`[Sync] Demand ${demand.id} marked as synced.`);
          } else {
             console.warn(`[Sync] Demand ${demand.id} changed during sync. Skipping synced flag update.`);
          }
        } else {
          console.error(`[Sync] Failed to sync demand ${demand.id}: ${response.statusText}`);
        }
      } catch (error) {
        console.error(`[Sync] Error syncing demand ${demand.id}:`, error);
      }
    }

    // 2. Pull remote changes from server
    try {
      const response = await fetch(`${API_URL}/demands`);
      if (response.ok) {
        const serverDemands = await response.json();
        const tx = db.transaction('demands', 'readwrite');
        const store = tx.objectStore('demands');
        let pulledCount = 0;

        for (const serverDemand of serverDemands) {
          // Convert date strings to Date objects
          const revivedDemand = {
            ...serverDemand,
            active: serverDemand.active !== undefined ? serverDemand.active : true,
            createdAt: new Date(serverDemand.createdAt),
            updatedAt: new Date(serverDemand.updatedAt),
            deadline: serverDemand.deadline ? new Date(serverDemand.deadline) : undefined,
            statusHistory: Array.isArray(serverDemand.statusHistory)
              ? serverDemand.statusHistory.map((h: unknown) => {
                  const entry = h as Record<string, unknown>;
                  return {
                    ...entry,
                    startDate: reviveDate(entry.startDate),
                    endDate: entry.endDate ? reviveDate(entry.endDate) : undefined,
                  };
                })
              : undefined,
            timeline: Array.isArray(serverDemand.timeline)
              ? serverDemand.timeline.map((t: unknown) => {
                  const entry = t as Record<string, unknown>;
                  return { ...entry, date: reviveDate(entry.date) };
                })
              : undefined,
            synced: 1 // Mark as synced since it came from server
          };

          const localDemand = await store.get(serverDemand.id);
          
          if (!localDemand) {
            // New demand from server
            await store.put(revivedDemand);
            pulledCount++;
          } else if (localDemand.synced === 1) {
            // Local is synced, safe to update if server has newer version
            // (or just overwrite to be safe and consistent)
            await store.put(revivedDemand);
            pulledCount++;
          } else {
            // Local has unsynced changes. 
            // Conflict resolution: Keep local changes for now.
            console.warn(`[Sync] Skipping update for demand ${serverDemand.id} due to local unsynced changes.`);
          }
        }
        await tx.done;
        console.log(`[Sync] Pulled ${pulledCount} demands from server.`);
      }
    } catch (error) {
      console.error('[Sync] Error fetching demands from server:', error);
    }
  },

  async syncContacts() {
    const db = await getDB();
    // Fetch all to catch undefined synced status (legacy data)
    const allContacts = await db.getAll('contacts');
    const unsyncedContacts = allContacts.filter(c => c.synced !== 1);
    console.log(`[Sync] Found ${unsyncedContacts.length} unsynced contacts.`);

    for (const contact of unsyncedContacts) {
      const capturedUpdatedAt = contact.updatedAt;
      try {
        const response = await fetch(`${API_URL}/contacts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(contact),
        });

        if (response.ok) {
          const currentDb = await getDB();
          const currentContact = await currentDb.get('contacts', contact.id);
          
          if (currentContact && new Date(currentContact.updatedAt).getTime() === new Date(capturedUpdatedAt).getTime()) {
             const tx = currentDb.transaction('contacts', 'readwrite');
             const store = tx.objectStore('contacts');
             await store.put({ ...currentContact, synced: 1 });
             await tx.done;
             console.log(`[Sync] Contact ${contact.id} marked as synced.`);
          } else {
             console.warn(`[Sync] Contact ${contact.id} changed during sync. Skipping synced flag update.`);
          }
        } else {
          const body = await response.text().catch(() => "");
          console.error(
            `[Sync] Failed to sync contact ${contact.id}: HTTP ${response.status} ${response.statusText}`.trim(),
            body ? { body } : undefined
          );
        }
      } catch (error) {
        console.error(`[Sync] Error syncing contact ${contact.id}:`, error);
      }
    }

    // 2. Pull remote changes from server
    try {
      const response = await fetch(`${API_URL}/contacts`);
      if (response.ok) {
        const serverContacts = await response.json();
        const tx = db.transaction('contacts', 'readwrite');
        const store = tx.objectStore('contacts');
        let pulledCount = 0;

        for (const serverContact of serverContacts) {
          const revivedContact = {
            ...serverContact,
            active: serverContact.active !== undefined ? serverContact.active : true,
            createdAt: new Date(serverContact.createdAt),
            updatedAt: new Date(serverContact.updatedAt),
            synced: 1
          };

          const localContact = await store.get(serverContact.id);
          
          if (!localContact) {
            await store.put(revivedContact);
            pulledCount++;
          } else if (localContact.synced === 1) {
            const mergedContact = mergePreferRemoteDefined(localContact, revivedContact);
            await store.put(mergedContact);
            pulledCount++;
          } else {
            console.warn(`[Sync] Skipping update for contact ${serverContact.id} due to local unsynced changes.`);
          }
        }
        await tx.done;
        console.log(`[Sync] Pulled ${pulledCount} contacts from server.`);
      }
    } catch (error) {
      console.error('[Sync] Error fetching contacts from server:', error);
    }
  },
  
  async syncSettings() {
     const db = await getDB();
     const allSettings = await db.getAll('settings');
     const unsyncedSettings = allSettings.filter(s => s.synced !== 1);
     console.log(`[Sync] Found ${unsyncedSettings.length} unsynced settings.`);
     
     for (const setting of unsyncedSettings) {
       try {
         console.info("[Sync][Settings] Pushing settings to server", {
           id: setting.id,
           updatedAt: setting.updatedAt,
           hasRoles: Array.isArray((setting as any).roles),
           hasTratativas: Array.isArray((setting as any).tratativas),
         });
         const response = await fetch(`${API_URL}/settings`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify(setting)
         });
         
         if (response.ok) {
           const capturedUpdated = setting.updatedAt ? new Date(setting.updatedAt).getTime() : undefined;
           const expectedRolesCount = Array.isArray((setting as any).roles) ? (setting as any).roles.length : 0;
           const expectedTratativasCount = Array.isArray((setting as any).tratativas) ? (setting as any).tratativas.length : 0;

           let serverAccepted = false;
           try {
             const verifyResponse = await fetch(`${API_URL}/settings`);
             if (verifyResponse.ok) {
               const settingsArray = await verifyResponse.json();
               const serverSetting = Array.isArray(settingsArray)
                 ? settingsArray.find((s: any) => s?.id === setting.id)
                 : undefined;

               const serverUpdatedAt = serverSetting?.updatedAt ? new Date(serverSetting.updatedAt).getTime() : undefined;
               const serverRolesCount = Array.isArray(serverSetting?.roles) ? serverSetting.roles.length : undefined;
               const serverTratativasCount = Array.isArray(serverSetting?.tratativas) ? serverSetting.tratativas.length : undefined;

               serverAccepted =
                 serverUpdatedAt !== undefined &&
                 (capturedUpdated === undefined || serverUpdatedAt >= capturedUpdated) &&
                 serverRolesCount !== undefined &&
                 serverTratativasCount !== undefined &&
                 serverRolesCount === expectedRolesCount &&
                 serverTratativasCount === expectedTratativasCount;

               if (!serverAccepted) {
                 console.warn("[Sync][Settings] Server verification failed; keeping local as unsynced.", {
                   id: setting.id,
                   capturedUpdated,
                   serverUpdatedAt,
                   expectedRolesCount,
                   expectedTratativasCount,
                   serverRolesCount,
                   serverTratativasCount,
                 });
               }
             } else {
               console.warn("[Sync][Settings] Verification GET /settings failed; keeping local as unsynced.", {
                 status: verifyResponse.status,
                 statusText: verifyResponse.statusText,
               });
             }
           } catch (error) {
             console.warn("[Sync][Settings] Verification request errored; keeping local as unsynced.", error);
           }

           if (serverAccepted) {
             const tx = db.transaction('settings', 'readwrite');
             const store = tx.objectStore('settings');
             const current = await store.get(setting.id);
             const currentUpdated = current?.updatedAt ? new Date(current.updatedAt).getTime() : undefined;
             if (current && (capturedUpdated === undefined || currentUpdated === capturedUpdated)) {
               await store.put({ ...current, synced: 1 });
               console.log(`[Sync] Settings ${setting.id} marked as synced.`);
             } else {
               console.warn(`[Sync] Settings ${setting.id} changed during sync. Skipping synced flag update.`);
             }
             await tx.done;
           }
         } else {
           const body = await response.text().catch(() => "");
           console.error(
             `[Sync][Settings] Failed to push settings: HTTP ${response.status} ${response.statusText}`.trim(),
             body ? { body } : undefined
           );
         }
       } catch (error) {
         console.error(`[Sync] Error syncing settings:`, error);
       }
     }

     // 2. Pull remote changes from server
     try {
       const response = await fetch(`${API_URL}/settings`);
       if (response.ok) {
         const serverSettings = await response.json();
         const tx = db.transaction('settings', 'readwrite');
         const store = tx.objectStore('settings');

         for (const serverSetting of serverSettings) {
           console.info("[Sync][Settings] Pulling settings from server", {
             id: serverSetting?.id,
             hasRoles: Array.isArray((serverSetting as any)?.roles),
             hasTratativas: Array.isArray((serverSetting as any)?.tratativas),
           });
           const revivedSetting = {
             ...serverSetting,
             createdAt: serverSetting.createdAt ? new Date(serverSetting.createdAt) : undefined,
             updatedAt: serverSetting.updatedAt ? new Date(serverSetting.updatedAt) : undefined,
             synced: 1
           };

           const localSetting = await store.get(serverSetting.id);
           
           if (!localSetting) {
             await store.put(revivedSetting);
           } else if (localSetting.synced === 1) {
             const localUpdatedAt = localSetting.updatedAt ? new Date(localSetting.updatedAt).getTime() : undefined;
             const remoteUpdatedAt = revivedSetting.updatedAt ? new Date(revivedSetting.updatedAt).getTime() : undefined;
             if (remoteUpdatedAt !== undefined && (localUpdatedAt === undefined || remoteUpdatedAt >= localUpdatedAt)) {
               const merged = mergePreferRemoteDefined(localSetting, revivedSetting);
               await store.put(merged);
             } else {
               console.warn("[Sync][Settings] Ignoring remote settings due to missing/older updatedAt.", {
                 id: serverSetting?.id,
                 localUpdatedAt,
                 remoteUpdatedAt,
               });
             }
           } else {
             console.warn(`[Sync] Skipping update for settings ${serverSetting.id} due to local unsynced changes.`);
           }
         }
         await tx.done;
       }
     } catch (error) {
       console.error('[Sync] Error fetching settings from server:', error);
     }
  },
  
  async syncMembers() {
    const db = await getDB();
    const allMembers = await db.getAll('members');
    const unsyncedMembers = allMembers.filter(m => m.synced !== 1);
    console.log(`[Sync] Found ${unsyncedMembers.length} unsynced members.`);

    for (const member of unsyncedMembers) {
      const capturedUpdatedAt = member.updatedAt;
      try {
        const response = await fetch(`${API_URL}/members`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(member),
        });

        if (response.ok) {
          const currentDb = await getDB();
          const currentMember = await currentDb.get('members', member.id);
          
          if (currentMember && new Date(currentMember.updatedAt).getTime() === new Date(capturedUpdatedAt).getTime()) {
             const tx = currentDb.transaction('members', 'readwrite');
             const store = tx.objectStore('members');
             await store.put({ ...currentMember, synced: 1 });
             await tx.done;
             console.log(`[Sync] Member ${member.id} marked as synced.`);
          }
        }
      } catch (error) {
        console.error(`[Sync] Error syncing member ${member.id}:`, error);
      }
    }

    // 2. Pull remote changes from server
    try {
      const response = await fetch(`${API_URL}/members`);
      if (response.ok) {
        const serverMembers = await response.json();
        const tx = db.transaction('members', 'readwrite');
        const store = tx.objectStore('members');

        for (const serverMember of serverMembers) {
          const revivedMember = {
            ...serverMember,
            active: serverMember.active !== undefined ? serverMember.active : true,
            createdAt: new Date(serverMember.createdAt),
            updatedAt: new Date(serverMember.updatedAt),
            synced: 1
          };

          const localMember = await store.get(serverMember.id);
          
          if (!localMember) {
            await store.put(revivedMember);
          } else if (localMember.synced === 1) {
            await store.put(revivedMember);
          } else {
            console.warn(`[Sync] Skipping update for member ${serverMember.id} due to local unsynced changes.`);
          }
        }
        await tx.done;
      }
    } catch (error) {
      console.error('[Sync] Error fetching members from server:', error);
    }
  },

  async syncAll() {
    await Promise.all([
      this.syncDemands(),
      this.syncContacts(),
      this.syncSettings(),
      this.syncMembers()
    ]);
  },

  async getUnsyncedCount() {
    const db = await getDB();
    const demands = await db.getAll('demands');
    const contacts = await db.getAll('contacts');
    const members = await db.getAll('members');
    const settings = await db.getAll('settings');

    const unsyncedDemands = demands.filter(d => d.synced !== 1).length;
    const unsyncedContacts = contacts.filter(c => c.synced !== 1).length;
    const unsyncedMembers = members.filter(m => m.synced !== 1).length;
    const unsyncedSettings = settings.filter(s => s.synced !== 1).length;

    return unsyncedDemands + unsyncedContacts + unsyncedMembers + unsyncedSettings;
  }
};
