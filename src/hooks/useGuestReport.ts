import { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../services/supabase';
import debounce from 'lodash.debounce';

const DEFAULT_FORM_DATA = {
  cliente: 'Mario Rossi (esempio)',
  data: new Date().toISOString().split('T')[0],
  ore: '4',
  descrizione: 'Intervento elettrico base'
};

export function useGuestReport() {
  const [guestId, setGuestId] = useState<string>('');
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);

  // useRef maintains the debounce instance across renders
  const saveToDb = useRef(
    debounce(async (data: any, id: string) => {
      if (!id) return;
      try {
        const { error } = await supabase.rpc('save_guest_report', { 
          p_guest_id: id, 
          p_data: data 
        });
        if (error) {
          console.error("Errore salvataggio remoto guest report:", error);
        } else {
          console.log("Salvataggio DB riuscito per guest:", id);
        }
      } catch (err) {
        console.error("Eccezione durante l'upsert guest report:", err);
      }
    }, 1500)
  ).current;

  // Initialization
  useEffect(() => {
    let currentId = localStorage.getItem('guest_id');
    if (!currentId) {
      currentId = uuidv4();
      localStorage.setItem('guest_id', currentId);
    }
    setGuestId(currentId);

    const savedLocal = localStorage.getItem('draft_report');
    if (savedLocal) {
      try {
        setFormData(JSON.parse(savedLocal));
      } catch (e) {
        console.error("Errore parse draft_report da localStorage");
      }
    }
    
    // Cleanup the debounce timer when component unmounts
    return () => {
      saveToDb.cancel();
    };
  }, [saveToDb]);

  // The function called by form inputs onChange
  const saveDraft = useCallback((newData: any) => {
    setFormData(newData);
    
    // 1. Save locally immediately
    localStorage.setItem('draft_report', JSON.stringify(newData));
    
    // 2. Queue the remote save via debounce
    if (guestId) {
      saveToDb(newData, guestId);
    }
  }, [guestId, saveToDb]);

  return { guestId, formData, saveDraft };
}
